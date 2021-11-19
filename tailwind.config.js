module.exports = {
  mode: 'jit',
  purge: ['./app/**/*.tsx', './app/**/*.ts'],
  darkMode: false, // or 'media' or 'class'
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
  ],
};
