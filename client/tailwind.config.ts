import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        body:    ["var(--font-source-serif)", "Georgia", "serif"],
        sans:    ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      colors: {
        ink: {
          50:  "#faf8f5",
          100: "#f2ede4",
          200: "#e4d9c8",
          300: "#cebfa3",
          400: "#b59e7a",
          500: "#9c8057",
          600: "#7d6240",
          700: "#5f4930",
          800: "#3d2e1d",
          900: "#1e160c",
          950: "#0f0b06",
        },
        ember: {
          50:  "#fff4f0",
          100: "#ffe6de",
          200: "#ffcabc",
          300: "#ffa48e",
          400: "#ff7358",
          500: "#f04530",
          600: "#d42b17",
          700: "#b02111",
          800: "#8a1d12",
          900: "#6e1c13",
          950: "#3c0a05",
        },
      },
    },
  },
  plugins: [],
};

export default config;
