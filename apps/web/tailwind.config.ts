import type { Config } from 'tailwindcss'

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      fontFamily: {
        outfit:    ['var(--font-outfit)', 'sans-serif'],
        cormorant: ['var(--font-cormorant)', 'serif'],
      },
      colors: {
        navy: {
          DEFAULT: '#060d1a',
          mid:     '#0d1f35',
          light:   '#162840',
        },
        teal: {
          DEFAULT: '#00c8e0',
          dark:    '#0891b2',
        },
      },
    },
  },
  plugins: [],
}
export default config
