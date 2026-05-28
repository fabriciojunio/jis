import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          dark:    "#1e1b4b",
          mid:     "#312e81",
          blue:    "#4f46e5",
          sky:     "#0ea5e9",
          accent:  "#8b5cf6",
          red:     "#e94560",
          success: "#10b981",
        },
      },
    },
  },
  plugins: [],
};

export default config;
