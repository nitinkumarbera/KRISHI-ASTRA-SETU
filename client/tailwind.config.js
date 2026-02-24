/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // ── Typography ──────────────────────────────────────────────
      fontFamily: {
        sans: ["Inter", "Poppins", "ui-sans-serif", "system-ui", "sans-serif"],
      },

      // ── Color Palette ────────────────────────────────────────────
      colors: {
        primary: {
          dark:   "#2E7D32", // Primary Dark Green
          medium: "#388E3C", // Primary Medium Green
        },
        accent: {
          lime: "#8BC34A",   // Accent Lime Green
        },
        background: {
          soft: "#F5F5F5",   // Background Soft Grey
        },
        // Semantic aliases for convenience
        brand: {
          50:  "#F1F8E9",
          100: "#DCEDC8",
          200: "#C5E1A5",
          300: "#AED581",
          400: "#8BC34A", // accent-lime
          500: "#7CB342",
          600: "#558B2F",
          700: "#388E3C", // primary-medium
          800: "#2E7D32", // primary-dark
          900: "#1B5E20",
        },
      },

      // ── Spacing / Sizing extras ──────────────────────────────────
      borderRadius: {
        xl:  "0.75rem",
        "2xl": "1rem",
      },

      // ── Box Shadows ──────────────────────────────────────────────
      boxShadow: {
        card: "0 2px 8px rgba(0, 0, 0, 0.08)",
        "card-hover": "0 6px 20px rgba(46, 125, 50, 0.18)",
      },
    },
  },
  plugins: [],
};
