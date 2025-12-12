# ONLY YES Radio - System Architecture

System zarządzania radiem internetowym zintegrowany z AzuraCast, wykorzystujący AI do generowania audycji oraz automatyzację pobierania muzyki.

## 📋 TO-DO LIST

**UWAGA:** Aplikacja musi wspierać **publiczny dostęp (bez logowania)** do:

- Słuchania streamu radiowego
- Wyświetlania podstawowych informacji o radiu (teraz gra, info o stacji)
- Przeglądania publicznych treści (listy przebojów, playlisty)

**Logowanie (Discord OAuth2)** jest wymagane tylko do:

- Wysyłania propozycji utworów
- Głosowania (Like/Dislike)
- Dostępu do profilu użytkownika i historii
- Panelu administratora

### 🟢 FAZA 1: Fundamenty (Setup & Auth)

#### Backend (FastAPI + PostgreSQL)

- [ ] Konfiguracja połączenia z bazą danych (SQLAlchemy + asyncpg)
- [ ] Konfiguracja połączenia z Redis (Celery Broker)
- [ ] Implementacja modelu użytkownika (`User` table)
- [ ] Integracja Discord OAuth2 (Logowanie / Rejestracja)
- [ ] Middleware do obsługi sesji (JWT lub Session Cookie)

#### Frontend (React + Tailwind)

- [ ] Inicjalizacja projektu (Vite) i konfiguracja Tailwind CSS
- [ ] Layout główny (Navbar, Footer, "Dark Mode" theme)
- [ ] Integracja logowania (Przycisk "Zaloguj przez Discord")
- [ ] Obsługa stanu użytkownika (Zalogowany/Niezalogowany - Context API/Zustand)

### 🟡 FAZA 2: Interakcja (Requests & Voting)

#### Backend

- [ ] Model danych dla piosenek i głosów (`Songs`, `Votes`)
- [ ] Webhook Receiver: Odbieranie info "Now Playing" z AzuraCast
- [ ] API Endpoint: Głosowanie (Like/Dislike) z limitami na użytkownika
- [ ] System Propozycji:
  - [ ] Endpoint do weryfikacji linków (YouTube/Spotify)
  - [ ] Integracja `yt-dlp` do pobierania metadanych
  - [ ] Panel Admina: Endpointy do akceptacji/odrzucania utworów
  - [ ] Celery Task: Pobieranie audio, normalizacja, tagowanie ID3
  - [ ] Celery Task: Upload pliku do API AzuraCast

#### Frontend

- [ ] Komponent: Player Radiowy (Stream + Metadane Live)
- [ ] Komponent: Przyciski głosowania (reagujące na zmiany piosenek)
- [ ] Widok: Formularz propozycji (Input linku + podgląd miniatury)
- [ ] Widok: Lista propozycji (dla Admina) z akcjami

### 🔴 FAZA 3: AI & Automatyzacja (Content)

#### Backend (Worker)

- [ ] Integracja OpenAI API (Generator tekstu newsów)
- [ ] Integracja OpenAI TTS / ElevenLabs (Generator głosu)
- [ ] Skrypt FFmpeg: Miksowanie głosu z podkładem (Intro/Outro/Ducking)
- [ ] Celery Task: "Newsy o 12:00" (RSS -> AI -> MP3 -> AzuraCast)
- [ ] Celery Task: "Lista Przebojów" (Agregacja top głosów -> Generowanie zapowiedzi -> Playlist Upload)

#### Frontend

- [ ] Widok: Archiwum List Przebojów (Top Tygodnia/Miesiąca)
- [ ] Komponent: Wizualizator Audio (Canvas API)

---

## 🛠 Tech Stack

- **Core:** Python 3.11, Node.js 20
- **Frameworks:** FastAPI, React (Vite)
- **Database:** PostgreSQL 16, Redis 7
- **AI/Media:** OpenAI API, FFmpeg, yt-dlp
- **Infra:** Docker Compose, Nginx
