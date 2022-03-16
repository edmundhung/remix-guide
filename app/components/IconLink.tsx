import clsx from 'clsx';
import type { ComponentProps, ReactElement } from 'react';
import { Link } from 'remix';
import SvgIcon from '~/components/SvgIcon';

interface IconLinkProps {
	to: ComponentProps<typeof Link>['to'];
	icon: ComponentProps<typeof SvgIcon>['href'];
	prefetch?: ComponentProps<typeof Link>['prefetch'];
	mobileOnly?: boolean;
}

function IconLink({
	to,
	icon,
	prefetch,
	mobileOnly,
}: IconLinkProps): ReactElement {
	return (
		<Link
			className={clsx(
				'flex items-center justify-center w-8 h-8 lg:w-6 lg:h-6 hover:rounded-full hover:bg-gray-200 hover:text-black',
				{ 'xl:hidden': mobileOnly },
			)}
			to={to}
			state={{ skipRestore: true }}
			prefetch={prefetch}
		>
			<SvgIcon className="w-4 h-4 lg:w-3 lg:h-3" href={icon} />
		</Link>
	);
}

export default IconLink;
