export function createStoreFetch(
	namespace: DurableObjectNamespace,
	hostname: string,
) {
	async function fetchStore(
		name: string,
		pathname: string,
		method: string,
		data?: Record<string, any>,
	): Promise<any> {
		const id = namespace.idFromName(name);
		const store = namespace.get(id);
		const origin = `http://${
			name !== '' ? name : 'global'
		}.${hostname}${pathname}`;
		const searchParams =
			method === 'GET' && data
				? new URLSearchParams(
						Object.entries(data).filter(
							([_, value]) => value !== null && typeof value !== 'undefined',
						),
				  )
				: null;
		const body = method !== 'GET' && data ? JSON.stringify(data) : null;
		const response = await store.fetch(
			`${origin}?${searchParams?.toString() ?? ''}`,
			{
				method,
				body,
			},
		);

		if (response.status === 204) {
			return;
		} else if (response.status === 404) {
			return null;
		}

		if (!response.ok) {
			throw new Error(
				`Request ${method} ${origin} failed; Received response with status ${response.status}`,
			);
		}

		return await response.json<any>();
	}

	return fetchStore;
}

export async function restoreStoreData(
	storage: DurableObjectStorage,
	data: Record<string, any>,
): Promise<void> {
	const batches = [];
	const keys = Object.keys(data);

	for (let i = 0; i * 128 < keys.length; i++) {
		const entires = keys.slice(i * 128, (i + 1) * 128).reduce((result, key) => {
			result[key] = data[key];

			return result;
		}, {} as Record<string, any>);

		batches.push(entires);
	}

	await storage.deleteAll();
	await Promise.all(batches.map((entries) => storage.put(entries)));
}
