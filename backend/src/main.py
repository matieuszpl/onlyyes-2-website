from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from starlette.responses import RedirectResponse, StreamingResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc, and_
from pydantic import BaseModel
from typing import Optional, List, Tuple, Dict
from datetime import datetime, timedelta, timezone
import httpx
import asyncio

from .database import engine, Base, get_db
from . import models, auth, config
from .services.azuracast import azuracast_client
from .services.event_broadcaster import event_broadcaster
from .services.xp_system import XP_PER_VOTE, XP_PER_MINUTE_LISTENING, get_rank
from .services.youtube import preview_content
import logging

logger = logging.getLogger(__name__)

async def background_polling():
    """Background task do sprawdzania zmian i wysyłania eventów"""
    last_song_id = None
    while True:
        try:
            now_playing = await azuracast_client.get_now_playing()
            if now_playing and now_playing.get("songId") != last_song_id:
                last_song_id = now_playing.get("songId")
                recent_songs = await azuracast_client.get_recent_songs(10)
                next_song = await azuracast_client.get_next_song()
                
                await event_broadcaster.broadcast("now_playing", now_playing)
                await event_broadcaster.broadcast("recent_songs", {"songs": recent_songs or []})
                await event_broadcaster.broadcast("next_song", next_song or {})
        except Exception as e:
            logger.error(f"Background polling error: {e}", exc_info=True)
        await asyncio.sleep(2)

async def background_xp_tracking():
    """Background task do śledzenia czasu słuchania i przyznawania XP"""
    from .database import AsyncSessionLocal
    
    while True:
        try:
            await asyncio.sleep(60)
            
            active_listeners = event_broadcaster.get_active_listeners()
            authenticated_users = [
                l for l in active_listeners 
                if not l.get("is_guest") and l.get("user_id") and l.get("is_playing", False)
            ]
            
            if not authenticated_users:
                continue
            
            for listener in authenticated_users:
                user_id = listener["user_id"]
                retries = 3
                for attempt in range(retries):
                    try:
                        async with AsyncSessionLocal() as db:
                            result = await db.execute(select(models.User).where(models.User.id == user_id))
                            user = result.scalar_one_or_none()
                            
                            if not user:
                                break
                            
                            result = await db.execute(
                                select(models.ListeningSession).where(
                                    models.ListeningSession.user_id == user_id,
                                    models.ListeningSession.end_time.is_(None)
                                ).order_by(desc(models.ListeningSession.start_time))
                            )
                            active_session = result.scalar_one_or_none()
                            
                            now = datetime.now(timezone.utc)
                            
                            if not active_session:
                                new_session = models.ListeningSession(
                                    user_id=user_id,
                                    start_time=now
                                )
                                db.add(new_session)
                                await db.commit()
                            else:
                                start_time = active_session.start_time
                                if start_time.tzinfo is None:
                                    start_time = start_time.replace(tzinfo=timezone.utc)
                                
                                duration = (now - start_time).total_seconds()
                                minutes_listened = int(duration / 60)
                                
                                if minutes_listened >= 1:
                                    xp_to_award = minutes_listened * XP_PER_MINUTE_LISTENING
                                    user.xp = (user.xp or 0) + xp_to_award
                                    active_session.duration_seconds = int(duration)
                                    active_session.xp_awarded = (active_session.xp_awarded or 0) + xp_to_award
                                    active_session.start_time = now
                                    
                                    xp_award = models.XpAward(
                                        user_id=user_id,
                                        song_id=None,
                                        xp_amount=xp_to_award,
                                        award_type="LISTENING"
                                    )
                                    db.add(xp_award)
                                    await db.commit()
                                    
                                    hour = now.hour
                                    if hour >= 2 and hour < 5:
                                        await _check_and_award_badges_internal(user_id, "NIGHT_SHIFT", db)
                                    
                                    await _check_and_award_badges_internal(user_id, "LISTENING_TIME", db)
                        break
                    except Exception as e:
                        if attempt < retries - 1:
                            await asyncio.sleep(1)
                            continue
                        logger.error(f"Background XP tracking error for user {user_id} after {retries} attempts: {e}", exc_info=True)
                        break
        except Exception as e:
            logger.error(f"Background XP tracking error: {e}", exc_info=True)
            await asyncio.sleep(60)

@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
        
        from sqlalchemy import text
        
        result = await conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='xp'
        """))
        column_exists = result.scalar() is not None
        
        if not column_exists:
            await conn.execute(text("ALTER TABLE users ADD COLUMN xp INTEGER DEFAULT 0"))
            await conn.execute(text("UPDATE users SET xp = 0 WHERE xp IS NULL"))
            logger.info("Added xp column to users table")
        
        result = await conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name='badges'
        """))
        badges_table_exists = result.scalar() is not None
        
        if not badges_table_exists:
            await conn.execute(text("""
                CREATE TABLE badges (
                    id SERIAL PRIMARY KEY,
                    name VARCHAR NOT NULL,
                    description TEXT,
                    icon VARCHAR,
                    color VARCHAR,
                    auto_award_type VARCHAR,
                    auto_award_config TEXT,
                    xp_reward INTEGER DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            """))
            logger.info("Created badges table")
        else:
            result = await conn.execute(text("""
                SELECT column_name 
                FROM information_schema.columns 
                WHERE table_name='badges' AND column_name='xp_reward'
            """))
            xp_reward_exists = result.scalar() is not None
            if not xp_reward_exists:
                await conn.execute(text("ALTER TABLE badges ADD COLUMN xp_reward INTEGER DEFAULT 0"))
                logger.info("Added xp_reward column to badges table")
        
        result = await conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='featured_badge_id'
        """))
        featured_badge_exists = result.scalar() is not None
        
        if not featured_badge_exists:
            await conn.execute(text("ALTER TABLE users ADD COLUMN featured_badge_id INTEGER"))
            try:
                await conn.execute(text("""
                    ALTER TABLE users 
                    ADD CONSTRAINT fk_users_featured_badge 
                    FOREIGN KEY (featured_badge_id) REFERENCES badges(id) ON DELETE SET NULL
                """))
            except Exception as e:
                logger.warning(f"Could not add foreign key constraint (may already exist): {e}")
            logger.info("Added featured_badge_id column to users table")
        
        result = await conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name='user_badges'
        """))
        user_badges_table_exists = result.scalar() is not None
        
        if not user_badges_table_exists:
            await conn.execute(text("""
                CREATE TABLE user_badges (
                    id SERIAL PRIMARY KEY,
                    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                    badge_id INTEGER NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
                    awarded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    awarded_by INTEGER REFERENCES users(id) ON DELETE SET NULL
                )
            """))
            await conn.execute(text("CREATE INDEX idx_user_badges_user_id ON user_badges(user_id)"))
            await conn.execute(text("CREATE INDEX idx_user_badges_badge_id ON user_badges(badge_id)"))
            logger.info("Created user_badges table")
        
        result = await conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='votes' AND column_name='xp_awarded'
        """))
        xp_awarded_exists = result.scalar() is not None
        
        if not xp_awarded_exists:
            await conn.execute(text("ALTER TABLE votes ADD COLUMN xp_awarded BOOLEAN DEFAULT FALSE"))
            await conn.execute(text("UPDATE votes SET xp_awarded = FALSE WHERE xp_awarded IS NULL"))
            logger.info("Added xp_awarded column to votes table")
        
        result = await conn.execute(text("""
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_name='xp_awards'
        """))
        xp_awards_exists = result.scalar() is not None
        
        if not xp_awards_exists:
            await conn.run_sync(Base.metadata.create_all)
            logger.info("Created xp_awards table")
        
        result = await conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='hide_activity'
        """))
        hide_activity_exists = result.scalar() is not None
        
        if not hide_activity_exists:
            await conn.execute(text("ALTER TABLE users ADD COLUMN hide_activity BOOLEAN DEFAULT FALSE"))
            await conn.execute(text("UPDATE users SET hide_activity = FALSE WHERE hide_activity IS NULL"))
            logger.info("Added hide_activity column to users table")
        
        result = await conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='hide_activity_history'
        """))
        hide_activity_history_exists = result.scalar() is not None
        
        if not hide_activity_history_exists:
            await conn.execute(text("ALTER TABLE users ADD COLUMN hide_activity_history BOOLEAN DEFAULT FALSE"))
            await conn.execute(text("UPDATE users SET hide_activity_history = FALSE WHERE hide_activity_history IS NULL"))
            logger.info("Added hide_activity_history column to users table")
        
        result = await conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='google_id'
        """))
        google_id_exists = result.scalar() is not None
        
        if not google_id_exists:
            await conn.execute(text("ALTER TABLE users ADD COLUMN google_id VARCHAR"))
            await conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_google_id ON users(google_id) WHERE google_id IS NOT NULL"))
            logger.info("Added google_id column to users table")
        
        result = await conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='display_name'
        """))
        display_name_exists = result.scalar() is not None
        
        if not display_name_exists:
            await conn.execute(text("ALTER TABLE users ADD COLUMN display_name VARCHAR"))
            await conn.execute(text("UPDATE users SET display_name = username WHERE display_name IS NULL"))
            logger.info("Added display_name column to users table")
        
        result = await conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='avatar_source'
        """))
        avatar_source_exists = result.scalar() is not None
        
        if not avatar_source_exists:
            await conn.execute(text("ALTER TABLE users ADD COLUMN avatar_source VARCHAR DEFAULT 'DISCORD'"))
            await conn.execute(text("UPDATE users SET avatar_source = 'DISCORD' WHERE avatar_source IS NULL"))
            logger.info("Added avatar_source column to users table")
        
        result = await conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='discord_avatar_url'
        """))
        discord_avatar_url_exists = result.scalar() is not None
        
        if not discord_avatar_url_exists:
            await conn.execute(text("ALTER TABLE users ADD COLUMN discord_avatar_url VARCHAR"))
            await conn.execute(text("UPDATE users SET discord_avatar_url = avatar_url WHERE discord_avatar_url IS NULL AND discord_id IS NOT NULL"))
            logger.info("Added discord_avatar_url column to users table")
        
        result = await conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='google_avatar_url'
        """))
        google_avatar_url_exists = result.scalar() is not None
        
        if not google_avatar_url_exists:
            await conn.execute(text("ALTER TABLE users ADD COLUMN google_avatar_url VARCHAR"))
            logger.info("Added google_avatar_url column to users table")
        
        result = await conn.execute(text("""
            SELECT constraint_name 
            FROM information_schema.table_constraints 
            WHERE table_name='users' AND constraint_name='users_discord_id_key'
        """))
        discord_unique_exists = result.scalar() is not None
        
        if not discord_unique_exists:
            try:
                await conn.execute(text("ALTER TABLE users DROP CONSTRAINT IF EXISTS users_discord_id_key"))
                await conn.execute(text("CREATE UNIQUE INDEX IF NOT EXISTS ix_users_discord_id ON users(discord_id) WHERE discord_id IS NOT NULL"))
            except Exception as e:
                logger.warning(f"Could not update discord_id constraint: {e}")
        
        result = await conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='discord_username'
        """))
        discord_username_exists = result.scalar() is not None
        
        if not discord_username_exists:
            await conn.execute(text("ALTER TABLE users ADD COLUMN discord_username VARCHAR"))
            logger.info("Added discord_username column to users table")
        
        result = await conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='google_username'
        """))
        google_username_exists = result.scalar() is not None
        
        if not google_username_exists:
            await conn.execute(text("ALTER TABLE users ADD COLUMN google_username VARCHAR"))
            logger.info("Added google_username column to users table")
        
        result = await conn.execute(text("""
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name='users' AND column_name='email'
        """))
        email_exists = result.scalar() is not None
        
        if not email_exists:
            await conn.execute(text("ALTER TABLE users ADD COLUMN email VARCHAR"))
            logger.info("Added email column to users table")
        
        await initialize_default_badges(conn)
    
    task1 = asyncio.create_task(background_polling())
    task2 = asyncio.create_task(background_xp_tracking())
    yield
    task1.cancel()
    task2.cancel()

async def initialize_default_badges(conn):
    """Inicjalizuje domyślne odznaki w bazie danych"""
    from sqlalchemy import text
    
    default_badges = [
        {
            "name": "Nocna Zmiana",
            "description": "Za słuchanie radia między 2:00 a 5:00 rano",
            "icon": "🌙",
            "color": "#4a5568",
            "auto_award_type": "NIGHT_SHIFT",
            "xp_reward": 50
        },
        {
            "name": "Strażnik Playlisty",
            "description": "Za zgłoszenie błędu w metadanych lub uszkodzonego pliku",
            "icon": "🛡️",
            "color": "#3182ce",
            "auto_award_type": "PLAYLIST_GUARDIAN",
            "xp_reward": 100
        },
        {
            "name": "Współtwórca Playlisty",
            "description": "Za pomoc w tworzeniu playlisty radia (proponowanie piosenek)",
            "icon": "👑",
            "color": "#ffd700",
            "auto_award_type": "PLAYLIST_CONTRIBUTOR",
            "xp_reward": 5000
        },
        {
            "name": "Słuchacz",
            "description": "Za słuchanie radia przez 60 minut",
            "icon": "🎧",
            "color": "#cd7f32",
            "auto_award_type": "LISTENING_TIME",
            "auto_award_config": '{"minutes": 60}',
            "xp_reward": 25
        },
        {
            "name": "Wierny Słuchacz",
            "description": "Za słuchanie radia przez 600 minut",
            "icon": "🎧",
            "color": "#c0c0c0",
            "auto_award_type": "LISTENING_TIME",
            "auto_award_config": '{"minutes": 600}',
            "xp_reward": 150
        },
        {
            "name": "Mistrz Słuchania",
            "description": "Za słuchanie radia przez 6000 minut",
            "icon": "🎧",
            "color": "#ffd700",
            "auto_award_type": "LISTENING_TIME",
            "auto_award_config": '{"minutes": 6000}',
            "xp_reward": 500
        },
        {
            "name": "Fan",
            "description": "Za polubienie 1 utworu",
            "icon": "👍",
            "color": "#cd7f32",
            "auto_award_type": "LIKES",
            "auto_award_config": '{"count": 1}',
            "xp_reward": 10
        },
        {
            "name": "Super Fan",
            "description": "Za polubienie 10 utworów",
            "icon": "👍",
            "color": "#c0c0c0",
            "auto_award_type": "LIKES",
            "auto_award_config": '{"count": 10}',
            "xp_reward": 100
        },
        {
            "name": "Mega Fan",
            "description": "Za polubienie 100 utworów",
            "icon": "👍",
            "color": "#ffd700",
            "auto_award_type": "LIKES",
            "auto_award_config": '{"count": 100}',
            "xp_reward": 500
        },
        {
            "name": "Krytyk",
            "description": "Za nie polubienie 1 utworu",
            "icon": "👎",
            "color": "#cd7f32",
            "auto_award_type": "DISLIKES",
            "auto_award_config": '{"count": 1}',
            "xp_reward": 10
        },
        {
            "name": "Surowość",
            "description": "Za nie polubienie 10 utworów",
            "icon": "👎",
            "color": "#c0c0c0",
            "auto_award_type": "DISLIKES",
            "auto_award_config": '{"count": 10}',
            "xp_reward": 100
        },
        {
            "name": "Mistrz Krytyki",
            "description": "Za nie polubienie 100 utworów",
            "icon": "👎",
            "color": "#ffd700",
            "auto_award_type": "DISLIKES",
            "auto_award_config": '{"count": 100}',
            "xp_reward": 500
        },
        {
            "name": "Słuchacz Audycji",
            "description": "Za słuchanie radia podczas audycji",
            "icon": "📻",
            "color": "#e53e3e",
            "auto_award_type": "SHOW_LISTENER",
            "xp_reward": 75
        },
        {
            "name": "Proponujący",
            "description": "Za zgłoszenie 1 propozycji utworu",
            "icon": "💡",
            "color": "#cd7f32",
            "auto_award_type": "SUGGESTIONS",
            "auto_award_config": '{"count": 1}',
            "xp_reward": 25
        },
        {
            "name": "Aktywny Proponujący",
            "description": "Za zgłoszenie 10 propozycji utworów",
            "icon": "💡",
            "color": "#c0c0c0",
            "auto_award_type": "SUGGESTIONS",
            "auto_award_config": '{"count": 10}',
            "xp_reward": 200
        },
        {
            "name": "Mistrz Propozycji",
            "description": "Za zgłoszenie 100 propozycji utworów",
            "icon": "💡",
            "color": "#ffd700",
            "auto_award_type": "SUGGESTIONS",
            "auto_award_config": '{"count": 100}',
            "xp_reward": 1000
        },
        {
            "name": "Łowca Błędów",
            "description": "Za zgłoszenie 1 zaakceptowanego błędu",
            "icon": "🐛",
            "color": "#cd7f32",
            "auto_award_type": "BUG_REPORTS",
            "auto_award_config": '{"count": 1}',
            "xp_reward": 50
        },
        {
            "name": "Ekspert Debugowania",
            "description": "Za zgłoszenie 10 zaakceptowanych błędów",
            "icon": "🔍",
            "color": "#c0c0c0",
            "auto_award_type": "BUG_REPORTS",
            "auto_award_config": '{"count": 10}',
            "xp_reward": 500
        },
        {
            "name": "Mistrz Jakości",
            "description": "Za zgłoszenie 100 zaakceptowanych błędów",
            "icon": "🏆",
            "color": "#ffd700",
            "auto_award_type": "BUG_REPORTS",
            "auto_award_config": '{"count": 100}',
            "xp_reward": 2000
        },
        {
            "name": "Pomysłodawca",
            "description": "Za zgłoszenie 1 zaakceptowanego pomysłu",
            "icon": "💭",
            "color": "#cd7f32",
            "auto_award_type": "FEATURE_REQUESTS",
            "auto_award_config": '{"count": 1}',
            "xp_reward": 75
        },
        {
            "name": "Wizjoner",
            "description": "Za zgłoszenie 10 zaakceptowanych pomysłów",
            "icon": "✨",
            "color": "#c0c0c0",
            "auto_award_type": "FEATURE_REQUESTS",
            "auto_award_config": '{"count": 10}',
            "xp_reward": 750
        },
        {
            "name": "Architekt Funkcjonalności",
            "description": "Za zgłoszenie 100 zaakceptowanych pomysłów",
            "icon": "🎯",
            "color": "#ffd700",
            "auto_award_type": "FEATURE_REQUESTS",
            "auto_award_config": '{"count": 100}',
            "xp_reward": 3000
        },
    ]
    
    for badge_data in default_badges:
        result = await conn.execute(
            text("SELECT id FROM badges WHERE name = :name"),
            {"name": badge_data["name"]}
        )
        existing = result.scalar_one_or_none()
        
        if not existing:
            await conn.execute(
                text("""
                    INSERT INTO badges (name, description, icon, color, auto_award_type, auto_award_config, xp_reward)
                    VALUES (:name, :description, :icon, :color, :auto_award_type, :auto_award_config, :xp_reward)
                """),
                {
                    "name": badge_data["name"],
                    "description": badge_data["description"],
                    "icon": badge_data["icon"],
                    "color": badge_data["color"],
                    "auto_award_type": badge_data["auto_award_type"],
                    "auto_award_config": badge_data.get("auto_award_config"),
                    "xp_reward": badge_data["xp_reward"]
                }
            )
            logger.info(f"Created default badge: {badge_data['name']}")
        else:
            await conn.execute(
                text("""
                    UPDATE badges 
                    SET description = :description, icon = :icon, color = :color, 
                        auto_award_type = :auto_award_type, auto_award_config = :auto_award_config, 
                        xp_reward = :xp_reward
                    WHERE name = :name
                """),
                {
                    "name": badge_data["name"],
                    "description": badge_data["description"],
                    "icon": badge_data["icon"],
                    "color": badge_data["color"],
                    "auto_award_type": badge_data["auto_award_type"],
                    "auto_award_config": badge_data.get("auto_award_config"),
                    "xp_reward": badge_data["xp_reward"]
                }
            )
            logger.info(f"Updated default badge: {badge_data['name']}")

app = FastAPI(title="ONLY YES Radio API", lifespan=lifespan)

# Usunięto exception handler - nie jest już potrzebny, endpoint /api/users/me/badges jest przed /api/users/{user_id}/badges

# --- KONFIGURACJA SECURITY (KOLEJNOŚĆ JEST WAŻNA!) ---

# 2. Proxy Headers - mówi aplikacji, że stoi za Nginxem i ma ufać nagłówkom
# To naprawia problem generowania linków na złym porcie/protokole
app.add_middleware(ProxyHeadersMiddleware, trusted_hosts="*")

# 3. CORS - Zezwalamy na domenę produkcyjną
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://onlyyes.pl",
        "http://localhost:9523",
        "http://127.0.0.1:9523",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 4. Sesje - Ustawienia dla HTTPS
app.add_middleware(
    SessionMiddleware, 
    secret_key=config.settings.secret_key,
    https_only=True,
    same_site="lax",
    path="/"
)

# --- ENDPOINTY ---

@app.get("/")
async def root():
    return {"message": "ONLY YES Radio API", "port": "9523", "status": "Fixed"}

@app.get("/api/auth/login")
async def login(request: Request):
    redirect_uri = f"{config.settings.app_base_url}/api/auth/callback"
    logger.info(f"Discord login redirect_uri: {redirect_uri}")
    logger.info(f"APP_BASE_URL: {config.settings.app_base_url}")
    return await auth.oauth.discord.authorize_redirect(request, redirect_uri)

@app.get("/api/auth/login/google")
async def login_google(request: Request):
    redirect_uri = f"{config.settings.app_base_url}/api/auth/callback/google"
    return await auth.oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/api/auth/callback")
async def auth_callback(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        token = await auth.oauth.discord.authorize_access_token(request)
    except Exception as e:
        print(f"Błąd OAuth: {e}")
        return {
            "error": "OAuth Failed", 
            "detail": str(e),
            "tip": "Sprobuj wyczyscic ciasteczka w przegladarce dla localhost",
            "session_keys": list(request.session.keys())
        }

    resp = await auth.oauth.discord.get('users/@me', token=token)
    discord_user = resp.json()
    discord_id = discord_user['id']
    discord_email = discord_user.get('email')
    
    # Sprawdź czy istnieje użytkownik z tym Discord ID
    result = await db.execute(select(models.User).where(models.User.discord_id == discord_id))
    db_user = result.scalar_one_or_none()
    
    if db_user:
        # Użytkownik istnieje z tym Discord ID - zaktualizuj dane
        if not db_user.discord_avatar_url and discord_user.get('avatar'):
            avatar_url = f"https://cdn.discordapp.com/avatars/{discord_id}/{discord_user['avatar']}.png"
            db_user.discord_avatar_url = avatar_url
            if db_user.avatar_source == "DISCORD" or not db_user.avatar_url:
                db_user.avatar_url = avatar_url
        if not db_user.discord_username:
            db_user.discord_username = discord_user.get('username')
        if discord_email and not db_user.email:
            db_user.email = discord_email
        await db.commit()
    else:
        # Nie ma użytkownika z tym Discord ID
        # Sprawdź czy istnieje użytkownik z Google, który ma ten sam email
        existing_user = None
        if discord_email:
            # Sprawdź czy istnieje użytkownik z tym samym emailem
            result = await db.execute(select(models.User).where(models.User.email == discord_email))
            existing_user = result.scalar_one_or_none()
        
        if existing_user:
            # Znaleziono użytkownika z tym samym emailem - połącz konta
            if existing_user.discord_id:
                # Użytkownik już ma Discord ID - sprawdź czy to ten sam ID
                if existing_user.discord_id == discord_id:
                    # To ten sam użytkownik - użyj istniejącego konta
                    db_user = existing_user
                    if not db_user.discord_avatar_url and discord_user.get('avatar'):
                        avatar_url = f"https://cdn.discordapp.com/avatars/{discord_id}/{discord_user['avatar']}.png"
                        db_user.discord_avatar_url = avatar_url
                        if db_user.avatar_source == "DISCORD" or not db_user.avatar_url:
                            db_user.avatar_url = avatar_url
                    if not db_user.discord_username:
                        db_user.discord_username = discord_user.get('username')
                    if discord_email and not db_user.email:
                        db_user.email = discord_email
                    await db.commit()
                else:
                    # Inny Discord ID - sprawdź czy ten Discord ID nie jest już przypisany do innego użytkownika
                    discord_id_user = await db.scalar(select(models.User).where(models.User.discord_id == discord_id))
                    if discord_id_user:
                        # Ten Discord ID jest już przypisany do innego użytkownika
                        logger.warning(f"Discord ID {discord_id} is already linked to user {discord_id_user.id}, but email {discord_email} belongs to user {existing_user.id}")
                        # Użyj konta z tym Discord ID (to jest bardziej pewne niż email)
                        db_user = discord_id_user
                        if discord_email and not db_user.email:
                            db_user.email = discord_email
                        await db.commit()
                    else:
                        # Inny Discord ID, ale nie jest przypisany - to nie powinno się zdarzyć, ale na wszelki wypadek
                        logger.warning(f"User {existing_user.id} already has different discord_id {existing_user.discord_id}, but trying to link {discord_id}")
                        # Utwórz nowe konto
                        existing_user = None
            else:
                # Połącz konta - dodaj Discord ID do istniejącego konta
                # Najpierw sprawdź czy ten Discord ID nie jest już przypisany do innego użytkownika
                discord_id_user = await db.scalar(select(models.User).where(models.User.discord_id == discord_id))
                if discord_id_user and discord_id_user.id != existing_user.id:
                    # Ten Discord ID jest już przypisany do innego użytkownika
                    logger.warning(f"Discord ID {discord_id} is already linked to user {discord_id_user.id}, cannot link to user {existing_user.id} with same email")
                    # Użyj konta z tym Discord ID (to jest bardziej pewne niż email)
                    db_user = discord_id_user
                    if discord_email and not db_user.email:
                        db_user.email = discord_email
                    await db.commit()
                else:
                    # Połącz konta - dodaj Discord ID do istniejącego konta
                    avatar_url = None
                    if discord_user.get('avatar'):
                        avatar_url = f"https://cdn.discordapp.com/avatars/{discord_id}/{discord_user['avatar']}.png"
                    
                    existing_user.discord_id = discord_id
                    existing_user.discord_avatar_url = avatar_url
                    existing_user.discord_username = discord_user.get('username')
                    if not existing_user.email:
                        existing_user.email = discord_email
                    
                    # Jeśli użytkownik nie ma avatara lub ma domyślny, użyj Discord avatara
                    if not existing_user.avatar_url or existing_user.avatar_source == "DEFAULT":
                        if avatar_url:
                            existing_user.avatar_url = avatar_url
                            existing_user.avatar_source = "DISCORD"
                    
                    await db.commit()
                    await db.refresh(existing_user)
                    db_user = existing_user
                    logger.info(f"Linked Discord account {discord_id} to existing user {existing_user.id}")
        
        if not existing_user:
            # Nie znaleziono użytkownika z tym samym emailem - utwórz nowe konto
            avatar_url = None
            if discord_user.get('avatar'):
                avatar_url = f"https://cdn.discordapp.com/avatars/{discord_id}/{discord_user['avatar']}.png"
            
            new_user = models.User(
                discord_id=discord_id,
                username=discord_user['username'],
                display_name=discord_user['username'],
                avatar_url=avatar_url,
                avatar_source="DISCORD",
                discord_avatar_url=avatar_url,
                discord_username=discord_user['username'],
                email=discord_email
            )
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            db_user = new_user
    
    request.session['user'] = {**discord_user, 'provider': 'discord'}
    
    return RedirectResponse(url=f"{config.settings.app_base_url}/")

@app.get("/api/auth/callback/google")
async def auth_callback_google(request: Request, db: AsyncSession = Depends(get_db)):
    try:
        token = await auth.oauth.google.authorize_access_token(request)
    except Exception as e:
        logger.error(f"Błąd Google OAuth: {e}")
        return {
            "error": "OAuth Failed", 
            "detail": str(e),
            "tip": "Sprobuj wyczyscic ciasteczka w przegladarce dla localhost",
            "session_keys": list(request.session.keys())
        }

    try:
        resp = await auth.oauth.google.get('userinfo', token=token)
        google_user = resp.json()
        logger.info(f"Google userinfo response: {google_user}")
    except Exception as e:
        logger.error(f"Google userinfo error: {e}")
        return {
            "error": "Userinfo Failed",
            "detail": str(e)
        }
    
    google_id = google_user.get('sub') or google_user.get('id')
    if not google_id:
        logger.error(f"Google user response missing ID. Full response: {google_user}")
        return {
            "error": "Invalid Response",
            "detail": "Google response missing user ID"
        }
    
    google_email = google_user.get('email')
    google_name = google_user.get('name') or google_user.get('email', 'User')
    
    # Sprawdź czy istnieje użytkownik z tym Google ID
    result = await db.execute(select(models.User).where(models.User.google_id == google_id))
    db_user = result.scalar_one_or_none()
    
    if db_user:
        # Użytkownik istnieje z tym Google ID - zaktualizuj dane
        if not db_user.google_avatar_url and google_user.get('picture'):
            avatar_url = google_user['picture']
            db_user.google_avatar_url = avatar_url
            if db_user.avatar_source == "GOOGLE" or not db_user.avatar_url:
                db_user.avatar_url = avatar_url
        if not db_user.google_username:
            db_user.google_username = google_name
        if google_email and not db_user.email:
            db_user.email = google_email
        await db.commit()
    else:
        # Nie ma użytkownika z tym Google ID
        # Sprawdź czy istnieje użytkownik z Discord, który ma ten sam email
        existing_user = None
        if google_email:
            # Sprawdź czy istnieje użytkownik z tym samym emailem
            result = await db.execute(select(models.User).where(models.User.email == google_email))
            existing_user = result.scalar_one_or_none()
        
        if existing_user:
            # Znaleziono użytkownika z tym samym emailem - połącz konta
            if existing_user.google_id:
                # Użytkownik już ma Google ID - sprawdź czy to ten sam ID
                if existing_user.google_id == google_id:
                    # To ten sam użytkownik - użyj istniejącego konta
                    db_user = existing_user
                    if not db_user.google_avatar_url and google_user.get('picture'):
                        avatar_url = google_user['picture']
                        db_user.google_avatar_url = avatar_url
                        if db_user.avatar_source == "GOOGLE" or not db_user.avatar_url:
                            db_user.avatar_url = avatar_url
                    if not db_user.google_username:
                        db_user.google_username = google_name
                    if google_email and not db_user.email:
                        db_user.email = google_email
                    await db.commit()
                else:
                    # Inny Google ID - sprawdź czy ten Google ID nie jest już przypisany do innego użytkownika
                    google_id_user = await db.scalar(select(models.User).where(models.User.google_id == google_id))
                    if google_id_user:
                        # Ten Google ID jest już przypisany do innego użytkownika
                        logger.warning(f"Google ID {google_id} is already linked to user {google_id_user.id}, but email {google_email} belongs to user {existing_user.id}")
                        # Użyj konta z tym Google ID (to jest bardziej pewne niż email)
                        db_user = google_id_user
                        if google_email and not db_user.email:
                            db_user.email = google_email
                        await db.commit()
                    else:
                        # Inny Google ID, ale nie jest przypisany - to nie powinno się zdarzyć, ale na wszelki wypadek
                        logger.warning(f"User {existing_user.id} already has different google_id {existing_user.google_id}, but trying to link {google_id}")
                        # Utwórz nowe konto
                        existing_user = None
            else:
                # Połącz konta - dodaj Google ID do istniejącego konta
                # Najpierw sprawdź czy ten Google ID nie jest już przypisany do innego użytkownika
                google_id_user = await db.scalar(select(models.User).where(models.User.google_id == google_id))
                if google_id_user and google_id_user.id != existing_user.id:
                    # Ten Google ID jest już przypisany do innego użytkownika
                    logger.warning(f"Google ID {google_id} is already linked to user {google_id_user.id}, cannot link to user {existing_user.id} with same email")
                    # Użyj konta z tym Google ID (to jest bardziej pewne niż email)
                    db_user = google_id_user
                    if google_email and not db_user.email:
                        db_user.email = google_email
                    await db.commit()
                else:
                    # Połącz konta - dodaj Google ID do istniejącego konta
                    avatar_url = google_user.get('picture')
                    
                    existing_user.google_id = google_id
                    existing_user.google_avatar_url = avatar_url
                    existing_user.google_username = google_name
                    if not existing_user.email:
                        existing_user.email = google_email
                    
                    # Jeśli użytkownik nie ma avatara lub ma domyślny, użyj Google avatara
                    if not existing_user.avatar_url or existing_user.avatar_source == "DEFAULT":
                        if avatar_url:
                            existing_user.avatar_url = avatar_url
                            existing_user.avatar_source = "GOOGLE"
                    
                    await db.commit()
                    await db.refresh(existing_user)
                    db_user = existing_user
                    logger.info(f"Linked Google account {google_id} to existing user {existing_user.id}")
        
        if not existing_user:
            # Nie znaleziono użytkownika z tym samym emailem - utwórz nowe konto
            avatar_url = google_user.get('picture')
            
            new_user = models.User(
                google_id=google_id,
                username=google_name,
                display_name=google_name,
                avatar_url=avatar_url,
                avatar_source="GOOGLE",
                google_avatar_url=avatar_url,
                google_username=google_name,
                email=google_email
            )
            db.add(new_user)
            await db.commit()
            await db.refresh(new_user)
            db_user = new_user
    
    request.session['user'] = {**google_user, 'id': google_id, 'provider': 'google'}
    
    return RedirectResponse(url=f"{config.settings.app_base_url}/")

@app.get("/api/users/me")
async def read_users_me(request: Request, db: AsyncSession = Depends(get_db)):
    user = await auth.get_current_user(request, db)
    if user:
        xp = user.xp or 0
        rank_info = get_rank(xp)
        
        featured_badge = None
        if user.featured_badge_id:
            badge = await db.get(models.Badge, user.featured_badge_id)
            if badge:
                featured_badge = {
                    "id": badge.id,
                    "name": badge.name,
                    "description": badge.description,
                    "icon": badge.icon,
                    "color": badge.color
                }
        
        default_avatar_color = "#5865F2"
        if featured_badge and featured_badge.get("color"):
            default_avatar_color = featured_badge["color"]
        
        return {
            "is_logged_in": True,
            "id": user.id,
            "username": user.username,
            "display_name": user.display_name or user.username,
            "avatar": user.avatar_url,
            "avatar_source": user.avatar_source or "DISCORD",
            "discord_avatar": user.discord_avatar_url,
            "google_avatar": user.google_avatar_url,
            "has_discord": user.discord_id is not None,
            "has_google": user.google_id is not None,
            "discord_username": user.discord_username,
            "google_username": user.google_username,
            "default_avatar_color": default_avatar_color,
            "is_admin": user.is_admin,
            "reputation_score": user.reputation_score,
            "xp": xp,
            "rank": rank_info,
            "featured_badge": featured_badge,
            "hide_activity": user.hide_activity or False,
            "hide_activity_history": user.hide_activity_history or False
        }
    return {"is_logged_in": False}

@app.get("/api/auth/logout")
async def logout(request: Request):
    request.session.clear()
    return RedirectResponse(url=f"{config.settings.app_base_url}/")

# --- RADIO ENDPOINTS ---

@app.get("/api/radio/now-playing")
async def get_now_playing():
    result = await azuracast_client.get_now_playing()
    if result:
        return result
    
    # Fallback - użyj bezpośredniego stream URL z konfiguracji
    stream_url = config.settings.azuracast_stream_url if config.settings.azuracast_stream_url else None
    
    return {
        "title": "Unknown",
        "artist": "Unknown",
        "thumbnail": None,
        "songId": "",
        "streamUrl": stream_url
    }

@app.get("/api/radio/info")
async def get_radio_info(db: AsyncSession = Depends(get_db)):
    result = await azuracast_client.get_station_info()
    if result:
        return result
    
    return {
        "listeners_online": 0,
        "songs_in_database": 0,
        "songs_played_today": 0
    }

@app.get("/api/radio/stream")
async def proxy_stream():
    """Proxy endpoint dla streamu radiowego - rozwiązuje problem CORS"""
    stream_url = config.settings.azuracast_stream_url
    
    if not stream_url:
        result = await azuracast_client.get_now_playing()
        if result and result.get("streamUrl"):
            stream_url = result["streamUrl"]
    
    if not stream_url:
        raise HTTPException(status_code=404, detail="Stream URL not configured")
    
    async def generate():
        async with httpx.AsyncClient(timeout=30.0) as client:
            async with client.stream("GET", stream_url, headers={"User-Agent": "ONLY-YES-Radio/1.0"}) as response:
                response.raise_for_status()
                async for chunk in response.aiter_bytes():
                    yield chunk
    
    headers = {
        "Content-Type": "audio/mpeg",
        "Cache-Control": "no-cache",
        "Connection": "keep-alive",
    }
    
    return StreamingResponse(generate(), media_type="audio/mpeg", headers=headers)

@app.get("/api/radio/recent-songs")
async def get_recent_songs(limit: int = 10):
    """Pobiera historię ostatnio odtwarzanych utworów"""
    result = await azuracast_client.get_recent_songs(limit)
    if result is not None:
        return result
    return []

@app.get("/api/radio/next-song")
async def get_next_song():
    """Pobiera następny utwór w kolejce"""
    result = await azuracast_client.get_next_song()
    if result:
        return result
    return None

@app.get("/api/radio/schedules/debug")
async def get_schedules_debug():
    """Debug endpoint - zwraca surowe dane z AzuraCast"""
    try:
        import httpx
        from datetime import datetime, timedelta, timezone
        
        base_url = config.settings.azuracast_url.rstrip("/")
        station_id = config.settings.azuracast_station_id
        api_key = config.settings.azuracast_api_key
        
        # Oblicz poniedziałek 00:00 obecnego tygodnia
        now = datetime.now(timezone.utc)
        days_since_monday = now.weekday()
        monday = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
        monday_iso = monday.isoformat().replace('+00:00', 'Z')
        
        url = f"{base_url}/api/station/{station_id}/schedule?now={monday_iso}&rows=100"
        headers = {"Accept": "application/json"}
        if api_key:
            headers["X-API-Key"] = api_key
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            raw_data = response.json()
            
            return {
                "url": url,
                "monday_iso": monday_iso,
                "raw_response": raw_data,
                "raw_response_count": len(raw_data) if isinstance(raw_data, list) else 0,
                "first_item_details": raw_data[0] if isinstance(raw_data, list) and len(raw_data) > 0 else None,
                "sample_items": raw_data[:5] if isinstance(raw_data, list) and len(raw_data) > 0 else []
            }
    except Exception as e:
        logger.error(f"Debug schedule error: {e}", exc_info=True)
        return {"error": str(e)}

@app.get("/api/radio/schedules")
async def get_schedules(limit: Optional[int] = None):
    """Pobiera zaplanowane audycje"""
    result = await azuracast_client.get_schedules()
    
    # Jeśli nie ma audycji, zwróć domyślną "Auto DJ"
    if not result or len(result) == 0:
        return [{
            "id": 0,
            "name": "Auto DJ",
            "start_time": "00:00",
            "end_time": "23:59",
            "days": [0, 1, 2, 3, 4, 5, 6],
            "is_enabled": True
        }]
    
    # Filtruj tylko włączone audycje
    enabled = [s for s in result if s.get("is_enabled", True)]
    
    # Jeśli wszystkie są wyłączone, zwróć Auto DJ
    if len(enabled) == 0:
        return [{
            "id": 0,
            "name": "Auto DJ",
            "start_time": "00:00",
            "end_time": "23:59",
            "days": [0, 1, 2, 3, 4, 5, 6],
            "is_enabled": True
        }]
    
    # Sortuj po czasie rozpoczęcia
    enabled.sort(key=lambda x: x.get("start_time", ""))
    if limit:
        return enabled[:limit]
    return enabled

@app.get("/api/radio/stream-url")
async def get_stream_url():
    """Zwraca URL do streamu do kopiowania"""
    result = await azuracast_client.get_now_playing()
    if result and result.get("streamUrl"):
        return {"streamUrl": result["streamUrl"]}
    
    stream_url = config.settings.azuracast_stream_url
    if stream_url:
        return {"streamUrl": stream_url}
    
    return {"streamUrl": f"{config.settings.app_base_url}/api/radio/stream"}

@app.get("/api/radio/events")
async def radio_events(request: Request, db: AsyncSession = Depends(get_db)):
    """Server-Sent Events endpoint dla aktualizacji radiowych"""
    user = await auth.get_current_user(request, db)
    
    if user:
        listener_id = event_broadcaster.register_listener(
            user_id=user.id,
            username=user.username,
            avatar_url=user.avatar_url,
            is_guest=False
        )
    else:
        listener_id = event_broadcaster.register_listener(
            user_id=None,
            username="Gość",
            avatar_url=None,
            is_guest=True
        )
    
    async def event_generator():
        queue = await event_broadcaster.connect()
        try:
            yield f"data: {{\"type\":\"connected\",\"listener_id\":\"{listener_id}\"}}\n\n"
            while True:
                if await request.is_disconnected():
                    break
                try:
                    message = await asyncio.wait_for(queue.get(), timeout=30.0)
                    yield message
                    event_broadcaster.update_listener_activity(listener_id)
                except asyncio.TimeoutError:
                    yield ": keepalive\n\n"
                    event_broadcaster.update_listener_activity(listener_id)
        finally:
            try:
                if user:
                    result = await db.execute(
                        select(models.ListeningSession).where(
                            models.ListeningSession.user_id == user.id,
                            models.ListeningSession.end_time.is_(None)
                        ).order_by(desc(models.ListeningSession.start_time))
                    )
                    active_session = result.scalar_one_or_none()
                    if active_session:
                        active_session.end_time = datetime.now(timezone.utc)
                        await db.commit()
            except Exception as e:
                logger.error(f"Error closing listening session: {e}", exc_info=True)
            finally:
                event_broadcaster.disconnect(queue)
                event_broadcaster.unregister_listener(listener_id)
    
    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no"
        }
    )

@app.get("/api/radio/active-listeners")
async def get_active_listeners():
    """Endpoint do pobierania listy aktualnie słuchających użytkowników"""
    listeners = event_broadcaster.get_active_listeners()
    return {"listeners": listeners}

class UpdatePlayingStateRequest(BaseModel):
    listener_id: str
    is_playing: bool

@app.post("/api/radio/update-playing-state")
async def update_playing_state(request: UpdatePlayingStateRequest):
    """Endpoint do aktualizacji stanu odtwarzacza"""
    event_broadcaster.update_listener_playing_state(request.listener_id, request.is_playing)
    return {"status": "ok"}

@app.post("/api/webhooks/radio-update")
async def radio_update_webhook(request: Request):
    """Webhook do odbierania aktualizacji z AzuraCast lub wewnętrznych"""
    try:
        body = await request.json()
        event_type = body.get("type", "song_change")
        
        if event_type == "song_change":
            now_playing = await azuracast_client.get_now_playing()
            recent_songs = await azuracast_client.get_recent_songs(10)
            next_song = await azuracast_client.get_next_song()
            
            await event_broadcaster.broadcast("now_playing", now_playing or {})
            await event_broadcaster.broadcast("recent_songs", {"songs": recent_songs or []})
            await event_broadcaster.broadcast("next_song", next_song or {})
        elif event_type == "now_playing":
            now_playing = await azuracast_client.get_now_playing()
            await event_broadcaster.broadcast("now_playing", now_playing or {})
        elif event_type == "recent_songs":
            recent_songs = await azuracast_client.get_recent_songs(10)
            await event_broadcaster.broadcast("recent_songs", {"songs": recent_songs or []})
        elif event_type == "next_song":
            next_song = await azuracast_client.get_next_song()
            await event_broadcaster.broadcast("next_song", next_song or {})
        
        return {"status": "success"}
    except Exception as e:
        logger.error(f"Webhook error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=str(e))

# --- VOTES ---

class VoteRequest(BaseModel):
    song_id: str
    vote_type: str  # LIKE, DISLIKE

@app.get("/api/votes/{song_id}")
async def get_user_vote(song_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    user = await auth.get_current_user(request, db)
    if not user:
        return {"vote_type": None}
    
    result = await db.execute(
        select(models.Vote).where(
            models.Vote.user_id == user.id,
            models.Vote.song_id == song_id
        )
    )
    existing_vote = result.scalar_one_or_none()
    
    return {"vote_type": existing_vote.vote_type if existing_vote else None}

@app.post("/api/votes")
async def create_vote(vote: VoteRequest, request: Request, db: AsyncSession = Depends(get_db)):
    user = await auth.get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = await db.execute(
        select(models.Vote).where(
            models.Vote.user_id == user.id,
            models.Vote.song_id == vote.song_id
        )
    )
    existing_vote = result.scalar_one_or_none()
    
    should_award_xp = False
    
    xp_check = await db.execute(
        select(models.XpAward).where(
            models.XpAward.user_id == user.id,
            models.XpAward.song_id == vote.song_id,
            models.XpAward.award_type == "VOTE"
        )
    )
    xp_already_awarded = xp_check.scalar_one_or_none() is not None
    
    if existing_vote:
        existing_vote.vote_type = vote.vote_type
        if not xp_already_awarded:
            should_award_xp = True
            existing_vote.xp_awarded = True
    else:
        new_vote = models.Vote(
            user_id=user.id,
            song_id=vote.song_id,
            vote_type=vote.vote_type,
            xp_awarded=not xp_already_awarded
        )
        db.add(new_vote)
        if not xp_already_awarded:
            should_award_xp = True
    
    if should_award_xp:
        user.xp = (user.xp or 0) + XP_PER_VOTE
        xp_award = models.XpAward(
            user_id=user.id,
            song_id=vote.song_id,
            xp_amount=XP_PER_VOTE,
            award_type="VOTE"
        )
        db.add(xp_award)
    
    await db.commit()
    await db.refresh(user)
    
    if vote.vote_type == "LIKE":
        await _check_and_award_badges_internal(user.id, "LIKES", db)
    elif vote.vote_type == "DISLIKE":
        await _check_and_award_badges_internal(user.id, "DISLIKES", db)
    
    return {"status": "success", "vote_type": vote.vote_type, "xp_awarded": should_award_xp}

@app.delete("/api/votes/{song_id}")
async def delete_vote(song_id: str, request: Request, db: AsyncSession = Depends(get_db)):
    user = await auth.get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = await db.execute(
        select(models.Vote).where(
            models.Vote.user_id == user.id,
            models.Vote.song_id == song_id
        )
    )
    existing_vote = result.scalar_one_or_none()
    
    if existing_vote:
        await db.delete(existing_vote)
        await db.commit()
    
    return {"status": "success"}

# --- SUGGESTIONS ---

class SuggestionPreviewRequest(BaseModel):
    input: str

class SuggestionCreateRequest(BaseModel):
    input: str
    title: Optional[str] = None
    artist: Optional[str] = None
    source_type: str
    thumbnail_url: Optional[str] = None
    duration_seconds: Optional[int] = None
    youtube_id: Optional[str] = None
    url: Optional[str] = None

class SuggestionBatchCreateRequest(BaseModel):
    items: List[Dict]

class BulkUploadRequest(BaseModel):
    drive_link: str

@app.post("/api/suggestions/preview")
async def preview_suggestion(preview: SuggestionPreviewRequest, request: Request, db: AsyncSession = Depends(get_db)):
    user = await auth.get_current_user(request, db)
    
    try:
        result = preview_content(preview.input)
        
        if result.get('type') == 'error':
            raise HTTPException(status_code=400, detail=result.get('message', 'Błąd podczas pobierania informacji'))
        
        async def check_existing_suggestions(items):
            """Sprawdza które propozycje już istnieją dla użytkownika"""
            if not user:
                return {}
            
            existing_map = {}
            now = datetime.now(timezone.utc)
            cutoff = now - timedelta(days=30)
            
            for item in items:
                youtube_id = item.get('youtube_id')
                url = item.get('url', '')
                
                query = select(models.Suggestion).where(
                    models.Suggestion.user_id == user.id,
                    models.Suggestion.created_at >= cutoff
                )
                
                if youtube_id:
                    query = query.where(models.Suggestion.youtube_id == youtube_id)
                elif url:
                    query = query.where(models.Suggestion.raw_input == url)
                else:
                    continue
                
                result_db = await db.execute(query.order_by(desc(models.Suggestion.created_at)).limit(1))
                existing = result_db.scalar_one_or_none()
                
                if existing:
                    key = youtube_id or url
                    existing_map[key] = {
                        "id": existing.id,
                        "status": existing.status,
                        "created_at": existing.created_at.isoformat()
                    }
            
            return existing_map
        
        if result.get('type') == 'playlist':
            items = result.get('items', [])
            existing_map = await check_existing_suggestions(items)
            
            enriched_items = []
            for item in items:
                key = item.get('youtube_id') or item.get('url', '')
                existing = existing_map.get(key)
                enriched_item = {**item}
                if existing:
                    enriched_item['existing'] = existing
                enriched_items.append(enriched_item)
            
            return {
                "type": "playlist",
                "items": enriched_items,
                "count": result.get('count', 0)
            }
        elif result.get('type') == 'single':
            item = result.get('item', {})
            items = [item]
            existing_map = await check_existing_suggestions(items)
            
            key = item.get('youtube_id') or item.get('url', '')
            existing = existing_map.get(key)
            
            response = {
                "type": "single",
                "title": item.get('title'),
                "artist": item.get('artist'),
                "thumbnail": item.get('thumbnail'),
                "source_type": item.get('source_type', 'YOUTUBE'),
                "duration_seconds": item.get('duration_seconds', 0),
                "youtube_id": item.get('youtube_id'),
                "url": item.get('url')
            }
            
            if existing:
                response['existing'] = existing
            
            return response
        else:
            raise HTTPException(status_code=400, detail="Nieznany typ wyniku")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Preview error: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail=f"Błąd podczas przetwarzania: {str(e)}")

async def check_suggestion_rate_limit(user_id: int, db: AsyncSession) -> Tuple[bool, int]:
    """Sprawdza rate limiting dla propozycji. Zwraca (allowed, seconds_until_next)"""
    now = datetime.now(timezone.utc)
    
    recent_count = await db.scalar(
        select(func.count(models.Suggestion.id)).where(
            models.Suggestion.user_id == user_id,
            models.Suggestion.created_at >= now - timedelta(hours=1)
        )
    )
    if recent_count is None:
        recent_count = 0
    
    if recent_count < 5:
        return (True, 0)
    elif recent_count < 10:
        return (True, 10)
    elif recent_count < 20:
        return (True, 30)
    else:
        last_suggestion = await db.scalar(
            select(models.Suggestion.created_at).where(
                models.Suggestion.user_id == user_id
            ).order_by(desc(models.Suggestion.created_at)).limit(1)
        )
        if last_suggestion:
            seconds_passed = (now - last_suggestion).total_seconds()
            if seconds_passed < 60:
                return (False, int(60 - seconds_passed))
        return (True, 60)

async def check_duplicate_suggestion(user_id: int, youtube_id: Optional[str], raw_input: str, db: AsyncSession) -> Optional[models.Suggestion]:
    """Sprawdza czy propozycja już istnieje. Zwraca istniejącą propozycję lub None"""
    now = datetime.now(timezone.utc)
    cutoff = now - timedelta(days=30)
    
    query = select(models.Suggestion).where(
        models.Suggestion.user_id == user_id,
        models.Suggestion.created_at >= cutoff
    )
    
    if youtube_id:
        query = query.where(models.Suggestion.youtube_id == youtube_id)
    else:
        query = query.where(models.Suggestion.raw_input == raw_input)
    
    result = await db.execute(query.order_by(desc(models.Suggestion.created_at)).limit(1))
    return result.scalar_one_or_none()

@app.post("/api/suggestions")
async def create_suggestion(suggestion: SuggestionCreateRequest, request: Request, db: AsyncSession = Depends(get_db)):
    user = await auth.get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    allowed, wait_seconds = await check_suggestion_rate_limit(user.id, db)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Zbyt wiele propozycji. Spróbuj ponownie za {wait_seconds} sekund."
        )
    
    existing = await check_duplicate_suggestion(
        user.id,
        suggestion.youtube_id,
        suggestion.input,
        db
    )
    
    if existing:
        return {
            "status": "duplicate",
            "id": existing.id,
            "message": "Ta propozycja została już wysłana",
            "existing_status": existing.status
        }
    
    new_suggestion = models.Suggestion(
        user_id=user.id,
        raw_input=suggestion.input,
        source_type=suggestion.source_type,
        title=suggestion.title,
        artist=suggestion.artist,
        thumbnail_url=suggestion.thumbnail_url,
        duration_seconds=suggestion.duration_seconds,
        youtube_id=suggestion.youtube_id,
        status="PENDING"
    )
    db.add(new_suggestion)
    await db.commit()
    await db.refresh(new_suggestion)
    
    await _check_and_award_badges_internal(user.id, "SUGGESTIONS", db)
    
    return {"status": "success", "id": new_suggestion.id}

@app.post("/api/suggestions/batch")
async def create_suggestions_batch(batch: SuggestionBatchCreateRequest, request: Request, db: AsyncSession = Depends(get_db)):
    user = await auth.get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if not batch.items or len(batch.items) == 0:
        raise HTTPException(status_code=400, detail="Brak utworów do dodania")
    
    if len(batch.items) > 50:
        raise HTTPException(status_code=400, detail="Maksymalnie 50 utworów na raz")
    
    allowed, wait_seconds = await check_suggestion_rate_limit(user.id, db)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Zbyt wiele propozycji. Spróbuj ponownie za {wait_seconds} sekund."
        )
    
    created_ids = []
    duplicate_ids = []
    skipped_count = 0
    
    for item in batch.items:
        raw_input = item.get('input', item.get('url', ''))
        youtube_id = item.get('youtube_id')
        
        existing = await check_duplicate_suggestion(user.id, youtube_id, raw_input, db)
        
        if existing:
            duplicate_ids.append({
                "youtube_id": youtube_id,
                "title": item.get('title'),
                "existing_id": existing.id,
                "existing_status": existing.status
            })
            skipped_count += 1
            continue
        
        new_suggestion = models.Suggestion(
            user_id=user.id,
            raw_input=raw_input,
            source_type=item.get('source_type', 'YOUTUBE'),
            title=item.get('title'),
            artist=item.get('artist'),
            thumbnail_url=item.get('thumbnail_url') or item.get('thumbnail'),
            duration_seconds=item.get('duration_seconds', 0),
            youtube_id=youtube_id,
            status="PENDING"
        )
        db.add(new_suggestion)
        created_ids.append(new_suggestion)
    
    await db.commit()
    
    for suggestion in created_ids:
        await db.refresh(suggestion)
    
    if len(created_ids) > 0:
        await _check_and_award_badges_internal(user.id, "SUGGESTIONS", db)
    
    return {
        "status": "success",
        "count": len(created_ids),
        "skipped": skipped_count,
        "ids": [s.id for s in created_ids],
        "duplicates": duplicate_ids
    }

@app.get("/api/suggestions")
async def get_suggestions(request: Request, db: AsyncSession = Depends(get_db)):
    user = await auth.get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if user.is_admin:
        result = await db.execute(
            select(models.Suggestion).order_by(desc(models.Suggestion.created_at))
        )
        suggestions = result.scalars().all()
    else:
        result = await db.execute(
            select(models.Suggestion)
            .where(models.Suggestion.user_id == user.id)
            .order_by(desc(models.Suggestion.created_at))
        )
        suggestions = result.scalars().all()
    
    return [
        {
            "id": s.id,
            "user_id": s.user_id,
            "raw_input": s.raw_input,
            "source_type": s.source_type,
            "title": s.title,
            "artist": s.artist,
            "thumbnail_url": s.thumbnail_url,
            "youtube_id": s.youtube_id,
            "status": s.status,
            "created_at": s.created_at.isoformat()
        }
        for s in suggestions
    ]

@app.post("/api/suggestions/{suggestion_id}/approve")
async def approve_suggestion(suggestion_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    user = await auth.get_current_user(request, db)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    
    result = await db.execute(select(models.Suggestion).where(models.Suggestion.id == suggestion_id))
    suggestion = result.scalar_one_or_none()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    suggestion.status = "APPROVED"
    await db.commit()
    
    await _check_and_award_badges_internal(suggestion.user_id, "PLAYLIST_CONTRIBUTOR", db)
    
    return {"status": "success"}

@app.post("/api/suggestions/{suggestion_id}/reject")
async def reject_suggestion(suggestion_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    user = await auth.get_current_user(request, db)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    
    result = await db.execute(select(models.Suggestion).where(models.Suggestion.id == suggestion_id))
    suggestion = result.scalar_one_or_none()
    if not suggestion:
        raise HTTPException(status_code=404, detail="Suggestion not found")
    
    suggestion.status = "REJECTED"
    await db.commit()
    return {"status": "success"}

def is_valid_google_drive_link(url: str) -> bool:
    """Sprawdza czy link jest do Google Drive"""
    if not url or not url.strip():
        return False
    
    patterns = [
        r'^https?://(drive\.google\.com|docs\.google\.com)',
        r'^https?://.*google.*drive',
    ]
    
    import re
    return any(re.search(pattern, url.strip(), re.IGNORECASE) for pattern in patterns)

@app.post("/api/suggestions/bulk-upload")
async def bulk_upload_suggestion(bulk: BulkUploadRequest, request: Request, db: AsyncSession = Depends(get_db)):
    user = await auth.get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if not is_valid_google_drive_link(bulk.drive_link):
        raise HTTPException(status_code=400, detail="Akceptujemy tylko linki do Google Drive")
    
    allowed, wait_seconds = await check_suggestion_rate_limit(user.id, db)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Zbyt wiele propozycji. Spróbuj ponownie za {wait_seconds} sekund."
        )
    
    new_suggestion = models.Suggestion(
        user_id=user.id,
        raw_input=bulk.drive_link,
        source_type="GOOGLE_DRIVE",
        title="Paczka utworów z Google Drive",
        artist="Bulk Upload",
        status="PENDING"
    )
    db.add(new_suggestion)
    await db.commit()
    await db.refresh(new_suggestion)
    
    await _check_and_award_badges_internal(user.id, "SUGGESTIONS", db)
    
    return {"status": "success", "id": new_suggestion.id, "message": "Propozycja wysłana! Administrator przetworzy pliki."}

# --- CHARTS ---

@app.get("/api/charts")
async def get_charts(period: str = "week", limit: int = 10, db: AsyncSession = Depends(get_db)):
    if period == "week":
        since = datetime.utcnow() - timedelta(days=7)
    elif period == "month":
        since = datetime.utcnow() - timedelta(days=30)
    else:
        since = datetime.min
    
    result = await db.execute(
        select(
            models.Vote.song_id,
            func.count(models.Vote.id).label("votes_count")
        )
        .where(
            models.Vote.vote_type == "LIKE",
            models.Vote.created_at >= since
        )
        .group_by(models.Vote.song_id)
        .order_by(desc("votes_count"))
        .limit(limit)
    )
    
    charts = result.all()
    
    prev_since = None
    prev_until = None
    if period == "week":
        prev_since = datetime.utcnow() - timedelta(days=14)
        prev_until = datetime.utcnow() - timedelta(days=7)
    elif period == "month":
        prev_since = datetime.utcnow() - timedelta(days=60)
        prev_until = datetime.utcnow() - timedelta(days=30)
    
    prev_positions = {}
    if prev_since:
        prev_result = await db.execute(
            select(
                models.Vote.song_id,
                func.count(models.Vote.id).label("votes_count")
            )
            .where(
                models.Vote.vote_type == "LIKE",
                models.Vote.created_at >= prev_since,
                models.Vote.created_at < prev_until
            )
            .group_by(models.Vote.song_id)
            .order_by(desc("votes_count"))
            .limit(limit * 2)
        )
        prev_charts = prev_result.all()
        for prev_idx, prev_chart in enumerate(prev_charts):
            prev_positions[prev_chart.song_id] = prev_idx + 1
    
    song_ids = [chart.song_id for chart in charts]
    songs_info = await azuracast_client.get_songs_info_batch(song_ids)
    
    chart_list = []
    for idx, chart in enumerate(charts):
        song_info = songs_info.get(str(chart.song_id), {})
        current_pos = idx + 1
        prev_pos = prev_positions.get(chart.song_id)
        is_new = prev_pos is None
        
        chart_list.append({
            "position": current_pos,
            "song_id": chart.song_id,
            "title": song_info.get("title", ""),
            "artist": song_info.get("artist", ""),
            "thumbnail": song_info.get("thumbnail"),
            "votes": chart.votes_count,
            "previous_position": prev_pos,
            "is_new": is_new
        })
    
    return chart_list

@app.get("/api/charts/worst")
async def get_worst_charts(period: str = "week", limit: int = 10, db: AsyncSession = Depends(get_db)):
    if period == "week":
        since = datetime.utcnow() - timedelta(days=7)
    elif period == "month":
        since = datetime.utcnow() - timedelta(days=30)
    else:
        since = datetime.min
    
    result = await db.execute(
        select(
            models.Vote.song_id,
            func.count(models.Vote.id).label("votes_count")
        )
        .where(
            models.Vote.vote_type == "DISLIKE",
            models.Vote.created_at >= since
        )
        .group_by(models.Vote.song_id)
        .order_by(desc("votes_count"))
        .limit(limit)
    )
    
    charts = result.all()
    
    prev_since = None
    prev_until = None
    if period == "week":
        prev_since = datetime.utcnow() - timedelta(days=14)
        prev_until = datetime.utcnow() - timedelta(days=7)
    elif period == "month":
        prev_since = datetime.utcnow() - timedelta(days=60)
        prev_until = datetime.utcnow() - timedelta(days=30)
    
    prev_positions = {}
    if prev_since:
        prev_result = await db.execute(
            select(
                models.Vote.song_id,
                func.count(models.Vote.id).label("votes_count")
            )
            .where(
                models.Vote.vote_type == "DISLIKE",
                models.Vote.created_at >= prev_since,
                models.Vote.created_at < prev_until
            )
            .group_by(models.Vote.song_id)
            .order_by(desc("votes_count"))
            .limit(limit * 2)
        )
        prev_charts = prev_result.all()
        for prev_idx, prev_chart in enumerate(prev_charts):
            prev_positions[prev_chart.song_id] = prev_idx + 1
    
    song_ids = [chart.song_id for chart in charts]
    songs_info = await azuracast_client.get_songs_info_batch(song_ids)
    
    chart_list = []
    for idx, chart in enumerate(charts):
        song_info = songs_info.get(str(chart.song_id), {})
        current_pos = idx + 1
        prev_pos = prev_positions.get(chart.song_id)
        is_new = prev_pos is None
        
        chart_list.append({
            "position": current_pos,
            "song_id": chart.song_id,
            "title": song_info.get("title", ""),
            "artist": song_info.get("artist", ""),
            "thumbnail": song_info.get("thumbnail"),
            "votes": chart.votes_count,
            "previous_position": prev_pos,
            "is_new": is_new
        })
    
    return chart_list

# --- USER PROFILE ---

@app.get("/api/users/me/history")
async def get_user_history(request: Request, db: AsyncSession = Depends(get_db)):
    user = await auth.get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    suggestions_result = await db.execute(
        select(models.Suggestion)
        .where(models.Suggestion.user_id == user.id)
        .order_by(desc(models.Suggestion.created_at))
        .limit(20)
    )
    suggestions = suggestions_result.scalars().all()
    
    votes_result = await db.execute(
        select(models.Vote)
        .where(models.Vote.user_id == user.id)
        .order_by(desc(models.Vote.created_at))
        .limit(20)
    )
    votes = votes_result.scalars().all()
    
    history = []
    for s in suggestions:
        history.append({
            "id": s.id,
            "type": "suggestion",
            "title": s.title or "Unknown",
            "artist": s.artist or "Unknown",
            "status": s.status,
            "created_at": s.created_at.isoformat()
        })
    
    for v in votes:
        song_info = await azuracast_client.get_song_info(v.song_id)
        history.append({
            "id": v.id,
            "type": "vote",
            "title": song_info.get("title", f"Song {v.song_id}") if song_info else f"Song {v.song_id}",
            "artist": song_info.get("artist", "Unknown") if song_info else "Unknown",
            "thumbnail": song_info.get("thumbnail") if song_info else None,
            "vote_type": v.vote_type,
            "created_at": v.created_at.isoformat()
        })
    
    history.sort(key=lambda x: x["created_at"], reverse=True)
    return history[:20]

@app.get("/api/users/me/xp-history")
async def get_user_xp_history(request: Request, db: AsyncSession = Depends(get_db)):
    from datetime import timedelta
    
    user = await auth.get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    xp_history = []
    
    votes_result = await db.execute(
        select(models.XpAward)
        .where(
            models.XpAward.user_id == user.id,
            models.XpAward.award_type == "VOTE",
            models.XpAward.song_id.isnot(None)
        )
        .order_by(desc(models.XpAward.created_at))
        .limit(100)
    )
    votes = votes_result.scalars().all()
    
    for award in votes:
        song_info = await azuracast_client.get_song_info(award.song_id)
        xp_history.append({
            "id": f"award_{award.id}",
            "type": "vote",
            "xp": award.xp_amount,
            "description": "Głosowanie na utwór",
            "title": song_info.get("title", f"Song {award.song_id}") if song_info else f"Song {award.song_id}",
            "artist": song_info.get("artist", "Unknown") if song_info else "Unknown",
            "created_at": award.created_at.isoformat()
        })
    
    listening_result = await db.execute(
        select(models.XpAward)
        .where(
            models.XpAward.user_id == user.id,
            models.XpAward.award_type == "LISTENING"
        )
        .order_by(desc(models.XpAward.created_at))
        .limit(500)
    )
    listening_awards = listening_result.scalars().all()
    
    if listening_awards:
        grouped_sessions = []
        current_group = []
        
        for award in listening_awards:
            if not current_group:
                current_group.append(award)
            else:
                last_award = current_group[-1]
                time_diff = (last_award.created_at - award.created_at).total_seconds()
                
                if time_diff <= 300:
                    current_group.append(award)
                else:
                    if current_group:
                        total_xp = sum(a.xp_amount for a in current_group)
                        minutes = total_xp
                        grouped_sessions.append({
                            "id": f"session_{current_group[0].id}",
                            "type": "listening",
                            "xp": total_xp,
                            "description": f"Czas słuchania ({minutes} min)",
                            "title": None,
                            "artist": None,
                            "created_at": current_group[0].created_at.isoformat()
                        })
                    current_group = [award]
        
        if current_group:
            total_xp = sum(a.xp_amount for a in current_group)
            minutes = total_xp
            grouped_sessions.append({
                "id": f"session_{current_group[0].id}",
                "type": "listening",
                "xp": total_xp,
                "description": f"Czas słuchania ({minutes} min)",
                "title": None,
                "artist": None,
                "created_at": current_group[0].created_at.isoformat()
            })
        
        xp_history.extend(grouped_sessions)
    
    xp_history.sort(key=lambda x: x["created_at"] if x["created_at"] else "", reverse=True)
    
    return xp_history[:100]

@app.get("/api/users/me/stats")
async def get_user_stats(request: Request, db: AsyncSession = Depends(get_db)):
    user = await auth.get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    suggestions_count = await db.scalar(
        select(func.count(models.Suggestion.id)).where(models.Suggestion.user_id == user.id)
    )
    
    votes_count = await db.scalar(
        select(func.count(models.Vote.id)).where(models.Vote.user_id == user.id)
    )
    
    return {
        "suggestions_count": suggestions_count or 0,
        "votes_count": votes_count or 0,
        "reputation_score": user.reputation_score
    }

@app.get("/api/leaderboard")
async def get_leaderboard(limit: int = 100, db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(models.User)
        .where(models.User.hide_activity == False)
        .order_by(desc(models.User.xp))
        .limit(limit)
    )
    users = result.scalars().all()
    
    leaderboard = []
    for idx, user in enumerate(users, 1):
        xp = user.xp or 0
        rank_info = get_rank(xp)
        leaderboard.append({
            "rank": idx,
            "id": user.id,
            "username": user.username,
            "avatar_url": user.avatar_url,
            "xp": xp,
            "rank_name": rank_info["name"],
            "progress": rank_info["progress"],
            "next_rank": rank_info["next_rank"],
            "next_rank_xp": rank_info["next_rank_xp"],
        })
    
    return leaderboard

@app.get("/api/users/{user_id}/stats")
async def get_user_stats_by_id(user_id: int, db: AsyncSession = Depends(get_db)):
    user = await db.get(models.User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    suggestions_count = await db.scalar(
        select(func.count(models.Suggestion.id)).where(models.Suggestion.user_id == user.id)
    )
    
    votes_count = await db.scalar(
        select(func.count(models.Vote.id)).where(models.Vote.user_id == user.id)
    )
    
    xp = user.xp or 0
    rank_info = get_rank(xp)
    
    featured_badge = None
    if user.featured_badge_id:
        badge = await db.get(models.Badge, user.featured_badge_id)
        if badge:
            featured_badge = {
                "id": badge.id,
                "name": badge.name,
                "description": badge.description,
                "icon": badge.icon,
                "color": badge.color
            }
    
    return {
        "user_id": user.id,
        "username": user.username,
        "avatar_url": user.avatar_url,
        "is_admin": user.is_admin,
        "suggestions_count": suggestions_count or 0,
        "votes_count": votes_count or 0,
        "reputation_score": user.reputation_score,
        "xp": xp,
        "rank": rank_info,
        "featured_badge": featured_badge
    }

# --- PLAYLISTS ---

@app.get("/api/playlists")
async def get_playlists():
    """Pobiera listę playlist z AzuraCast"""
    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            base_url = config.settings.azuracast_url.rstrip("/")
            station_id = config.settings.azuracast_station_id
            api_key = config.settings.azuracast_api_key
            
            url = f"{base_url}/api/station/{station_id}/playlists"
            headers = {"Accept": "application/json"}
            if api_key:
                headers["X-API-Key"] = api_key
            
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            playlists = response.json()
            
            if not isinstance(playlists, list):
                return []
            
            # Filtruj tylko włączone playlisty i zwróć podstawowe info
            result = []
            for playlist in playlists:
                if playlist.get("is_enabled", True):
                    result.append({
                        "id": playlist.get("id"),
                        "name": playlist.get("name", "Unknown"),
                        "num_songs": playlist.get("num_songs", 0),
                        "total_length": playlist.get("total_length", 0),
                        "type": playlist.get("type", "default")
                    })
            
            return result
    except Exception as e:
        logger.error(f"Error fetching playlists: {e}", exc_info=True)
        return []

# --- ACTIVITY ---

@app.get("/api/activity")
async def get_activity(limit: int = 20, db: AsyncSession = Depends(get_db)):
    """Pobiera ostatnią aktywność użytkowników"""
    activities = []
    
    try:
        # Ostatnie głosy
        votes_result = await db.execute(
            select(models.Vote, models.User)
            .join(models.User, models.Vote.user_id == models.User.id)
            .where(models.User.hide_activity_history == False)
            .order_by(desc(models.Vote.created_at))
            .limit(limit // 2)
        )
        
        for vote, user in votes_result.all():
            featured_badge = None
            if user.featured_badge_id:
                badge = await db.get(models.Badge, user.featured_badge_id)
                if badge:
                    featured_badge = {
                        "id": badge.id,
                        "name": badge.name,
                        "description": badge.description,
                        "icon": badge.icon,
                        "color": badge.color
                    }
            activities.append({
                "type": "vote",
                "text": f"{user.username} {'polubił utwór' if vote.vote_type == 'LIKE' else 'nie polubił utworu'} ",
                "timestamp": vote.created_at.isoformat() if vote.created_at else None,
                "icon": "heart",
                "user_id": user.id,
                "username": user.username,
                "avatar_url": user.avatar_url,
                "vote_type": vote.vote_type,
                "featured_badge": featured_badge
            })
        
        # Ostatnie propozycje
        suggestions_result = await db.execute(
            select(models.Suggestion, models.User)
            .join(models.User, models.Suggestion.user_id == models.User.id)
            .where(models.User.hide_activity_history == False)
            .order_by(desc(models.Suggestion.created_at))
            .limit(limit // 2)
        )
        
        for suggestion, user in suggestions_result.all():
            featured_badge = None
            if user.featured_badge_id:
                badge = await db.get(models.Badge, user.featured_badge_id)
                if badge:
                    featured_badge = {
                        "id": badge.id,
                        "name": badge.name,
                        "description": badge.description,
                        "icon": badge.icon,
                        "color": badge.color
                    }
            activities.append({
                "type": "suggestion",
                "text": f"{user.username} zaproponował utwór",
                "timestamp": suggestion.created_at.isoformat() if suggestion.created_at else None,
                "icon": "music",
                "user_id": user.id,
                "username": user.username,
                "avatar_url": user.avatar_url,
                "featured_badge": featured_badge
            })
        
        # Sortuj po czasie i zwróć najnowsze
        activities.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        return activities[:limit]
        
    except Exception as e:
        logger.error(f"Error fetching activity: {e}", exc_info=True)
        return []

# --- ADMIN ---

class PromoteUserRequest(BaseModel):
    discord_id: str

@app.post("/api/admin/promote")
async def promote_user(promote: PromoteUserRequest, request: Request, db: AsyncSession = Depends(get_db)):
    admin_count = await db.scalar(
        select(func.count(models.User.id)).where(models.User.is_admin == True)
    )
    
    current_user = await auth.get_current_user(request, db)
    
    if admin_count and admin_count > 0:
        if not current_user or not current_user.is_admin:
            raise HTTPException(status_code=403, detail="Admin only")
    
    result = await db.execute(
        select(models.User).where(models.User.discord_id == promote.discord_id)
    )
    user = result.scalar_one_or_none()
    
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.is_admin = True
    await db.commit()
    return {"status": "success", "username": user.username, "is_admin": True}

@app.get("/api/admin/users")
async def get_all_users(request: Request, db: AsyncSession = Depends(get_db)):
    current_user = await auth.get_current_user(request, db)
    if not current_user or not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    
    result = await db.execute(
        select(models.User).order_by(desc(models.User.created_at))
    )
    users = result.scalars().all()
    
    users_list = []
    for user in users:
        suggestions_count = await db.scalar(
            select(func.count(models.Suggestion.id)).where(models.Suggestion.user_id == user.id)
        )
        votes_count = await db.scalar(
            select(func.count(models.Vote.id)).where(models.Vote.user_id == user.id)
        )
        
        users_list.append({
            "id": user.id,
            "discord_id": user.discord_id,
            "username": user.username,
            "avatar_url": user.avatar_url,
            "is_admin": user.is_admin,
            "reputation_score": user.reputation_score,
            "created_at": user.created_at.isoformat() if user.created_at else None,
            "suggestions_count": suggestions_count or 0,
            "votes_count": votes_count or 0
        })
    
    return users_list

@app.get("/api/admin/votes")
async def get_all_votes(request: Request, db: AsyncSession = Depends(get_db), limit: int = 100):
    current_user = await auth.get_current_user(request, db)
    if not current_user or not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    
    result = await db.execute(
        select(models.Vote, models.User)
        .join(models.User, models.Vote.user_id == models.User.id)
        .order_by(desc(models.Vote.created_at))
        .limit(limit)
    )
    
    votes_list = []
    for vote, user in result.all():
        song_info = await azuracast_client.get_song_info(vote.song_id)
        votes_list.append({
            "id": vote.id,
            "user_id": vote.user_id,
            "username": user.username,
            "avatar_url": user.avatar_url,
            "song_id": vote.song_id,
            "song_title": song_info.get("title", f"Song {vote.song_id}") if song_info else f"Song {vote.song_id}",
            "song_artist": song_info.get("artist", "Unknown") if song_info else "Unknown",
            "vote_type": vote.vote_type,
            "created_at": vote.created_at.isoformat() if vote.created_at else None
        })
    
    return votes_list

@app.get("/api/admin/radio-info")
async def get_full_radio_info(request: Request, db: AsyncSession = Depends(get_db)):
    current_user = await auth.get_current_user(request, db)
    if not current_user or not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    
    station_info = await azuracast_client.get_station_info()
    now_playing = await azuracast_client.get_now_playing()
    
    total_users = await db.scalar(select(func.count(models.User.id)))
    total_votes = await db.scalar(select(func.count(models.Vote.id)))
    total_suggestions = await db.scalar(select(func.count(models.Suggestion.id)))
    total_likes = await db.scalar(
        select(func.count(models.Vote.id)).where(models.Vote.vote_type == "LIKE")
    )
    total_dislikes = await db.scalar(
        select(func.count(models.Vote.id)).where(models.Vote.vote_type == "DISLIKE")
    )
    
    active_listeners = event_broadcaster.get_active_listeners()
    total_active_listeners = len(active_listeners)
    playing_listeners = [l for l in active_listeners if l.get("is_playing", False)]
    total_playing_listeners = len(playing_listeners)
    
    authenticated_active = [l for l in active_listeners if not l.get("is_guest") and l.get("user_id")]
    authenticated_playing = [l for l in playing_listeners if not l.get("is_guest") and l.get("user_id")]
    guests_active = [l for l in active_listeners if l.get("is_guest")]
    guests_playing = [l for l in playing_listeners if l.get("is_guest")]
    
    return {
        "station": station_info or {},
        "now_playing": now_playing or {},
        "statistics": {
            "total_users": total_users or 0,
            "total_votes": total_votes or 0,
            "total_suggestions": total_suggestions or 0,
            "total_likes": total_likes or 0,
            "total_dislikes": total_dislikes or 0,
            "active_listeners": {
                "total": total_active_listeners,
                "playing": total_playing_listeners,
                "users": {
                    "active": len(authenticated_active),
                    "playing": len(authenticated_playing)
                },
                "guests": {
                    "active": len(guests_active),
                    "playing": len(guests_playing)
                }
            }
        }
    }

# --- BADGES ---

async def check_and_award_badges(user_id: int, badge_type: str, db: AsyncSession = None):
    """Sprawdza warunki i przyznaje odznaki automatycznie"""
    from .database import AsyncSessionLocal
    
    if db is None:
        async with AsyncSessionLocal() as session:
            await _check_and_award_badges_internal(user_id, badge_type, session)
    else:
        await _check_and_award_badges_internal(user_id, badge_type, db)

async def _check_and_award_badges_internal(user_id: int, badge_type: str, db: AsyncSession, context_data: dict = None):
    """Wewnętrzna funkcja sprawdzająca warunki odznak"""
    import json
    
    result = await db.execute(
        select(models.Badge).where(models.Badge.auto_award_type == badge_type)
    )
    badges = result.scalars().all()
    
    user = await db.get(models.User, user_id)
    if not user:
        return
    
    for badge in badges:
        existing = await db.scalar(
            select(models.UserBadge).where(
                models.UserBadge.user_id == user_id,
                models.UserBadge.badge_id == badge.id
            )
        )
        if existing:
            continue
        
        should_award = False
        config_data = {}
        if badge.auto_award_config:
            try:
                config_data = json.loads(badge.auto_award_config)
            except:
                pass
        
        if badge_type == "NIGHT_SHIFT":
            now = datetime.now(timezone.utc)
            hour = now.hour
            if hour >= 2 and hour < 5:
                should_award = True
        
        elif badge_type == "PLAYLIST_GUARDIAN":
            should_award = True
        
        elif badge_type == "PLAYLIST_CONTRIBUTOR":
            suggestions_count = await db.scalar(
                select(func.count(models.Suggestion.id)).where(
                    models.Suggestion.user_id == user_id,
                    models.Suggestion.status == "APPROVED"
                )
            )
            if suggestions_count and suggestions_count >= 1:
                should_award = True
        
        elif badge_type == "LISTENING_TIME":
            required_minutes = config_data.get("minutes", 0)
            total_minutes = await db.scalar(
                select(func.sum(models.ListeningSession.duration_seconds / 60)).where(
                    models.ListeningSession.user_id == user_id
                )
            )
            if total_minutes and total_minutes >= required_minutes:
                should_award = True
        
        elif badge_type == "LIKES":
            required_count = config_data.get("count", 0)
            likes_count = await db.scalar(
                select(func.count(models.Vote.id)).where(
                    models.Vote.user_id == user_id,
                    models.Vote.vote_type == "LIKE"
                )
            )
            if likes_count and likes_count >= required_count:
                should_award = True
        
        elif badge_type == "DISLIKES":
            required_count = config_data.get("count", 0)
            dislikes_count = await db.scalar(
                select(func.count(models.Vote.id)).where(
                    models.Vote.user_id == user_id,
                    models.Vote.vote_type == "DISLIKE"
                )
            )
            if dislikes_count and dislikes_count >= required_count:
                should_award = True
        
        elif badge_type == "SHOW_LISTENER":
            should_award = context_data and context_data.get("is_show_time", False)
        
        elif badge_type == "SUGGESTIONS":
            required_count = config_data.get("count", 0)
            suggestions_count = await db.scalar(
                select(func.count(models.Suggestion.id)).where(
                    models.Suggestion.user_id == user_id
                )
            )
            if suggestions_count and suggestions_count >= required_count:
                should_award = True
        
        elif badge_type == "BUG_REPORTS":
            required_count = config_data.get("count", 0)
            bugs_count = await db.scalar(
                select(func.count(models.IssueReport.id)).where(
                    models.IssueReport.user_id == user_id,
                    models.IssueReport.issue_type == "BUG",
                    models.IssueReport.status == "APPROVED"
                )
            )
            if bugs_count and bugs_count >= required_count:
                should_award = True
        
        elif badge_type == "FEATURE_REQUESTS":
            required_count = config_data.get("count", 0)
            features_count = await db.scalar(
                select(func.count(models.IssueReport.id)).where(
                    models.IssueReport.user_id == user_id,
                    models.IssueReport.issue_type == "FEATURE",
                    models.IssueReport.status == "APPROVED"
                )
            )
            if features_count and features_count >= required_count:
                should_award = True
        
        if should_award:
            user_badge = models.UserBadge(
                user_id=user_id,
                badge_id=badge.id,
                awarded_by=None
            )
            db.add(user_badge)
            
            if badge.xp_reward and badge.xp_reward > 0:
                user.xp = (user.xp or 0) + badge.xp_reward
                xp_award = models.XpAward(
                    user_id=user_id,
                    song_id=None,
                    xp_amount=badge.xp_reward,
                    award_type="BADGE"
                )
                db.add(xp_award)
            
            await db.commit()

@app.get("/api/badges")
async def get_all_badges(db: AsyncSession = Depends(get_db)):
    try:
        result = await db.execute(select(models.Badge).order_by(models.Badge.created_at))
        badges = result.scalars().all()
        
        # Pobierz liczbę wszystkich użytkowników
        total_users = await db.scalar(select(func.count(models.User.id)))
        
        badge_list = []
        for b in badges:
            # Policz ile użytkowników ma tę odznakę
            users_with_badge = await db.scalar(
                select(func.count(func.distinct(models.UserBadge.user_id)))
                .where(models.UserBadge.badge_id == b.id)
            )
            
            # Oblicz procent
            percentage = 0.0
            if total_users and total_users > 0:
                percentage = round((users_with_badge / total_users) * 100, 1)
            
            badge_list.append({
                "id": b.id,
                "name": b.name,
                "description": b.description,
                "icon": b.icon,
                "color": b.color,
                "auto_award_type": b.auto_award_type,
                "auto_award_config": b.auto_award_config,
                "xp_reward": (b.xp_reward if b.xp_reward is not None else 0),
                "created_at": b.created_at.isoformat() if b.created_at else None,
                "users_count": users_with_badge or 0,
                "total_users": total_users or 0,
                "percentage": percentage
            })
        
        return badge_list
    except Exception as e:
        logger.error(f"Error fetching badges: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error fetching badges")

# WAŻNE: Endpoint /api/users/me/badges musi być PRZED /api/users/{user_id}/badges
# aby FastAPI nie próbował dopasować "me" jako user_id
@app.get("/api/users/me/badges")
async def get_my_badges(request: Request, db: AsyncSession = Depends(get_db)):
    # Używamy tego samego wzorca co /api/users/me
    user = await auth.get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        result = await db.execute(
            select(models.UserBadge, models.Badge)
            .join(models.Badge, models.UserBadge.badge_id == models.Badge.id)
            .where(models.UserBadge.user_id == user.id)
            .order_by(desc(models.UserBadge.awarded_at))
        )
        
        # Grupujemy po badge_id i liczymy wystąpienia
        badge_counts = {}
        badge_data = {}
        latest_awarded = {}
        
        for user_badge, badge in result.all():
            badge_id = badge.id
            if badge_id not in badge_counts:
                badge_counts[badge_id] = 0
                badge_data[badge_id] = {
                    "id": badge.id,
                    "name": badge.name,
                    "description": badge.description,
                    "icon": badge.icon,
                    "color": badge.color,
                    "auto_award_config": badge.auto_award_config,
                    "is_featured": user.featured_badge_id == badge.id
                }
            badge_counts[badge_id] += 1
            # Zapamiętujemy najnowszą datę przyznania
            if badge_id not in latest_awarded or (user_badge.awarded_at and latest_awarded[badge_id] < user_badge.awarded_at):
                latest_awarded[badge_id] = user_badge.awarded_at
        
        badges = []
        for badge_id, data in badge_data.items():
            data["count"] = badge_counts[badge_id]
            data["awarded_at"] = latest_awarded[badge_id].isoformat() if latest_awarded[badge_id] else None
            badges.append(data)
        
        return badges
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching user badges: {e}", exc_info=True)
        raise HTTPException(status_code=500, detail="Error fetching badges")

class FeatureBadgeRequest(BaseModel):
    badge_id: Optional[int] = None

class UserSettingsRequest(BaseModel):
    hide_activity: Optional[bool] = None
    hide_activity_history: Optional[bool] = None

@app.put("/api/users/me/settings")
async def update_user_settings(request: Request, settings_req: UserSettingsRequest, db: AsyncSession = Depends(get_db)):
    user = await auth.get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if settings_req.hide_activity is not None:
        user.hide_activity = settings_req.hide_activity
    
    if settings_req.hide_activity_history is not None:
        user.hide_activity_history = settings_req.hide_activity_history
    
    await db.commit()
    return {
        "status": "success",
        "hide_activity": user.hide_activity,
        "hide_activity_history": user.hide_activity_history
    }

class UpdateDisplayNameRequest(BaseModel):
    display_name: str

class UpdateAvatarRequest(BaseModel):
    avatar_source: str  # DISCORD, GOOGLE, DEFAULT

@app.put("/api/users/me/display-name")
async def update_display_name(request: Request, name_req: UpdateDisplayNameRequest, db: AsyncSession = Depends(get_db)):
    user = await auth.get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    import re
    display_name = name_req.display_name.strip()
    
    if not display_name or len(display_name) < 3:
        raise HTTPException(status_code=400, detail="Nazwa musi mieć co najmniej 3 znaki")
    
    if len(display_name) > 30:
        raise HTTPException(status_code=400, detail="Nazwa może mieć maksymalnie 30 znaków")
    
    if not re.match(r'^[a-zA-Z0-9_\-\.]+$', display_name):
        raise HTTPException(status_code=400, detail="Nazwa może zawierać tylko litery, cyfry, _, - i .")
    
    user.display_name = display_name
    await db.commit()
    
    return {"status": "success", "display_name": user.display_name}

@app.put("/api/users/me/avatar")
async def update_avatar(request: Request, avatar_req: UpdateAvatarRequest, db: AsyncSession = Depends(get_db)):
    user = await auth.get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    avatar_source = avatar_req.avatar_source.upper()
    if avatar_source not in ["DISCORD", "GOOGLE", "DEFAULT"]:
        raise HTTPException(status_code=400, detail="Nieprawidłowe źródło avatara")
    
    if avatar_source == "DISCORD" and not user.discord_avatar_url:
        raise HTTPException(status_code=400, detail="Nie masz połączonego konta Discord")
    
    if avatar_source == "GOOGLE" and not user.google_avatar_url:
        raise HTTPException(status_code=400, detail="Nie masz połączonego konta Google")
    
    user.avatar_source = avatar_source
    
    if avatar_source == "DISCORD":
        user.avatar_url = user.discord_avatar_url
    elif avatar_source == "GOOGLE":
        user.avatar_url = user.google_avatar_url
    else:
        default_color = "#5865F2"
        if user.featured_badge_id:
            badge = await db.get(models.Badge, user.featured_badge_id)
            if badge and badge.color:
                default_color = badge.color
        user.avatar_url = f"{config.settings.app_base_url}/api/users/me/avatar/default?color={default_color.replace('#', '')}"
    
    await db.commit()
    
    return {"status": "success", "avatar_source": user.avatar_source, "avatar_url": user.avatar_url}

@app.get("/api/users/me/avatar/default")
async def get_default_avatar(request: Request, color: str = "5865F2", db: AsyncSession = Depends(get_db)):
    """Zwraca domyślny avatar SVG z odpowiednim kolorem"""
    from fastapi.responses import Response
    
    user = await auth.get_current_user(request, db)
    if user and user.featured_badge_id:
        badge = await db.get(models.Badge, user.featured_badge_id)
        if badge and badge.color:
            color = badge.color.replace('#', '')
    
    svg_content = f'''<?xml version="1.0" encoding="UTF-8"?>
<svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="320" height="320" viewBox="0 0 320 320">
<rect width="320" height="320" fill="#{color}"/>
<path d="M0 0 C1.37 -0 2.74 -0.01 4.11 -0.01 C6.96 -0.02 9.8 -0.01 12.65 0.01 C16.27 0.03 19.89 0.02 23.51 -0 C26.33 -0.02 29.15 -0.01 31.97 -0 C33.94 -0 35.92 -0.01 37.89 -0.02 C49.05 0.09 59.29 2.44 67.43 10.53 C74.87 19.91 76.58 28.52 76.58 40.25 C76.58 41.21 76.59 42.17 76.59 43.16 C76.6 46.33 76.6 49.51 76.6 52.68 C76.6 54.89 76.61 57.1 76.61 59.31 C76.62 63.95 76.62 68.58 76.62 73.21 C76.62 79.14 76.63 85.06 76.65 90.99 C76.66 95.56 76.66 100.12 76.66 104.69 C76.66 106.88 76.67 109.06 76.68 111.24 C76.69 114.3 76.68 117.36 76.68 120.43 C76.68 121.32 76.69 122.21 76.69 123.13 C76.64 134.25 74.06 143.08 66.65 151.58 C57.53 160.34 46.63 161.15 34.53 161.06 C33.11 161.07 31.7 161.07 30.28 161.07 C27.33 161.08 24.39 161.07 21.44 161.05 C17.69 161.03 13.94 161.04 10.19 161.07 C7.27 161.08 4.36 161.08 1.44 161.07 C0.06 161.06 -1.32 161.07 -2.7 161.08 C-14.21 161.14 -24.21 159.75 -32.78 151.52 C-40.87 142.53 -42.87 134.06 -42.84 122.23 C-42.85 121.24 -42.85 120.24 -42.86 119.21 C-42.87 115.92 -42.87 112.64 -42.87 109.35 C-42.87 107.06 -42.88 104.76 -42.88 102.46 C-42.89 97.66 -42.89 92.85 -42.88 88.04 C-42.88 81.9 -42.89 75.76 -42.92 69.62 C-42.93 64.88 -42.93 60.14 -42.93 55.4 C-42.93 53.13 -42.93 50.87 -42.94 48.6 C-42.96 45.43 -42.95 42.26 -42.94 39.09 C-42.95 38.16 -42.95 37.24 -42.96 36.29 C-42.88 26.19 -40.41 18.06 -33.57 10.53 C-33.06 9.97 -32.56 9.42 -32.04 8.84 C-23.4 0.41 -11.42 -0.07 0 0 Z M-5.29 34.04 C-7.12 37.62 -7 41.05 -6.99 44.98 C-6.99 45.83 -7 46.69 -7.01 47.56 C-7.04 50.37 -7.04 53.18 -7.04 56 C-7.04 57.95 -7.05 59.91 -7.06 61.86 C-7.07 65.96 -7.07 70.06 -7.07 74.16 C-7.06 79.41 -7.09 84.66 -7.13 89.91 C-7.16 93.94 -7.16 97.98 -7.16 102.02 C-7.16 103.96 -7.17 105.89 -7.19 107.83 C-7.21 110.54 -7.2 113.24 -7.18 115.95 C-7.19 116.75 -7.21 117.55 -7.22 118.37 C-7.16 122.38 -6.74 124.31 -4.27 127.53 C-0.69 130.18 2.33 130.22 6.62 130.12 C7.79 130.13 7.79 130.13 8.99 130.13 C10.63 130.12 12.27 130.1 13.92 130.07 C16.43 130.03 18.93 130.03 21.44 130.04 C23.04 130.03 24.64 130.02 26.25 130 C26.99 130 27.74 130 28.51 130 C32.95 129.9 35.94 129.36 39.43 126.53 C40.68 122.78 40.59 119.28 40.59 115.38 C40.6 114.54 40.6 113.71 40.61 112.86 C40.62 110.1 40.63 107.35 40.64 104.6 C40.64 102.69 40.65 100.78 40.65 98.87 C40.66 94.86 40.67 90.85 40.67 86.84 C40.68 81.7 40.7 76.56 40.73 71.43 C40.75 67.48 40.76 63.53 40.76 59.58 C40.76 57.68 40.77 55.79 40.78 53.9 C40.8 51.25 40.8 48.6 40.79 45.95 C40.8 45.16 40.81 44.38 40.82 43.58 C40.78 39.1 40.41 35.99 37.43 32.53 C35.53 31.79 35.53 31.79 33.38 31.9 C32.57 31.89 31.76 31.88 30.92 31.86 C29.61 31.88 29.61 31.88 28.28 31.9 C27.38 31.9 26.48 31.9 25.55 31.9 C23.65 31.9 21.75 31.91 19.85 31.93 C16.94 31.97 14.04 31.95 11.12 31.94 C9.28 31.94 7.43 31.95 5.59 31.96 C4.72 31.96 3.85 31.95 2.95 31.95 C1.73 31.97 1.73 31.97 0.49 32 C-0.22 32 -0.94 32.01 -1.67 32.02 C-3.69 32.42 -3.69 32.42 -5.29 34.04 Z " fill="#FFFFFF" transform="translate(82.56640625,77.46875)"/>
<path d="M0 0 C7.92 0 15.84 0 24 0 C28.85 8.44 33.51 16.89 37.81 25.62 C44.4 39 51.56 52.08 59 65 C66.43 53.6 72.7 41.57 79.09 29.57 C82.02 24.08 84.98 18.61 87.93 13.13 C89.43 10.34 90.93 7.56 92.43 4.77 C93.28 3.2 94.13 1.62 95 0 C103.25 0 111.5 0 120 0 C118.65 3.38 117.42 6.21 115.64 9.31 C114.94 10.53 114.94 10.53 114.22 11.79 C113.71 12.66 113.21 13.54 112.69 14.44 C112.15 15.36 111.62 16.29 111.07 17.25 C105.74 26.51 100.3 35.71 94.84 44.9 C92.43 48.96 90.02 53.03 87.61 57.1 C84.07 63.07 80.54 69.03 77 75 C86.57 75 96.14 75 106 75 C106 79.62 106 84.24 106 89 C94.12 89 82.24 89 70 89 C70 94.28 70 99.56 70 105 C81.88 105 93.76 105 106 105 C106 109.95 106 114.9 106 120 C94.12 120 82.24 120 70 120 C70 133.2 70 146.4 70 160 C62.41 160 54.82 160 47 160 C47 146.8 47 133.6 47 120 C35.12 120 23.24 120 11 120 C11 115.05 11 110.1 11 105 C22.88 105 34.76 105 47 105 C47 99.72 47 94.44 47 89 C35.12 89 23.24 89 11 89 C11 84.38 11 79.76 11 75 C20.24 74.67 29.48 74.34 39 74 C31.68 59.88 24.24 45.85 16.59 31.9 C13.68 26.59 10.77 21.26 7.88 15.94 C7.32 14.92 6.76 13.9 6.19 12.85 C5.67 11.9 5.15 10.95 4.62 9.96 C4.16 9.13 3.7 8.29 3.23 7.42 C2.01 5.02 1 2.51 0 0 Z " fill="#FFFFFF" transform="translate(168,78)"/>
</svg>'''
    
    return Response(content=svg_content, media_type="image/svg+xml")

@app.get("/api/auth/connect/discord")
async def connect_discord(request: Request):
    redirect_uri = f"{config.settings.app_base_url}/api/auth/connect/callback/discord"
    return await auth.oauth.discord.authorize_redirect(request, redirect_uri)

@app.get("/api/auth/connect/google")
async def connect_google(request: Request):
    redirect_uri = f"{config.settings.app_base_url}/api/auth/connect/callback/google"
    return await auth.oauth.google.authorize_redirect(request, redirect_uri)

@app.get("/api/auth/connect/callback/discord")
async def connect_callback_discord(request: Request, db: AsyncSession = Depends(get_db)):
    current_user = await auth.get_current_user(request, db)
    if not current_user:
        return RedirectResponse(url=f"{config.settings.app_base_url}/?error=not_authenticated")
    
    try:
        token = await auth.oauth.discord.authorize_access_token(request)
    except Exception as e:
        return RedirectResponse(url=f"{config.settings.app_base_url}/?error=oauth_failed")
    
    resp = await auth.oauth.discord.get('users/@me', token=token)
    discord_user = resp.json()
    
    if current_user.discord_id:
        return RedirectResponse(url=f"{config.settings.app_base_url}/?error=already_connected")
    
    existing_user = await db.scalar(select(models.User).where(models.User.discord_id == discord_user['id']))
    if existing_user and existing_user.id != current_user.id:
        return RedirectResponse(url=f"{config.settings.app_base_url}/?error=account_exists")
    
    avatar_url = None
    if discord_user.get('avatar'):
        avatar_url = f"https://cdn.discordapp.com/avatars/{discord_user['id']}/{discord_user['avatar']}.png"
    
    current_user.discord_id = discord_user['id']
    current_user.discord_avatar_url = avatar_url
    current_user.discord_username = discord_user.get('username')
    if discord_user.get('email') and not current_user.email:
        current_user.email = discord_user.get('email')
    
    if not current_user.avatar_url or current_user.avatar_source == "DEFAULT":
        current_user.avatar_url = avatar_url
        current_user.avatar_source = "DISCORD"
    
    await db.commit()
    
    return RedirectResponse(url=f"{config.settings.app_base_url}/profile?connected=discord")

@app.get("/api/auth/connect/callback/google")
async def connect_callback_google(request: Request, db: AsyncSession = Depends(get_db)):
    current_user = await auth.get_current_user(request, db)
    if not current_user:
        return RedirectResponse(url=f"{config.settings.app_base_url}/?error=not_authenticated")
    
    try:
        token = await auth.oauth.google.authorize_access_token(request)
    except Exception as e:
        logger.error(f"Google OAuth token error: {e}")
        return RedirectResponse(url=f"{config.settings.app_base_url}/?error=oauth_failed")
    
    try:
        resp = await auth.oauth.google.get('userinfo', token=token)
        google_user = resp.json()
        logger.info(f"Google userinfo response: {google_user}")
    except Exception as e:
        logger.error(f"Google userinfo error: {e}")
        return RedirectResponse(url=f"{config.settings.app_base_url}/?error=userinfo_failed")
    
    google_id = google_user.get('sub') or google_user.get('id')
    if not google_id:
        logger.error(f"Google user response missing ID. Full response: {google_user}")
        return RedirectResponse(url=f"{config.settings.app_base_url}/?error=invalid_response")
    
    if current_user.google_id:
        return RedirectResponse(url=f"{config.settings.app_base_url}/?error=already_connected")
    
    # Sprawdź czy ten Google ID nie jest już przypisany do innego użytkownika
    existing_user = await db.scalar(select(models.User).where(models.User.google_id == google_id))
    if existing_user and existing_user.id != current_user.id:
        return RedirectResponse(url=f"{config.settings.app_base_url}/?error=account_exists")
    
    # Sprawdź czy istnieje inny użytkownik z tym samym emailem (jeśli dostępny)
    google_email = google_user.get('email')
    if google_email:
        email_user = await db.scalar(select(models.User).where(
            and_(
                models.User.email == google_email,
                models.User.id != current_user.id
            )
        ))
        if email_user:
            # Jeśli istnieje użytkownik z tym samym emailem, ale nie ma Google ID,
            # to może to być ten sam użytkownik - ale nie możemy automatycznie połączyć
            # bo użytkownik może mieć różne konta z tym samym emailem
            # Więc po prostu zwróć błąd
            return RedirectResponse(url=f"{config.settings.app_base_url}/?error=email_already_used")
    
    avatar_url = google_user.get('picture')
    
    current_user.google_id = google_id
    current_user.google_avatar_url = avatar_url
    current_user.google_username = google_user.get('name') or google_user.get('email')
    if google_user.get('email') and not current_user.email:
        current_user.email = google_user.get('email')
    
    if not current_user.avatar_url or current_user.avatar_source == "DEFAULT":
        current_user.avatar_url = avatar_url
        current_user.avatar_source = "GOOGLE"
    
    await db.commit()
    
    return RedirectResponse(url=f"{config.settings.app_base_url}/profile?connected=google")

@app.delete("/api/users/me/disconnect/discord")
async def disconnect_discord(request: Request, db: AsyncSession = Depends(get_db)):
    current_user = await auth.get_current_user(request, db)
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if not current_user.discord_id:
        raise HTTPException(status_code=400, detail="Discord account not connected")
    
    if not current_user.google_id:
        raise HTTPException(status_code=400, detail="Cannot disconnect last account")
    
    if current_user.avatar_source == "DISCORD":
        if current_user.google_avatar_url:
            current_user.avatar_url = current_user.google_avatar_url
            current_user.avatar_source = "GOOGLE"
        else:
            current_user.avatar_url = None
            current_user.avatar_source = "DEFAULT"
    
    current_user.discord_id = None
    current_user.discord_avatar_url = None
    current_user.discord_username = None
    
    await db.commit()
    
    return {"status": "success", "message": "Discord account disconnected"}

@app.delete("/api/users/me/disconnect/google")
async def disconnect_google(request: Request, db: AsyncSession = Depends(get_db)):
    current_user = await auth.get_current_user(request, db)
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if not current_user.google_id:
        raise HTTPException(status_code=400, detail="Google account not connected")
    
    if not current_user.discord_id:
        raise HTTPException(status_code=400, detail="Cannot disconnect last account")
    
    if current_user.avatar_source == "GOOGLE":
        if current_user.discord_avatar_url:
            current_user.avatar_url = current_user.discord_avatar_url
            current_user.avatar_source = "DISCORD"
        else:
            current_user.avatar_url = None
            current_user.avatar_source = "DEFAULT"
    
    current_user.google_id = None
    current_user.google_avatar_url = None
    current_user.google_username = None
    
    await db.commit()
    
    return {"status": "success", "message": "Google account disconnected"}

@app.delete("/api/users/me")
async def delete_account(request: Request, db: AsyncSession = Depends(get_db)):
    current_user = await auth.get_current_user(request, db)
    if not current_user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user_id = current_user.id
    
    suggestions = (await db.execute(
        select(models.Suggestion).where(models.Suggestion.user_id == user_id)
    )).scalars().all()
    for suggestion in suggestions:
        await db.delete(suggestion)
    
    votes = (await db.execute(
        select(models.Vote).where(models.Vote.user_id == user_id)
    )).scalars().all()
    for vote in votes:
        await db.delete(vote)
    
    xp_awards = (await db.execute(
        select(models.XpAward).where(models.XpAward.user_id == user_id)
    )).scalars().all()
    for xp_award in xp_awards:
        await db.delete(xp_award)
    
    user_badges = (await db.execute(
        select(models.UserBadge).where(models.UserBadge.user_id == user_id)
    )).scalars().all()
    for user_badge in user_badges:
        await db.delete(user_badge)
    
    listening_sessions = (await db.execute(
        select(models.ListeningSession).where(models.ListeningSession.user_id == user_id)
    )).scalars().all()
    for session in listening_sessions:
        await db.delete(session)
    
    await db.delete(current_user)
    await db.commit()
    
    request.session.clear()
    
    return {"status": "success", "message": "Account deleted"}

@app.put("/api/users/me/badges/feature")
async def feature_badge(request: Request, feature_req: FeatureBadgeRequest, db: AsyncSession = Depends(get_db)):
    user = await auth.get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    if feature_req.badge_id is None:
        user.featured_badge_id = None
        await db.commit()
        return {"status": "success", "featured_badge_id": None}
    
    badge = await db.get(models.Badge, feature_req.badge_id)
    if not badge:
        raise HTTPException(status_code=404, detail="Badge not found")
    
    user_badge = await db.scalar(
        select(models.UserBadge).where(
            models.UserBadge.user_id == user.id,
            models.UserBadge.badge_id == feature_req.badge_id
        )
    )
    if not user_badge:
        raise HTTPException(status_code=403, detail="You don't have this badge")
    
    user.featured_badge_id = feature_req.badge_id
    await db.commit()
    return {"status": "success", "featured_badge_id": feature_req.badge_id}

class CreateBadgeRequest(BaseModel):
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    color: Optional[str] = None
    auto_award_type: Optional[str] = None
    auto_award_config: Optional[str] = None
    xp_reward: Optional[int] = 0

@app.post("/api/admin/badges")
async def create_badge(create_req: CreateBadgeRequest, request: Request, db: AsyncSession = Depends(get_db)):
    current_user = await auth.get_current_user(request, db)
    if not current_user or not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    
    badge = models.Badge(
        name=create_req.name,
        description=create_req.description,
        icon=create_req.icon,
        color=create_req.color,
        auto_award_type=create_req.auto_award_type,
        auto_award_config=create_req.auto_award_config,
        xp_reward=create_req.xp_reward or 0
    )
    db.add(badge)
    await db.commit()
    await db.refresh(badge)
    
    return {
        "id": badge.id,
        "name": badge.name,
        "description": badge.description,
        "icon": badge.icon,
        "color": badge.color,
        "auto_award_type": badge.auto_award_type,
        "created_at": badge.created_at.isoformat() if badge.created_at else None
    }

class AwardBadgeRequest(BaseModel):
    user_id: int
    badge_id: int

@app.post("/api/admin/badges/award")
async def award_badge(award_req: AwardBadgeRequest, request: Request, db: AsyncSession = Depends(get_db)):
    current_user = await auth.get_current_user(request, db)
    if not current_user or not current_user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    
    user = await db.get(models.User, award_req.user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    badge = await db.get(models.Badge, award_req.badge_id)
    if not badge:
        raise HTTPException(status_code=404, detail="Badge not found")
    
    existing = await db.scalar(
        select(models.UserBadge).where(
            models.UserBadge.user_id == award_req.user_id,
            models.UserBadge.badge_id == award_req.badge_id
        )
    )
    if existing:
        raise HTTPException(status_code=400, detail="User already has this badge")
    
    user_badge = models.UserBadge(
        user_id=award_req.user_id,
        badge_id=award_req.badge_id,
        awarded_by=current_user.id
    )
    db.add(user_badge)
    
    if badge.xp_reward and badge.xp_reward > 0:
        user.xp = (user.xp or 0) + badge.xp_reward
        xp_award = models.XpAward(
            user_id=award_req.user_id,
            song_id=None,
            xp_amount=badge.xp_reward,
            award_type="BADGE"
        )
        db.add(xp_award)
    
    await db.commit()
    
    return {"status": "success", "user_id": award_req.user_id, "badge_id": award_req.badge_id}

class ReportErrorRequest(BaseModel):
    song_id: Optional[str] = None
    error_type: str  # METADATA_ERROR, FILE_ERROR
    description: Optional[str] = None

@app.post("/api/report-error")
async def report_error(report_req: ReportErrorRequest, request: Request, db: AsyncSession = Depends(get_db)):
    user = await auth.get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    await _check_and_award_badges_internal(user.id, "PLAYLIST_GUARDIAN", db)
    
    return {"status": "success", "message": "Błąd zgłoszony"}

def get_client_ip(request: Request) -> str:
    """Pobiera IP klienta z requestu"""
    if request.client:
        return request.client.host
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return "unknown"

async def check_rate_limit(user_id: Optional[int], ip_address: str, db: AsyncSession) -> Tuple[bool, int]:
    """Sprawdza rate limiting. Zwraca (allowed, seconds_until_next)"""
    now = datetime.now(timezone.utc)
    
    if user_id:
        recent_count = await db.scalar(
            select(func.count(models.IssueReport.id)).where(
                models.IssueReport.user_id == user_id,
                models.IssueReport.created_at >= now - timedelta(hours=1)
            )
        )
        if recent_count is None:
            recent_count = 0
        
        if recent_count < 3:
            return (True, 0)
        elif recent_count < 5:
            return (True, 5)
        elif recent_count < 10:
            return (True, 15)
        else:
            last_report = await db.scalar(
                select(models.IssueReport.created_at).where(
                    models.IssueReport.user_id == user_id
                ).order_by(desc(models.IssueReport.created_at)).limit(1)
            )
            if last_report:
                seconds_passed = (now - last_report).total_seconds()
                if seconds_passed < 30:
                    return (False, int(30 - seconds_passed))
            return (True, 30)
    else:
        recent_count = await db.scalar(
            select(func.count(models.IssueReport.id)).where(
                models.IssueReport.ip_address == ip_address,
                models.IssueReport.created_at >= now - timedelta(hours=1)
            )
        )
        if recent_count is None:
            recent_count = 0
        
        if recent_count >= 1:
            last_report = await db.scalar(
                select(models.IssueReport.created_at).where(
                    models.IssueReport.ip_address == ip_address
                ).order_by(desc(models.IssueReport.created_at)).limit(1)
            )
            if last_report:
                seconds_passed = (now - last_report).total_seconds()
                if seconds_passed < 60:
                    return (False, int(60 - seconds_passed))
        return (True, 0)

class IssueReportRequest(BaseModel):
    issue_type: str  # BUG, FEATURE
    title: str
    description: str

@app.post("/api/issues")
async def create_issue(report: IssueReportRequest, request: Request, db: AsyncSession = Depends(get_db)):
    user = await auth.get_current_user(request, db)
    ip_address = get_client_ip(request)
    
    allowed, wait_seconds = await check_rate_limit(user.id if user else None, ip_address, db)
    if not allowed:
        raise HTTPException(
            status_code=429,
            detail=f"Zbyt wiele zgłoszeń. Spróbuj ponownie za {wait_seconds} sekund."
        )
    
    new_issue = models.IssueReport(
        user_id=user.id if user else None,
        issue_type=report.issue_type,
        title=report.title,
        description=report.description,
        ip_address=ip_address if not user else None,
        status="PENDING"
    )
    db.add(new_issue)
    await db.commit()
    await db.refresh(new_issue)
    
    return {"status": "success", "id": new_issue.id}

@app.get("/api/admin/issues")
async def get_issues(request: Request, db: AsyncSession = Depends(get_db)):
    user = await auth.get_current_user(request, db)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    
    result = await db.execute(
        select(models.IssueReport, models.User)
        .outerjoin(models.User, models.IssueReport.user_id == models.User.id)
        .order_by(desc(models.IssueReport.created_at))
    )
    issues = result.all()
    
    return [
        {
            "id": issue.id,
            "issue_type": issue.issue_type,
            "title": issue.title,
            "description": issue.description,
            "status": issue.status,
            "user_id": issue.user_id,
            "username": user_obj.username if user_obj else None,
            "avatar_url": user_obj.avatar_url if user_obj else None,
            "created_at": issue.created_at.isoformat() if issue.created_at else None,
            "approved_at": issue.approved_at.isoformat() if issue.approved_at else None,
        }
        for issue, user_obj in issues
    ]

@app.post("/api/admin/issues/{issue_id}/approve")
async def approve_issue(issue_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    user = await auth.get_current_user(request, db)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    
    issue = await db.get(models.IssueReport, issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    was_already_approved = issue.status == "APPROVED"
    
    issue.status = "APPROVED"
    issue.approved_at = datetime.now(timezone.utc)
    await db.commit()
    
    if issue.user_id and not was_already_approved:
        badge_type = "BUG_REPORTS" if issue.issue_type == "BUG" else "FEATURE_REQUESTS"
        await _check_and_award_badges_internal(issue.user_id, badge_type, db)
        
        xp_reward = 50 if issue.issue_type == "BUG" else 75
        user_obj = await db.get(models.User, issue.user_id)
        if user_obj:
            user_obj.xp = (user_obj.xp or 0) + xp_reward
            xp_award = models.XpAward(
                user_id=issue.user_id,
                song_id=None,
                xp_amount=xp_reward,
                award_type="ISSUE_REPORT"
            )
            db.add(xp_award)
            await db.commit()
    
    return {"status": "success"}

@app.post("/api/admin/issues/{issue_id}/reject")
async def reject_issue(issue_id: int, request: Request, db: AsyncSession = Depends(get_db)):
    user = await auth.get_current_user(request, db)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    
    issue = await db.get(models.IssueReport, issue_id)
    if not issue:
        raise HTTPException(status_code=404, detail="Issue not found")
    
    issue.status = "REJECTED"
    await db.commit()
    
    return {"status": "success"}