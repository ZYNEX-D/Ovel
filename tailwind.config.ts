import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ovel: {
          50: "#F2FAF9",
          100: "#C8E6E2",
          200: "#9ED5D1",
          300: "#63C1BB",
          400: "#3A9295",
          500: "#105F68",
          600: "#0D4F57",
          700: "#0A3E44",
          800: "#072D32",
          900: "#041C1F",
          canvas: "#F7FAF9",
          card: "#FFFFFF",
          dark: "#0F2624",
        },
      },
      fontFamily: {
        kaleko: ["var(--font-kaleko)", "Satoshi", "sans-serif"],
        disolve: ["var(--font-disolve)", "sans-serif"],
      },
      keyframes: {
        blurFadeUp: {
          "0%": { opacity: "0", filter: "blur(14px)", transform: "translateY(24px)" },
          "100%": { opacity: "1", filter: "blur(0px)", transform: "translateY(0)" },
        },
        gradientFlow1: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)", opacity: "0.2" },
          "50%": { transform: "translate(-80px, 60px) scale(1.6)", opacity: "0.85" },
        },
        gradientFlow2: {
          "0%, 100%": { transform: "translate(0px, 0px) scale(1)", opacity: "0.25" },
          "50%": { transform: "translate(80px, -80px) scale(1.5)", opacity: "0.75" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-10px)" },
        },
      },
      animation: {
        blurFadeUp: "blurFadeUp 1.1s cubic-bezier(0.22, 1, 0.36, 1) forwards",
        gradientFlow1: "gradientFlow1 12s ease-in-out infinite",
        gradientFlow2: "gradientFlow2 14s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};

export default config;
