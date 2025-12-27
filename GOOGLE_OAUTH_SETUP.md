# Konfiguracja Google OAuth

## Wartości do pliku .env

Dodaj następujące zmienne do pliku `.env` w katalogu `backend/`:

```env
GOOGLE_CLIENT_ID=twoj_google_client_id
GOOGLE_CLIENT_SECRET=twoj_google_client_secret
```

## Konfiguracja Google Cloud Console

1. Przejdź do [Google Cloud Console](https://console.cloud.google.com/)
2. Utwórz nowy projekt lub wybierz istniejący
3. Przejdź do **APIs & Services** > **Credentials**
4. Kliknij **Create Credentials** > **OAuth client ID**
5. Jeśli to pierwszy raz, skonfiguruj **OAuth consent screen**:
   - Wybierz typ użytkownika (External lub Internal)
   - Wypełnij wymagane pola (App name, User support email, Developer contact)
   - Dodaj scopes: `openid`, `email`, `profile`
   - Dodaj test users jeśli aplikacja jest w trybie testowym
6. Utwórz **OAuth client ID**:
   - Application type: **Web application**
   - Name: np. "ONLY YES Radio"
   - **Authorized JavaScript origins**:
     - `https://onlyyes.pl`
     - `http://localhost:9523` (dla developmentu)
   - **Authorized redirect URIs**:
     - `https://onlyyes.pl/api/auth/callback/google`
     - `https://onlyyes.pl/api/auth/connect/callback/google`
     - `http://localhost:9523/api/auth/callback/google` (dla developmentu)
     - `http://localhost:9523/api/auth/connect/callback/google` (dla developmentu)
7. Skopiuj **Client ID** i **Client Secret** do pliku `.env`

## Wymagane usługi Google

- **Google+ API** (jeśli dostępna) - opcjonalna
- **Google Identity Services** - automatycznie włączona przy konfiguracji OAuth

## Funkcjonalności

### Logowanie przez Google
- Endpoint: `/api/auth/login/google`
- Tworzy nowe konto jeśli użytkownik nie istnieje
- Łączy z istniejącym kontem jeśli użytkownik już ma konto Discord

### Łączenie kont
- Użytkownik zalogowany przez Discord może połączyć konto Google
- Użytkownik zalogowany przez Google może połączyć konto Discord
- Po połączeniu można logować się przez dowolny sposób

### Zmiana nazwy użytkownika
- Endpoint: `PUT /api/users/me/display-name`
- Ograniczenia:
  - 3-30 znaków
  - Tylko litery, cyfry, `_`, `-`, `.`

### Wybór avatara
- Endpoint: `PUT /api/users/me/avatar`
- Opcje:
  - `DISCORD` - avatar z Discorda (jeśli konto połączone)
  - `GOOGLE` - avatar z Google (jeśli konto połączone)
  - `DEFAULT` - domyślny avatar (avatar-logo.svg z kolorem wyróżnionego osiągnięcia)

## Migracja bazy danych

Migracje są automatyczne - przy starcie aplikacji dodane zostaną nowe kolumny:
- `google_id` (VARCHAR, unique, nullable)
- `display_name` (VARCHAR, nullable)
- `avatar_source` (VARCHAR, default 'DISCORD')
- `discord_avatar_url` (VARCHAR, nullable)
- `google_avatar_url` (VARCHAR, nullable)

Istniejące użytkownicy:
- `display_name` zostanie ustawione na `username`
- `discord_avatar_url` zostanie ustawione na `avatar_url` jeśli istnieje
- `avatar_source` zostanie ustawione na 'DISCORD'

