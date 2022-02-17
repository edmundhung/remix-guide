import * as esbuild from 'esbuild';

async function buildServer(mode, version) {
	const startTime = Date.now();
	const result = await esbuild.build({
		entryPoints: ['./worker/index.ts'],
		bundle: true,
		minify: mode === 'production',
		sourcemap: mode !== 'production',
		format: 'esm',
		metafile: true,
		external: ['__STATIC_CONTENT_MANIFEST'],
		define: {
			'process.env.NODE_ENV': `"${mode}"`,
			'process.env.VERSION': `"${version}"`,
		},
		conditions: ['worker'], // Needed for diary to be built correctly
		outfile: './dist/worker.mjs',
	});
	const endTime = Date.now();

	console.log(`Server built in ${endTime - startTime}ms`);

	if (mode === 'production') {
		console.log(await esbuild.analyzeMetafile(result.metafile));
	}
}

async function buildWorker(mode, version) {
	const startTime = Date.now();
	await esbuild.build({
		entryPoints: ['./app/entry.worker.ts'],
		bundle: true,
		minify: mode === 'production',
		format: 'esm',
		define: {
			'process.env.NODE_ENV': `"${mode}"`,
			'process.env.VERSION': `"${version}"`,
		},
		outfile: './public/sw.js',
	});
	const endTime = Date.now();

	console.log(`Service worker built in ${endTime - startTime}ms`);
}

async function build() {
	const mode = process.env.NODE_ENV?.toLowerCase() ?? 'development';
	const version = process.env.VERSION ?? new Date().toISOString();

	console.log(`Build started in ${mode} mode for version ${version}`);

	await Promise.all([buildServer(mode, version), buildWorker(mode, version)]);
}

build().catch((e) => console.error('Unknown error caught during build:', e));
