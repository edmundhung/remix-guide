module.exports = {
  mode: 'jit',
  purge: ['./app/**/*.tsx', './app/**/*.ts'],
  darkMode: false, // or 'media' or 'class'
  theme: {
    extend: {
      gridTemplateColumns: {
        masonry: 'repeat(auto-fill, minmax(250px, 1fr))',
      },
    },
  },
  variants: {
    extend: {},
  },
  plugins: [],
};
