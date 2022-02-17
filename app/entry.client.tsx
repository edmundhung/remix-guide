import ReactDOM from 'react-dom';
import { RemixBrowser } from 'remix';

ReactDOM.hydrate(<RemixBrowser />, document);

if ('serviceWorker' in navigator) {
	// Use the window load event to keep the page load performant
	window.addEventListener('load', () => {
		navigator.serviceWorker
			.register('/sw.js', { type: 'module' })
			.then(() => navigator.serviceWorker.ready)
			.catch((error) => {
				console.error('Service worker registration failed', error);
			});
	});
}
