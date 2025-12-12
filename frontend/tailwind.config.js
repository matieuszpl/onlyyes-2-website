export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        primary: "var(--primary)",
        "primary-alt": "var(--primary-alt)",
        accent: "var(--accent-magenta)",
        "accent-magenta": "var(--accent-magenta)",
        "accent-cyan": "var(--accent-cyan)",
        "text-primary": "var(--text-primary)",
        "text-secondary": "var(--text-secondary)",
        "bg-app": "var(--bg-app)",
        "bg-panel": "var(--bg-panel)",
      },
      fontFamily: {
        header: ["Oxanium", "sans-serif"],
        brand: ["Oxanium", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
        sans: ["Noto Sans", "system-ui", "sans-serif"],
      },
    },
  },
};
