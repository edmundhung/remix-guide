import { useCallback, useEffect, useLayoutEffect, useRef } from 'react';
import { useBeforeUnload, useLocation, useTransition } from '@remix-run/react';

let STORAGE_KEY = 'feed-positions';

let positions: { [key: string]: number } = {};

if (typeof document !== 'undefined') {
	let sessionPositions = sessionStorage.getItem(STORAGE_KEY);
	if (sessionPositions) {
		positions = JSON.parse(sessionPositions);
	}
}

let hydrated = false;

function getScrollTop(el: HTMLElement | null) {
	if (el && el.clientHeight < el.scrollHeight) {
		return el.scrollTop;
	} else {
		return window.scrollY;
	}
}

export function scrollOnElemenIfScrollable(
	el: HTMLElement | null,
	x: number,
	y: number,
) {
	if (el && el.clientHeight < el.scrollHeight) {
		el.scrollTo(x, y);
	} else {
		window.scrollTo(x, y);
	}
}

export function useElementScrollRestoration(prefix: string) {
	let ref = useRef<HTMLElement | null>(null);
	let transition = useTransition();
	let location = useLocation();
	let wasSubmissionRef = useRef(false);

	// wait for the browser to restore it on its own
	useEffect(() => {
		window.history.scrollRestoration = 'manual';
	}, []);

	// let the browser restore on it's own for refresh
	useBeforeUnload(
		useCallback(() => {
			window.history.scrollRestoration = 'auto';
		}, []),
	);

	useEffect(() => {
		if (transition.submission) {
			wasSubmissionRef.current = true;
		}
	}, [transition]);

	useEffect(() => {
		if (transition.location) {
			positions[prefix + location.key] = getScrollTop(ref.current);
		}
	}, [transition, location, prefix]);

	useBeforeUnload(
		useCallback(() => {
			sessionStorage.setItem(STORAGE_KEY, JSON.stringify(positions));
		}, []),
	);

	if (typeof document !== 'undefined') {
		// eslint-disable-next-line
		useLayoutEffect(() => {
			// don't do anything on hydration, the component already did this with an
			// inline script.
			if (!hydrated) {
				hydrated = true;
				return;
			}

			let state = location.state as { skipRestore?: boolean } | null;

			if (state?.skipRestore) {
				return;
			}

			let y = positions[prefix + location.key];

			// been here before, scroll to it
			if (y != undefined) {
				scrollOnElemenIfScrollable(ref.current, 0, y);
				return;
			}

			// don't do anything on submissions
			if (wasSubmissionRef.current === true) {
				wasSubmissionRef.current = false;
				return;
			}

			// otherwise go to the top on new locations
			scrollOnElemenIfScrollable(ref.current, 0, 0);
		}, [prefix, location]);
	}

	useEffect(() => {
		if (transition.submission) {
			wasSubmissionRef.current = true;
		}
	}, [transition]);

	return ref;
}
