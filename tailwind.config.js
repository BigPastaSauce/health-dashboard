/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        whoop: {
          bg: '#0d0d1a',
          card: '#1a1a2e',
          cardHover: '#222240',
          border: '#2a2a4a',
          green: '#00E676',
          greenDark: '#16DB65',
          yellow: '#FFD600',
          red: '#FF1744',
          blue: '#448AFF',
          purple: '#B388FF',
          cyan: '#18FFFF',
          text: '#E0E0E0',
          textDim: '#8888AA',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
}
