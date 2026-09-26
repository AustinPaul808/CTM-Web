/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        chess: {
          dark: '#0f172a',
          board: '#2b3442',
          gold: '#eab308',
          silver: '#94a3b8',
          bronze: '#d97706',
          whiteSquare: '#f0d9b5',
          blackSquare: '#b58863'
        }
      }
    },
  },
  plugins: [],
}
