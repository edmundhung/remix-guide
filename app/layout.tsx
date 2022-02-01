import type { ReactElement, ReactNode } from 'react';
import clsx from 'clsx';

type Padding = 'none' | 'minimum' | 'maximum';

interface PaneContainerProps {
	children: ReactNode;
}

export function PaneContainer({ children }: PaneContainerProps): ReactElement {
	return (
		<section className="flex flex-col w-full h-full lg:max-h-screen min-h-screen lg:overflow-y-auto">
			{children}
		</section>
	);
}

interface PaneHeaderProps {
	padding?: Padding;
	children: ReactNode;
}

export function PaneHeader({
	padding = 'maximum',
	children,
}: PaneHeaderProps): ReactElement {
	return (
		<header
			className={clsx('sticky top-0 bg-gray-900 border-b lg:border-none z-10', {
				'px-2.5 xl:px-5': padding !== 'none',
			})}
		>
			<div
				className={clsx('h-16 flex flex-row items-center gap-4', {
					'px-3': padding === 'maximum',
				})}
			>
				{children}
			</div>
		</header>
	);
}

interface PaneFooterProps {
	padding?: Padding;
	children: ReactNode;
}

export function PaneFooter({
	padding = 'none',
	children,
}: PaneFooterProps): ReactElement {
	return (
		<footer
			className={clsx('sticky bottom-0 z-10 bg-gray-900/75', {
				'px-2.5 xl:px-5': padding !== 'none',
			})}
		>
			<div className={clsx({ 'px-3': padding === 'maximum' })}>{children}</div>
		</footer>
	);
}

interface PaneContentProps {
	padding?: Padding;
	children: ReactNode;
}

export function PaneContent({
	padding = 'minimum',
	children,
}: PaneContentProps): ReactElement {
	return (
		<div
			className={clsx('flex flex-col flex-1', {
				'px-2.5 xl:px-5 lg:pb-16': padding !== 'none',
			})}
		>
			<div
				className={clsx('flex flex-col flex-1 py-2', {
					'px-3': padding === 'maximum',
				})}
			>
				{children}
			</div>
		</div>
	);
}

interface ListProps {
	title?: string;
	action?: ReactElement | null;
	children: ReactNode;
}

export function List({ title, action, children }: ListProps): ReactElement {
	return (
		<div className="text-sm">
			{title ? (
				<div className="sticky top-16 bg-gray-900 py-2 text-gray-400">
					<div className="flex flex-row items-center px-3 py-1.5 gap-4">
						<div className="flex-1 line-clamp-1">{title}</div>
						{action}
					</div>
				</div>
			) : null}
			<div className={title ? 'pb-4' : 'py-4'}>
				<ul className="space-y-1">
					{Array.isArray(children) ? (
						children.map((child, i) => <li key={i}>{child}</li>)
					) : (
						<li>{children}</li>
					)}
				</ul>
			</div>
		</div>
	);
}
