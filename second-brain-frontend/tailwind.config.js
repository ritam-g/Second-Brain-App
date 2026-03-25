/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['"Manrope"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
      },
      colors: {
        primary: "#4F46E5",
        "primary-dark": "#4338CA",
        background: "#F8FAFC",
        card: "#FFFFFF",
        obsidian: {
          950: "#0f0b08",
          900: "#14100d",
          850: "#181310",
          800: "#1d1714",
          700: "#261f1a",
          600: "#342920",
          500: "#6f5948",
          400: "#b89f84",
          300: "#f4dfbd",
        },
        accent: {
          DEFAULT: "#f8ae1d",
          soft: "#d69b4e",
        },
      },
      boxShadow: {
        panel: "0 24px 80px rgba(0, 0, 0, 0.34)",
        soft: "0 12px 30px rgba(0, 0, 0, 0.2)",
      },
      backgroundImage: {
        "obsidian-glow": "radial-gradient(circle at top, rgba(255, 184, 77, 0.12), transparent 32%), radial-gradient(circle at 20% 20%, rgba(255, 214, 122, 0.08), transparent 28%)",
      },
    },
  },
  plugins: [],
}
