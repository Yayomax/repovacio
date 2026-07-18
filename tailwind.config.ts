import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: [
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          '"Segoe UI"',
          "Roboto",
          '"Helvetica Neue"',
          "Arial",
          "sans-serif",
        ],
      },
      keyframes: {
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(18px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(.96)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        float: {
          "0%, 100%": { transform: "translate(0, 0)" },
          "50%": { transform: "translate(14px, -28px)" },
        },
        shake: {
          "0%, 100%": { transform: "translateX(0)" },
          "20%, 60%": { transform: "translateX(-6px)" },
          "40%, 80%": { transform: "translateX(6px)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "200% 0" },
          "100%": { backgroundPosition: "-200% 0" },
        },
        "pulse-ring": {
          "0%": { boxShadow: "0 0 0 0 rgba(255,255,255,.18)" },
          "70%": { boxShadow: "0 0 0 18px rgba(255,255,255,0)" },
          "100%": { boxShadow: "0 0 0 0 rgba(255,255,255,0)" },
        },
      },
      animation: {
        "fade-up": "fade-up .8s cubic-bezier(.16,1,.3,1) both",
        "fade-in": "fade-in 1s ease both",
        "scale-in": "scale-in .5s cubic-bezier(.16,1,.3,1) both",
        float: "float 16s ease-in-out infinite",
        "float-slow": "float 22s ease-in-out infinite reverse",
        shake: "shake .4s ease both",
        shimmer: "shimmer 6s linear infinite",
        "pulse-ring": "pulse-ring 2.4s cubic-bezier(.4,0,.6,1) infinite",
      },
    },
  },
  plugins: [],
};

export default config;
