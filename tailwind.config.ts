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
          DEFAULT: "#0A0A0F",
          elevated: "#12121A",
          card: "#12121A",
        },
        line: {
          DEFAULT: "#1E1E28",
          strong: "#2A2A3A",
        },
        cream: "#F0EDE8",
        muted: {
          DEFAULT: "#8A8A95",
          soft: "#55555F",
        },
        accent: {
          green: "#4ECCA3",
          red: "#FF6B6B",
          gold: "#C9A84C",
          goldLight: "#E8C96B",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        serif: ["var(--font-instrument-serif)", "Georgia", "serif"],
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
