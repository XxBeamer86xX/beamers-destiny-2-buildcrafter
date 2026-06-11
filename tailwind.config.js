/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        'destiny-bg': '#0B0C10',
        'destiny-surface': '#13151A',
        'destiny-card': '#1A1D24',
        'destiny-border': '#2A2D35',
        'destiny-hover': '#22252D',
        'exotic': '#C4A55A',
        'legendary': '#7B5EA7',
        'rare': '#5E88C1',
        'uncommon': '#4B7A46',
        'common': '#8A8A8A',
        'solar': '#F0631E',
        'arc': '#79C8E2',
        'void': '#B185FF',
        'stasis': '#4D88FF',
        'strand': '#00C457',
        'prismatic': '#E2C97E',
        'kinetic': '#C0C0C0',
      },
      boxShadow: {
        'exotic': '0 0 24px rgba(196, 165, 90, 0.4)',
        'legendary': '0 0 16px rgba(123, 94, 167, 0.3)',
      },
    },
  },
  plugins: [],
}
