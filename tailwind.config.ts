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
          card: "#16161F",
        },
        line: "#2A2A3E",
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
      boxShadow: {
        "glow-green": "0 0 40px -8px rgba(78, 204, 163, 0.6)",
        "glow-red": "0 0 40px -8px rgba(255, 107, 107, 0.5)",
        "glow-gold":
          "0 10px 40px -10px rgba(201, 168, 76, 0.5), inset 0 1px 0 rgba(255,255,255,0.25)",
      },
      transitionTimingFunction: {
        smooth: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
