/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        waGreen: '#1fa855',
        waBgDark: '#111b21',
        waPanelDark: '#202c33',
        waIncomingDark: '#005c4b',
        waOutgoingDark: '#202c33',
      }
    },
  },
  plugins: [],
}