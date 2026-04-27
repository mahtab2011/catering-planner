/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          blue: "#0F4C81",
          navy: "#0B1F33",
          green: "#16A34A",
          bg: "#F8FAFC",
          text: "#1F2937",
          muted: "#64748B",
          border: "#E5E7EB",
          amber: "#F59E0B",
          red: "#DC2626",
        },
      },
    },
  },
  plugins: [],
};