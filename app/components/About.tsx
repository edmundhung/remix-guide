import type { ReactElement } from 'react';
import { useMatches } from 'remix';
import SvgIcon from '~/components/SvgIcon';
import logo from '~/icons/logo.svg';

function About(): ReactElement {
	const matches = useMatches();
	const { version } = matches[0]?.data ?? {};

	return (
		<div className="min-h-screen w-full flex flex-col">
			<div className="flex-1 flex flex-col items-center justify-center">
				<SvgIcon className="w-20 h-20" href={logo} />
				<h1 className="text-xl mt-6">Remix Guide</h1>
				<div className="pt-2 text-xs">Sharing everything about Remix</div>
			</div>
			{version ? (
				<div className="py-5 mb text-center text-sm text-gray-400">
					Version{' '}
					<a
						className="hover:underline"
						href="https://github.com/edmundhung/remix-guide"
						target="_blank"
						rel="noopener noreferrer"
					>
						{version}
					</a>
				</div>
			) : null}
		</div>
	);
}

export default About;
