const colors = require('tailwindcss/colors');

module.exports = {
  mode: 'jit',
  purge: ['./app/**/*.tsx', './app/**/*.ts'],
  darkMode: 'media',
  theme: {
    borderColor: (theme) => ({
      ...theme('colors'),
      DEFAULT: theme('colors.gray.800', 'currentColor'),
    }),
    extend: {
      colors: {
        gray: colors.trueGray,
      },
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
