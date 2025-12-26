export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        // Kolory z opacity modifiers są teraz definiowane w @theme w index.css
        primary: "var(--color-primary)",
        "primary-alt": "var(--primary-alt)",
        accent: "var(--accent-magenta)",
        "accent-magenta": "var(--color-accent-magenta)",
        "accent-cyan": "var(--color-accent-cyan)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "bg-app": "var(--bg-app)",
        "bg-panel": "var(--bg-panel)",
      },
      fontFamily: {
        header: ['"Rajdhani"', '"Exo 2"', "sans-serif"],
        brand: ['"Rajdhani"', '"Exo 2"', "sans-serif"],
        mono: ['"JetBrains Mono"', "monospace"],
        sans: [
          '"Rajdhani"',
          '"Exo 2"',
          "system-ui",
          "-apple-system",
          "sans-serif",
        ],
      },
    },
  },
};
