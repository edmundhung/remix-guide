module.exports = {
  mode: 'jit',
  purge: ['./app/**/*.tsx', './app/**/*.ts'],
  darkMode: 'media',
  theme: {
    extend: {
      gridTemplateColumns: {
        masonry: 'repeat(auto-fill, minmax(260px, 1fr))',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/typography'),
  ],
};
