import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: "#0F1B3C",
        orange: "#FF6B35",
        "orange-dark": "#E85A25",
        cream: "#FDFAF5",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      borderRadius: {
        card: "12px",
      },
      boxShadow: {
        soft: "0 4px 20px rgba(15, 27, 60, 0.06)",
        "soft-lg": "0 12px 40px rgba(15, 27, 60, 0.10)",
        glow: "0 8px 32px rgba(255, 107, 53, 0.25)",
      },
    },
  },
  plugins: [],
};

export default config;
