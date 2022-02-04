import ReactDOM from 'react-dom';
import { RemixBrowser } from 'remix';
import { load } from 'fathom-client';

ReactDOM.hydrate(<RemixBrowser />, document);

if (process.env.NODE_ENV === 'production') {
	load('AVOQUSXG', {
		url: 'https://cdn.remix.guide/script.js',
		spa: 'history',
		excludedDomains: ['localhost'],
	});
}
