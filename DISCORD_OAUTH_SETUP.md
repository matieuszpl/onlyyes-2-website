# Konfiguracja Discord OAuth

## Problem z redirect_uri

Błąd "Nieprawidłowy parametr redirect_uri" oznacza, że redirect_uri użyty w żądaniu OAuth nie pasuje do tego, co jest zarejestrowane w aplikacji Discord.

## Konfiguracja Discord Developer Portal

1. Przejdź do [Discord Developer Portal](https://discord.com/developers/applications)
2. Wybierz swoją aplikację lub utwórz nową
3. Przejdź do **OAuth2** > **General**
4. W sekcji **Redirects** dodaj następujące URI:

### Dla produkcji (https://onlyyes.pl):

```
https://onlyyes.pl/api/auth/callback
https://onlyyes.pl/api/auth/connect/callback/discord
```

### Dla developmentu (localhost):

```
http://localhost:9523/api/auth/callback
http://localhost:9523/api/auth/connect/callback/discord
```

**WAŻNE:**

- URI muszą być dokładnie takie same jak w kodzie (z protokołem http/https)
- Nie dodawaj końcowego slasha
- Sprawdź czy APP_BASE_URL w .env jest ustawione prawidłowo

## Zmienne środowiskowe

Upewnij się, że w pliku `.env` masz:

```env
APP_BASE_URL=https://onlyyes.pl
# lub dla developmentu:
# APP_BASE_URL=http://localhost:9523

DISCORD_CLIENT_ID=twoj_discord_client_id
DISCORD_CLIENT_SECRET=twoj_discord_client_secret
```

## Sprawdzanie konfiguracji

Po uruchomieniu aplikacji, w logach powinieneś zobaczyć:

```
Discord login redirect_uri: https://onlyyes.pl/api/auth/callback
APP_BASE_URL: https://onlyyes.pl
```

Upewnij się, że te wartości pasują do URI zarejestrowanych w Discord Developer Portal.

## Rozwiązywanie problemów

1. **Sprawdź logi backendu** - zobacz jaki redirect_uri jest używany
2. **Porównaj z Discord Portal** - URI musi być identyczny (wielkość liter, slashe, protokół)
3. **Sprawdź APP_BASE_URL** - upewnij się, że jest ustawione prawidłowo w .env
4. **Wyczyść cache przeglądarki** - czasami stary redirect_uri może być zapisany w cache
