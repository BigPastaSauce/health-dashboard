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
          bg: '#0a0a0f',
          card: '#12131a',
          cardHover: '#1a1b25',
          border: 'rgba(255,255,255,0.06)',
          green: '#00E676',
          greenDark: '#16DB65',
          yellow: '#FFD600',
          red: '#FF5252',
          blue: '#448AFF',
          purple: '#B388FF',
          cyan: '#18FFFF',
          text: '#E0E0E0',
          textDim: '#666',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      borderWidth: {
        '3': '3px',
      },
    },
  },
  plugins: [],
}
