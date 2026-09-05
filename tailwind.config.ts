import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "var(--color-ink)",
        teal: "var(--color-teal)",
        lime: "var(--color-lime)",
        ember: "var(--color-ember)",
        cream: "var(--color-cream)",
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      borderRadius: {
        card: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
