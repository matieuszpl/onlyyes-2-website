# ONLY YES Radio - Technical Handbook & Context

## 1. Project Overview

**Project Name:** ONLY YES Radio
**Type:** Private internet radio station management system extending AzuraCast.
**Role:** Full-stack application for managing radio interactivity, AI content generation, and automated broadcasting.
**Deployment:** Dockerized environment on a VPS (Debian).
**Base URL:** `http://localhost:9523` (Development)

---

## 2. Tech Stack & Architecture

### Core Components

- **Orchestration:** Docker Compose
- **Proxy:** Nginx (Reverse Proxy for Frontend & Backend)
- **Database:** PostgreSQL 16 (Persistence)
- **Message Broker:** Redis 7 (Cache & Celery Broker)

### Backend (`/backend`)

- **Language:** Python 3.11
- **Framework:** FastAPI (Async)
- **ORM:** SQLAlchemy (with PostgreSQL)
- **Async Tasks:** Celery + Redis (for AI generation, RSS parsing, AzuraCast uploads)
- **Audio Processing:** FFmpeg, `yt-dlp` (for YouTube/Spotify downloads)
- **Auth:** OAuth2 with Discord (`authlib`)

### Frontend (`/frontend`)

- **Framework:** React (Vite)
- **Styling:** Tailwind CSS (Dark Mode default)
- **State Management:** Context API or Zustand
- **Communication:** Axios (REST API) + WebSocket/SSE (Live metadata)

### External Integrations

- **AzuraCast:** Main broadcasting server. Integration via API (uploads) and Webhooks (now playing).
- **OpenAI:** GPT-4o (News scripting), TTS-1 (Voice generation).
- **Discord:** Authentication provider.

---

## 3. Database Schema (PostgreSQL)

The system uses `sqlalchemy`. Ensure these models are reflected in the code.

### `users`

- `id` (PK, Integer)
- `discord_id` (String, Unique)
- `username` (String)
- `avatar_url` (String)
- `is_admin` (Boolean, Default: False)
- `reputation_score` (Integer, Default: 0) - For "Best Taste" gamification.

### `suggestions` (Song Requests)

- `id` (PK, Integer)
- `user_id` (FK -> users.id)
- `raw_input` (String) - User's link or text.
- `source_type` (Enum: YOUTUBE, SPOTIFY, TEXT)
- `status` (Enum: PENDING, APPROVED, REJECTED, PROCESSED)
- `metadata` (JSON or separate columns: title, artist, duration, youtube_id)

### `votes`

- `id` (PK, Integer)
- `user_id` (FK -> users.id)
- `song_id` (String/Integer - matched with AzuraCast ID)
- `vote_type` (Enum: LIKE, DISLIKE)
- `created_at` (Timestamp)

---

## 4. Key Workflows & Features

### A. Public Access & Authentication

**IMPORTANT:** The application must support **public (unauthenticated) access** for:

- Listening to the radio stream
- Viewing basic radio information (now playing, station info)
- Viewing public content (charts, playlists)

**Authentication (Discord OAuth2)** is required only for:

- Submitting song requests
- Voting (Like/Dislike)
- Accessing user profile and history
- Admin panel access

### B. Authentication (CRITICAL CONFIGURATION)

- **Provider:** Discord OAuth2.
- **Issue:** Docker networking vs Localhost browser cookies.
- **Solution Implemented:**
  1.  Backend runs on custom port **9523** (mapped via Nginx).
  2.  `ProxyHeadersMiddleware` is active in FastAPI.
  3.  `SessionMiddleware` configured with `https_only=False` and `same_site="lax"`.
  4.  Redirect URI is strictly: `http://localhost:9523/api/auth/callback`.

### C. Song Request System (The "Import" Flow)

1.  **User Action:** Inputs a link (Spotify/YouTube) or search term via Frontend.
2.  **Backend (API):** Validates input. If Spotify/Text -> searches YouTube API/Scraper for best match. Returns preview (Thumbnail/Title) to Frontend.
3.  **Confirmation:** User clicks "Send Request". Saved to DB as `PENDING`.
4.  **Admin Panel:** Admin sees pending requests. Clicks "Approve".
5.  **Worker (Celery):**
    - Executes `yt-dlp` to download audio (highest quality).
    - Normalizes audio (EBU R128 standard).
    - Tags MP3 (ID3 tags) using `mutagen`.
    - Uploads to AzuraCast API (Specific Request Playlist).
    - Notifies user (optional/Discord webhook).

### D. AI News Broadcast (The "News Anchor" Flow)

1.  **Trigger:** Celery Beat (Cron schedule, e.g., daily 11:50 AM).
2.  **Step 1 (Content):** `feedparser` fetches RSS from tech/gaming sites.
3.  **Step 2 (Script):** OpenAI GPT-4o summarizes top 3 items into a "Radio Script" (casual tone, "Only Yes" branding).
4.  **Step 3 (Voice):** OpenAI TTS (Model: `tts-1`, Voice: `alloy` or similar) generates raw speech.
5.  **Step 4 (Production):** FFmpeg mixes:
    - `intro.mp3` + `speech.mp3` (with background music & ducking) + `outro.mp3`.
6.  **Step 5 (Broadcast):** Uploads final MP3 to AzuraCast "News Playlist" scheduled for 12:00 PM.

### E. Automated Charts (Top 10)

1.  **Trigger:** Weekly (e.g., Friday).
2.  **Logic:** SQL Query aggregates `votes` from the last 7 days.
3.  **Production:** Worker generates short "Bridge" audio files (e.g., "Number 3, moving up!").
4.  **Action:** Clears "Top 10" playlist in AzuraCast and repopulates it: `[Bridge #10] -> [Song #10] -> [Bridge #9] -> [Song #9]...`

---

## 5. Coding Standards for Agent

1.  **Environment Variables:** NEVER hardcode secrets. Always use `os.getenv` and refer to `.env`.
2.  **Docker Compatibility:** Remember the app runs in containers.
    - Backend sees DB at host `db`.
    - Backend sees Redis at host `redis`.
    - Nginx handles routing.
3.  **Async/Await:** Use `async def` for all FastAPI endpoints and DB calls (where supported).
4.  **Error Handling:** All external calls (AzuraCast, OpenAI, YouTube) must be wrapped in `try/except` with logging.
5.  **Frontend:** Use Functional Components with Hooks. Use Tailwind for all styling.

---

## 6. Current File Structure

```text
/opt/only-yes-radio/
├── docker-compose.yml
├── .env
├── nginx/
│   └── nginx.conf
├── backend/
│   ├── Dockerfile
│   ├── requirements.txt
│   └── src/
│       ├── main.py (Entrypoint, Auth, Middleware)
│       ├── config.py
│       ├── database.py
│       ├── models.py
│       ├── auth.py
│       ├── tasks.py (Celery)
│       ├── services/ (Logic for yt-dlp, ai, etc.)
└── frontend/
    ├── Dockerfile
    ├── src/
```
