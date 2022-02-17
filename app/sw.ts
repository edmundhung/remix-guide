import { useEffect, useRef } from 'react';
import { useLocation, useMatches } from 'remix';

export function useServiceWorker(serviceWorker?: ServiceWorkerContainer) {
	let ref = useRef(true);
	let location = useLocation();
	let matches = useMatches();

	useEffect(() => {
		let isMount = ref.current;

		ref.current = false;

		if (!serviceWorker) {
			return;
		}

		let handleNavigate = () =>
			serviceWorker.controller?.postMessage({
				type: 'REMIX_NAVIGATION',
				isMount,
				location,
				matches,
				manifest: window.__remixManifest,
			});

		if (serviceWorker.controller) {
			handleNavigate();
			return;
		}

		let listener = () => serviceWorker.ready.then(() => handleNavigate());

		serviceWorker.addEventListener('controllerchange', listener);

		return () => {
			serviceWorker.removeEventListener('controllerchange', listener);
		};
	}, [location, serviceWorker, matches]);
}
