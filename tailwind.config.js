const colors = require('tailwindcss/colors');

module.exports = {
  mode: 'jit',
  purge: ['./app/**/*.tsx', './app/**/*.ts'],
  darkMode: false,
  theme: {
    borderColor: (theme) => ({
      ...theme('colors'),
      DEFAULT: theme('colors.gray.800', 'currentColor'),
    }),
    extend: {
      colors: {
        gray: colors.trueGray,
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
