import type { ReactElement, RefObject } from 'react';
import { useEffect, useRef } from 'react';
import { useTransition } from '@remix-run/react';

export function useProgress(): RefObject<HTMLElement> {
	const el = useRef<HTMLElement>(null);
	const timeout = useRef<number>();
	const { location } = useTransition();

	useEffect(() => {
		if (!location || !el.current) {
			return;
		}

		if (timeout.current) {
			clearTimeout(timeout.current);
		}

		const target = el.current;

		target.style.width = `0%`;

		let updateWidth = (ms: number) => {
			timeout.current = setTimeout(() => {
				if (!target) {
					return;
				}

				let width = parseFloat(target.style.width);
				let percent = !isNaN(width) ? 15 + 0.85 * width : 0;

				target.style.width = `${percent}%`;

				updateWidth(100);
			}, ms);
		};

		updateWidth(300);

		return () => {
			if (timeout.current) {
				clearTimeout(timeout.current);
			}

			if (!target || target.style.width === `0%`) {
				return;
			}

			target.style.width = `100%`;

			timeout.current = setTimeout(() => {
				if (target.style.width !== '100%') {
					return;
				}

				target.style.width = ``;
			}, 200);
		};
	}, [location]);

	return el;
}

function Progress(): ReactElement {
	const progress = useProgress();

	return (
		<div className="fixed top-0 left-0 right-0 h-1 flex z-40">
			<div
				ref={progress}
				className="transition-all ease-in-out bg-gradient-to-r from-green-400 via-blue-500 to-pink-500"
			/>
		</div>
	);
}

export default Progress;
