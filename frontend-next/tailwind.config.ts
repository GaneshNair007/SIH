import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        yellow: {
          golden: "#FFE17C",
          hover: "#F5D466",
        },
        teal: {
          deep: "#0B6558",
          hover: "#084C42",
          light: "#E7F3F1",
        },
        charcoal: {
          DEFAULT: "#171C1B",
          dark: "#0F1212",
          card: "#1E2423",
        },
        gray: {
          dark: "#272727",
          card: "#F8F9FA",
        },
        sage: {
          DEFAULT: "#B7C6C2",
          light: "#DCE5E2",
          muted: "#5E6964",
        },
        warm: {
          white: "#F7F8F5",
        }
      },
      fontFamily: {
        display: ["var(--font-anton)", "Impact", "sans-serif"],
        sans: ["var(--font-inter)", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"],
      },
      lineHeight: {
        tightest: "0.9",
      },
      transitionTimingFunction: {
        industrial: "cubic-bezier(0.4, 0, 0.2, 1)",
      },
      transitionDuration: {
        industrial: "300ms",
      },
    },
  },
  plugins: [],
};

export default config;
