import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: {
          DEFAULT: "#0a0a0b",
          elevated: "#131316",
          card: "#1a1a1f",
        },
        accent: {
          green: "#4ade80",
          red: "#f87171",
          gold: "#d4c5a0",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        "radial-spot":
          "radial-gradient(ellipse at top, rgba(74,222,128,0.08), transparent 60%)",
      },
    },
  },
  plugins: [],
};

export default config;
