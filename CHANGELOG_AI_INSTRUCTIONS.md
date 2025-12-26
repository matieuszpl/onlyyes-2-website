# Instrukcje aktualizacji Changelog dla AI

## Lokalizacja pliku

Plik changelog znajduje się w: `frontend/src/pages/ChangelogPage.jsx`

## Struktura danych

Changelog przechowywany jest w tablicy `changelogData` w formacie:

```javascript
const changelogData = [
  {
    date: "YYYY-MM-DD", // Format ISO (YYYY-MM-DD)
    entries: {
      "Nowe funkcjonalności": [
        "Opis nowej funkcjonalności 1",
        "Opis nowej funkcjonalności 2",
      ],
      "Poprawki błędów": ["Opis poprawki 1"],
      "UI/UX": ["Opis zmiany UI/UX 1"],
      Infrastruktura: ["Opis zmiany infrastruktury 1"],
    },
  },
  // ...
];
```

## Kategorie zmian

### 1. "Nowe funkcjonalności"

- **Kiedy używać**: Gdy dodawana jest całkowicie nowa funkcjonalność, która wcześniej nie istniała
- **Przykłady**:
  - "Dodano system śledzenia XP i ranking użytkowników"
  - "Dodano funkcję aktywnych słuchaczy"
  - "Dodano możliwość głosowania na utwory"
- **NIE używaj** dla: ulepszeń istniejących funkcji (użyj "UI/UX" lub "Poprawki błędów")

### 2. "Poprawki błędów"

- **Kiedy używać**: Gdy naprawiane są błędy, problemy z połączeniem, stabilnością
- **Przykłady**:
  - "Naprawiono problem z odtwarzaniem radia"
  - "Rozszerzono funkcjonalność radia i obsługę połączeń"
  - "Naprawiono błąd z wyświetlaniem statystyk"

### 3. "UI/UX"

- **Kiedy używać**: Gdy zmieniany jest wygląd, interfejs, doświadczenie użytkownika, ulepszenia istniejących funkcji
- **Przykłady**:
  - "Ulepszono statystyki użytkowników"
  - "Zaktualizowano tytuł index.html"
  - "Ulepszono obsługę sesji medialnej"
  - "Ulepszono komponenty frontendu"

### 4. "Infrastruktura"

- **Kiedy używać**: Gdy zmieniana jest konfiguracja, domeny, deployment, struktura projektu
- **Przykłady**:
  - "Zaktualizowano referencje domen"
  - "Dodano początkową strukturę projektu z backendem i frontendem"
  - "Zaktualizowano konfigurację Docker"

## Zasady dodawania wpisów

### 1. Format daty

- Używaj formatu ISO: `YYYY-MM-DD` (np. `2025-12-26`)
- Grupuj wszystkie commity z tego samego dnia w jeden obiekt

### 2. Styl opisu zmian

- **Język**: Polski
- **Forma**: Zdania w czasie przeszłym, bezosobowe
- **Długość**: Krótkie, zwięzłe zdania (max 1 linia)
- **Szczegółowość**: Tylko najważniejsze informacje, bez technicznych detali
- **Precyzja**: Jeśli funkcjonalność wcześniej nie istniała, użyj "Dodano..." i kategorii "Nowe funkcjonalności"

### Przykłady dobrych wpisów:

- ✅ "Dodano system śledzenia XP i ranking użytkowników" (Nowe funkcjonalności)
- ✅ "Dodano funkcję aktywnych słuchaczy" (Nowe funkcjonalności)
- ✅ "Ulepszono statystyki użytkowników" (UI/UX)
- ✅ "Naprawiono problem z odtwarzaniem radia" (Poprawki błędów)

### Przykłady złych wpisów:

- ❌ "Fixed bug in XP calculation function where division by zero occurred"
- ❌ "Dodano nowy endpoint /api/users/stats który zwraca statystyki użytkownika z bazy danych"
- ❌ "Refactored code in GlobalAudioContext.jsx to improve performance"
- ❌ "Dodano panel administratora z zarządzaniem użytkownikami"
- ❌ "Dodano skrypt admina do zarządzania bazą danych"
- ❌ "Ulepszono śledzenie XP i funkcje rankingu" (jeśli wcześniej nie istniało - powinno być "Dodano..." w "Nowe funkcjonalności")

### 3. Grupowanie zmian

- Jeśli w jednym dniu jest wiele commitów, dodaj je jako osobne wpisy w odpowiednich kategoriach
- Nie łącz niepowiązanych zmian w jeden wpis
- Jeśli commity dotyczą tego samego obszaru, możesz je połączyć w jeden wpis

### 4. Kolejność

- Najnowsze daty na górze (indeks 0)
- W obrębie dnia: kategorie w kolejności: "Nowe funkcjonalności", "Poprawki błędów", "UI/UX", "Infrastruktura"
- W obrębie kategorii: najważniejsze zmiany pierwsze

## Proces aktualizacji

### Krok 1: Pobierz historię commitów

```bash
git log --pretty=format:"%ad|%s" --date=short --no-merges
```

### Krok 2: Filtruj i grupowaj

- Pomiń commity merge
- Pomiń commity techniczne (typu "fix typo", "update dependencies")
- **Pomiń wszystkie zmiany związane z panelem administratora** (admin panel, admin features, admin scripts, backend admin endpoints)
- Zostaw tylko znaczące zmiany funkcjonalne dla **gości i zalogowanych użytkowników**
- Grupuj według daty

### Krok 3: Tłumacz, upraszczaj i kategoryzuj

- Przetłumacz tytuły commitów na polski
- Uprość techniczne opisy do zrozumiałych dla użytkownika
- Usuń szczegóły implementacyjne
- **Wyklucz zmiany dotyczące panelu administratora** - changelog jest dla zwykłych użytkowników
- **Przypisz każdy wpis do odpowiedniej kategorii**:
  - Nowa funkcjonalność → "Nowe funkcjonalności" (użyj "Dodano...")
  - Naprawa błędu → "Poprawki błędów"
  - Zmiana wyglądu/ulepszenie UI → "UI/UX"
  - Konfiguracja/infrastruktura → "Infrastruktura"

### Krok 4: Dodaj do pliku

- Otwórz `ChangelogPage.jsx`
- Znajdź tablicę `changelogData`
- Dodaj nowy obiekt na początku tablicy (jeśli nowa data)
- Lub dodaj wpisy do istniejącego obiektu w odpowiednich kategoriach (jeśli ta sama data)
- **Ważne**: Jeśli kategoria nie istnieje w dniu, dodaj ją jako pustą tablicę lub pomiń (puste kategorie są automatycznie ukrywane)

## Przykład aktualizacji

### Przed:

```javascript
const changelogData = [
  {
    date: "2025-12-26",
    entries: {
      "UI/UX": ["Ulepszono statystyki użytkowników"],
    },
  },
];
```

### Po dodaniu nowych commitów z 2025-12-27:

```javascript
const changelogData = [
  {
    date: "2025-12-27",
    entries: {
      "Nowe funkcjonalności": ["Dodano możliwość eksportu playlisty"],
      "Poprawki błędów": ["Naprawiono problem z synchronizacją czasu"],
      "UI/UX": ["Ulepszono responsywność na urządzeniach mobilnych"],
    },
  },
  {
    date: "2025-12-26",
    entries: {
      "UI/UX": ["Ulepszono statystyki użytkowników"],
    },
  },
];
```

## Zachowanie spójności

1. **Styl pisania**: Zawsze używaj czasu przeszłego, bezosobowego
2. **Format dat**: Zawsze ISO (YYYY-MM-DD)
3. **Język**: Zawsze polski
4. **Poziom szczegółowości**: Zawsze wysoki poziom abstrakcji, bez detali technicznych
5. **Kolejność**: Zawsze najnowsze na górze
6. **Zakres zmian**: Tylko funkcjonalności dla gości i zalogowanych użytkowników, **NIE** panel administratora
7. **Precyzja kategorii**: Używaj "Dodano..." dla nowych funkcjonalności, "Ulepszono..." dla ulepszeń, "Naprawiono..." dla bugfixów

## Uwagi techniczne

- Plik używa komponentów: `PageHeader`, `motion` z framer-motion
- Daty są formatowane przez funkcję `formatDate()` używającą `toLocaleDateString("pl-PL")`
- **Wszystkie daty są domyślnie rozwinięte** - nie ma możliwości zwijania
- Kategorie są automatycznie ukrywane jeśli nie mają wpisów
- Nie modyfikuj struktury komponentu, tylko tablicę `changelogData`
- Ikony i kolory kategorii są zdefiniowane w `categoryIcons` i `categoryColors`
