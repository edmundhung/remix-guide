import clsx from 'clsx';
import type { ComponentProps, ReactElement } from 'react';
import { Link } from '@remix-run/react';
import SvgIcon from '~/components/SvgIcon';

interface IconLinkProps {
	to: ComponentProps<typeof Link>['to'];
	icon: ComponentProps<typeof SvgIcon>['href'];
	prefetch?: ComponentProps<typeof Link>['prefetch'];
	mobileOnly?: boolean;
	rotateIcon?: boolean;
}

function IconLink({
	to,
	icon,
	prefetch,
	mobileOnly,
	rotateIcon,
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
			<SvgIcon
				className={clsx('w-4 h-4 lg:w-3 lg:h-3', { 'rotate-180': rotateIcon })}
				href={icon}
			/>
		</Link>
	);
}

export default IconLink;
