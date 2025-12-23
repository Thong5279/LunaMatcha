/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      screens: {
        'iphone': '430px',
      },
      colors: {
        primary: {
          DEFAULT: '#DEE9CB',
          light: '#F0F5E8',
          dark: '#C8D9B5',
        },
        secondary: {
          DEFAULT: '#A8C090',
          light: '#B8D0A0',
          dark: '#98B080',
        },
        accent: {
          DEFAULT: '#7A9A6E',
          light: '#8AAA7E',
          dark: '#6A8A5E',
        },
      },
    },
  },
  plugins: [],
}

