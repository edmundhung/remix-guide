const colors = require('tailwindcss/colors');

module.exports = {
	content: ['./app/**/*.tsx', './app/**/*.ts'],
	theme: {
		borderColor: (theme) => ({
			...theme('colors'),
			DEFAULT: theme('colors.gray.800', 'currentColor'),
		}),
		extend: {
			screens: {
				'3xl': '1700px',
				'4xl': '1921px',
			},
			colors: {
				gray: colors.neutral,
			},
		},
	},
	plugins: [
		require('@tailwindcss/line-clamp'),
		require('@tailwindcss/aspect-ratio'),
		require('@tailwindcss/typography'),
		require('@tailwindcss/forms'),
	],
};
