import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#fff0f6",
          100: "#ffe0ec",
          200: "#ffc0d8",
          300: "#ff8fb5",
          400: "#ff5289",
          500: "#ff1a64",
          600: "#e0004a",
          700: "#b8003c",
          800: "#960034",
          900: "#7d0030",
        },
      },
    },
  },
  plugins: [],
};

export default config;
