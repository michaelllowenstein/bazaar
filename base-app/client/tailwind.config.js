/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{svelte,js}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"Playfair Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"JetBrains Mono"', 'monospace'],
      },
      colors: {
        bazaar: {
          50:  '#fdf8f0',
          100: '#faefd9',
          200: '#f3d9a8',
          300: '#e9bc6c',
          400: '#de9c3d',
          500: '#d4821f',
          600: '#bb6717',
          700: '#9a4e16',
          800: '#7d3f19',
          900: '#673518',
          950: '#3b1a0a',
        },
        ink: {
          50:  '#f6f5f3',
          100: '#e8e6e1',
          200: '#d1cdc4',
          300: '#b3ae9f',
          400: '#958f7e',
          500: '#7a7465',
          600: '#625d51',
          700: '#504b42',
          800: '#443f38',
          900: '#3b3830',
          950: '#1e1c18',
        },
      },
    },
  },
  plugins: [],
};