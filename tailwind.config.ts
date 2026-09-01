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
        canvas: {
          DEFAULT: "#F7F8F5",
          white: "#FFFFFF",
          subtle: "#EFF1EC",
        },
        charcoal: {
          DEFAULT: "#171C1B",
          light: "#2D3330",
        },
        muted: {
          DEFAULT: "#5E6964",
          light: "#8A9490",
        },
        border: {
          DEFAULT: "#DCE3DE",
          strong: "#B8C2BC",
        },
        teal: {
          DEFAULT: "#0B6558",
          light: "#0E8A76",
          pale: "#E8F5F1",
        },
        hazard: {
          safe: "#10B981",
          safeBg: "rgba(16, 185, 129, 0.08)",
          elevated: "#F59E0B",
          elevatedBg: "rgba(245, 158, 11, 0.08)",
          high: "#EF4444",
          highBg: "rgba(239, 68, 68, 0.08)",
          critical: "#DC2626",
          criticalBg: "rgba(220, 38, 38, 0.12)",
        },
      },
      fontFamily: {
        sans: ["var(--font-inter)", "Inter", "system-ui", "sans-serif"],
        serif: ["var(--font-serif)", "Georgia", "serif"],
        mono: ["'Space Grotesk'", "'JetBrains Mono'", "monospace"],
      },
      fontSize: {
        "display-1": ["3.5rem", { lineHeight: "1.1", letterSpacing: "-0.02em", fontWeight: "700" }],
        "display-2": ["2.5rem", { lineHeight: "1.15", letterSpacing: "-0.015em", fontWeight: "600" }],
        "heading-1": ["1.875rem", { lineHeight: "1.2", letterSpacing: "-0.01em", fontWeight: "600" }],
        "heading-2": ["1.5rem", { lineHeight: "1.3", fontWeight: "600" }],
        "heading-3": ["1.25rem", { lineHeight: "1.4", fontWeight: "600" }],
        "body-lg": ["1.125rem", { lineHeight: "1.7" }],
        "body": ["1rem", { lineHeight: "1.7" }],
        "body-sm": ["0.875rem", { lineHeight: "1.6" }],
        "caption": ["0.75rem", { lineHeight: "1.5" }],
      },
      spacing: {
        "section": "5rem",
        "section-sm": "3rem",
      },
      borderRadius: {
        "card": "0.75rem",
      },
      boxShadow: {
        "card": "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)",
        "card-hover": "0 4px 12px rgba(0,0,0,0.08), 0 2px 4px rgba(0,0,0,0.04)",
        "elevated": "0 8px 24px rgba(0,0,0,0.08)",
      },
    },
  },
  plugins: [],
};

export default config;
