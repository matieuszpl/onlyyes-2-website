from contextlib import asynccontextmanager
from fastapi import FastAPI, Depends, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from starlette.middleware.sessions import SessionMiddleware
from uvicorn.middleware.proxy_headers import ProxyHeadersMiddleware
from starlette.responses import RedirectResponse, StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, desc
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta, timezone
import httpx
import asyncio

from .database import engine, Base, get_db
from . import models, auth, config
from .services.azuracast import azuracast_client
from .services.event_broadcaster import event_broadcaster
from .services.xp_system import XP_PER_VOTE, XP_PER_MINUTE_LISTENING, get_rank
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
    
    task1 = asyncio.create_task(background_polling())
    task2 = asyncio.create_task(background_xp_tracking())
    yield
    task1.cancel()
    task2.cancel()
    try:
        await task1
        await task2
    except asyncio.CancelledError:
        pass
    await engine.dispose()

app = FastAPI(title="ONLY YES Radio API", lifespan=lifespan)

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
    return await auth.oauth.discord.authorize_redirect(request, redirect_uri)

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
    
    result = await db.execute(select(models.User).where(models.User.discord_id == discord_user['id']))
    db_user = result.scalar_one_or_none()
    
    if not db_user:
        new_user = models.User(
            discord_id=discord_user['id'],
            username=discord_user['username'],
            avatar_url=f"https://cdn.discordapp.com/avatars/{discord_user['id']}/{discord_user['avatar']}.png"
        )
        db.add(new_user)
        await db.commit()
    
    request.session['user'] = discord_user
    
    return RedirectResponse(url=f"{config.settings.app_base_url}/")

@app.get("/api/users/me")
async def read_users_me(request: Request, db: AsyncSession = Depends(get_db)):
    user = await auth.get_current_user(request, db)
    if user:
        xp = user.xp or 0
        rank_info = get_rank(xp)
        return {
            "is_logged_in": True,
            "username": user.username,
            "avatar": user.avatar_url,
            "is_admin": user.is_admin,
            "reputation_score": user.reputation_score,
            "xp": xp,
            "rank": rank_info
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
        base_url = config.settings.azuracast_url.rstrip("/")
        station_id = config.settings.azuracast_station_id
        api_key = config.settings.azuracast_api_key
        
        url = f"{base_url}/api/station/{station_id}/schedule"
        headers = {"Accept": "application/json"}
        if api_key:
            headers["X-API-Key"] = api_key
        
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get(url, headers=headers)
            response.raise_for_status()
            raw_data = response.json()
            
            return {
                "url": url,
                "raw_response": raw_data,
                "first_item_details": raw_data[0] if isinstance(raw_data, list) and len(raw_data) > 0 else None
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

@app.post("/api/suggestions/preview")
async def preview_suggestion(preview: SuggestionPreviewRequest):
    # TODO: Integracja z yt-dlp/YouTube API
    return {
        "title": "Mock Preview Title",
        "artist": "Mock Preview Artist",
        "thumbnail": None,
        "source_type": "YOUTUBE",
        "duration_seconds": 180
    }

@app.post("/api/suggestions")
async def create_suggestion(suggestion: SuggestionCreateRequest, request: Request, db: AsyncSession = Depends(get_db)):
    user = await auth.get_current_user(request, db)
    if not user:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    new_suggestion = models.Suggestion(
        user_id=user.id,
        raw_input=suggestion.input,
        source_type=suggestion.source_type,
        title=suggestion.title,
        artist=suggestion.artist,
        thumbnail_url=suggestion.thumbnail_url,
        duration_seconds=suggestion.duration_seconds,
        status="PENDING"
    )
    db.add(new_suggestion)
    await db.commit()
    await db.refresh(new_suggestion)
    return {"status": "success", "id": new_suggestion.id}

@app.get("/api/suggestions")
async def get_suggestions(request: Request, db: AsyncSession = Depends(get_db)):
    user = await auth.get_current_user(request, db)
    if not user or not user.is_admin:
        raise HTTPException(status_code=403, detail="Admin only")
    
    result = await db.execute(
        select(models.Suggestion).order_by(desc(models.Suggestion.created_at))
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
    
    return {
        "user_id": user.id,
        "username": user.username,
        "avatar_url": user.avatar_url,
        "suggestions_count": suggestions_count or 0,
        "votes_count": votes_count or 0,
        "reputation_score": user.reputation_score
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
            .order_by(desc(models.Vote.created_at))
            .limit(limit // 2)
        )
        
        for vote, user in votes_result.all():
            activities.append({
                "type": "vote",
                "text": f"{user.username} {'polubił utwór' if vote.vote_type == 'LIKE' else 'nie polubił utworu'} ",
                "timestamp": vote.created_at.isoformat() if vote.created_at else None,
                "icon": "heart",
                "user_id": user.id,
                "username": user.username,
                "vote_type": vote.vote_type
            })
        
        # Ostatnie propozycje
        suggestions_result = await db.execute(
            select(models.Suggestion, models.User)
            .join(models.User, models.Suggestion.user_id == models.User.id)
            .order_by(desc(models.Suggestion.created_at))
            .limit(limit // 2)
        )
        
        for suggestion, user in suggestions_result.all():
            activities.append({
                "type": "suggestion",
                "text": f"{user.username} zaproponował utwór",
                "timestamp": suggestion.created_at.isoformat() if suggestion.created_at else None,
                "icon": "music",
                "user_id": user.id,
                "username": user.username
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
    
    return {
        "station": station_info or {},
        "now_playing": now_playing or {},
        "statistics": {
            "total_users": total_users or 0,
            "total_votes": total_votes or 0,
            "total_suggestions": total_suggestions or 0,
            "total_likes": total_likes or 0,
            "total_dislikes": total_dislikes or 0
        }
    }