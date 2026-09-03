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
        // Material 3 / Google style palette
        primary: {
          DEFAULT: "#1a73e8", // Google Blue
          hover: "#174ea6",
          light: "#e8f0fe",
        },
        surface: {
          DEFAULT: "#ffffff",
          background: "#f8f9fa",
          hover: "#f1f3f4",
        },
        text: {
          primary: "#202124",
          secondary: "#5f6368",
          disabled: "#9aa0a6",
        },
        border: {
          DEFAULT: "#dadce0",
          focus: "#1a73e8",
        },
        status: {
          success: "#1e8e3e",
          successBg: "#e6f4ea",
          warning: "#f9ab00",
          warningBg: "#fef7e0",
          error: "#d93025",
          errorBg: "#fce8e6",
        }
      },
      fontFamily: {
        sans: ["Inter", "Roboto", "system-ui", "sans-serif"],
      },
      boxShadow: {
        // Material elevation shadows
        'elevation-1': '0 1px 2px 0 rgba(60,64,67,0.3), 0 1px 3px 1px rgba(60,64,67,0.15)',
        'elevation-2': '0 1px 2px 0 rgba(60,64,67,0.3), 0 2px 6px 2px rgba(60,64,67,0.15)',
        'elevation-3': '0 1px 3px 0 rgba(60,64,67,0.3), 0 4px 8px 3px rgba(60,64,67,0.15)',
      }
    },
  },
  plugins: [],
};
export default config;
