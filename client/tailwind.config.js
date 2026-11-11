/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        hayat: {
          50: "var(--color-primary-soft)",
          100: "var(--color-primary-tint)",
          600: "#087a52",
          700: "var(--color-primary)",
          800: "#066744",
          900: "var(--color-primary-text)"
        }
      }
    }
  },
  plugins: []
};
