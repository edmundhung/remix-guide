import { useCallback, useRef } from 'react';

export function useScrollTop(): [React.RefObject<HTMLElement>, () => void] {
	const ref = useRef<HTMLElement>(null);
	const scrollFn = useCallback(() => {
		if (!ref.current) {
			return;
		}

		if (ref.current.clientHeight < ref.current.scrollHeight) {
			ref.current?.scrollTo({ top: 0 });
		} else {
			window.scrollTo({ top: 0 });
		}
	}, []);

	return [ref, scrollFn];
}
