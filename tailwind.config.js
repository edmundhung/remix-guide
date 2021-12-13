const colors = require('tailwindcss/colors');

module.exports = {
  content: ['./app/**/*.tsx', './app/**/*.ts'],
  theme: {
    borderColor: (theme) => ({
      ...theme('colors'),
      DEFAULT: theme('colors.gray.800', 'currentColor'),
    }),
    extend: {
      colors: {
        gray: colors.neutral,
      },
    },
  },
  plugins: [
    require('@tailwindcss/line-clamp'),
    require('@tailwindcss/aspect-ratio'),
    require('@tailwindcss/typography'),
  ],
};
