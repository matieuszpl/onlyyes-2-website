# ONLY YES Radio - Frontend Style & UX Guide

## 1. Aesthetic Direction: "Clean Future Tech"

**Core Vibe:** High-precision sci-fi interface. Think _Tron: Legacy_ meets _Oblivion_ UI. It is sleek, sterile, and perfectly organized. It is NOT gritty, glitchy, or dystopian. It represents high-end technology used in a futuristic laboratory or spacecraft.

### Visual Analysis & Directives:

- **Atmosphere:** Deep, clean dark backgrounds (`#050505` to `#0a0a0a`). No noise textures.
- **Palette:** High-contrast Neon **Cyan** and **Magenta** against deep black.
- **Structure:** Strict geometry. Thin, precise 1px lines. "Glass" panels are polished and clear, not dirty.
- **Typography:** Ultra-modern sans-serifs. Headers are bold and widely spaced. Data is presented in crisp monospace fonts.
- **Energy:** Smooth transitions, holographic fades, constant "humming" glow animations rather than erratic glitches.

---

## 2. Technical Architecture for "Persistent Audio" (CRITICAL)

**Requirement:** Audio NEVER stops, volume NEVER resets on navigation.

### The "Global Shell" Pattern

The application structure **MUST** follow this hierarchy (represented below via indentation):

    <App>
      <ThemeProvider> {/* Handles Default/Work/RGB/Holiday modes */}
        <GlobalAudioContext> {/* Holds the <audio> tag, volume state in localStorage */}
          <Router>
            <LayoutManager>
               {/* LayoutManager decides layout based on route (Home vs Subpage vs Kiosk) */}
               <PageContent />
               <FloatingPlayerOverlay /> {/* Only visible on subpages */}
            </LayoutManager>
          </Router>
        </GlobalAudioContext>
      </ThemeProvider>
    </App>

**Rules for Agent:**

1.  **The `<audio>` tag is hidden** at the root level. It never unmounts.
2.  **Volume State:** Must be persisted in `localStorage`. Apply immediately on app load.
3.  **UI Decoupling:** The visible Player components (Hero or Floating) are just "remote controls" for the hidden global audio element.

---

## 3. Theme Engine (Tailwind & CSS Variables)

The app supports multiple themes controlled by a data-attribute on the body/root.

### Theme Definitions:

1.  **Default (Future Tech):**
    - `--bg-app`: `#050505` (Obsidian Black)
    - `--surface`: `#121212` (Polished Dark Grey)
    - `--primary`: `#00f3ff` (Electric Cyan) - Used for main actions and active states.
    - `--secondary`: `#ff00ff` (Hot Magenta) - Used for highlights, gradients, and alerts.
    - _Style Note:_ Use gradients blending Cyan into Magenta for special buttons.
2.  **Work (Corporate Orange):**
    - `--primary`: `#ff7e21` (Company Orange)
    - _Vibe:_ Standard SaaS dashboard, high legibility, flat design.
3.  **RGB (Gamer Mode):**
    - `--primary`: `transparent` (uses background-clip with animated rainbow gradient).
    - _Effect:_ Borders and active states cycle through RGB spectrum smoothly.
4.  **Holiday:**
    - `--primary`: `#d4af37` (Gold).
    - _Effect:_ Elegant frost/glass overlay effects.

---

## 4. Layout & Responsiveness Strategies

### A. The "Morphing" Player Layout

- **Home Page (`/`):**
  - **Player Position:** Top Hero Section.
  - **Visuals:** Large, crisp Album Art. No distortions.
  - **Layout:** Player on Top -> Content below.
- **Subpages (`/schedule`, `/requests`):**
  - **Player Position:** Floating Bar at the Bottom (Docked).
  - **Animation:** When navigating Home -> Subpage, use `framer-motion` layoutId to physically morph the Big Player into the Mini Player seamlessly.

### B. Device Specifics

- **Desktop:**
  - Navigation: Vertical Sidebar (Left) - Collapsible.
  - Grid: 4-column Bento grid. Precise spacing.
- **Mobile:**
  - Navigation: Fixed Bottom Bar (Thumb-friendly).
  - Grid: Single column card stack.
  - Player: Stick to bottom, above nav bar.
- **Kiosk Mode (Tablet/Kitchen):**
  - **Trigger:** `?mode=kiosk` or UI toggle.
  - **UI:** Hides ALL navigation. Full immersion.
  - **Layout:** Split screen. Top 70% = Visualizer + Current Song. Bottom 30% = Last Played History (Horizontal Scroll).
  - **Interactions:** Massive touch targets.
  - **Screensaver:** Dims after 5 mins inactivity, showing only time and song title in thin outline font.

---

## 5. Component Styling Rules

### A. Tech Panels

- **Background:** `bg-black/80` + `backdrop-blur-xl` (Heavy blur).
- **Borders:** `border border-white/5` (Very subtle).
- **Active State:** When active, border glows with Cyan (`shadow-[0_0_10px_rgba(0,243,255,0.3)]`).
- **Decorations:** Small, non-intrusive tech markings (dots, tiny plus signs) in corners.

### B. Buttons

- **Shape:** Geometric. Chamfered edges (45-degree cut) on one side only.
- **Gradient:** Main buttons use a subtle linear gradient from Cyan to Magenta (opacity 20%) on hover.
- **Text:** Uppercase, tracking-widest.

### C. Typography

- **Headers:** Clean, geometric sans-serif (e.g., _Rajdhani_, _Exo 2_).
- **Metadata:** Numerical data in monospace.
- **Animation:** Smooth character fade-ins (opacity 0->1). No decoding/scrambling effects.

---

## 6. Animation Library (Framer Motion)

- **Page Transitions:** `AnimatePresence` mode="wait". Smooth opacity fades and slight Y-axis slides.
- **Visualizer:**
  - **Style:** Clean bars or a single coherent line wave.
  - **Colors:** Gradient fill from Cyan (bottom) to Magenta (top).

---

## 7. Implementation Checklist for Agent

1.  **Setup:**
    - Install `framer-motion`, `lucide-react`, `clsx`, `tailwind-merge`.
    - Define CSS variables for Cyan `#00f3ff` and Magenta `#ff00ff`.
2.  **Audio Core:**
    - Build `GlobalAudioProvider.jsx`. Sync volume with `localStorage`.
3.  **Layouts:**
    - Build `Sidebar` (Desktop) and `BottomNav` (Mobile).
    - Build `KioskLayout` (No nav, touch optimized).
4.  **Player Components:**
    - `HeroPlayer.jsx` (Home view).
    - `DockedPlayer.jsx` (Subpage view).
    - _Crucial:_ Ensure they share the same data source from Context.
5.  **Visuals:**
    - Implement `ThemeSwitcher`.
    - Create `AudioVisualizer` with Cyan-Magenta gradient.
