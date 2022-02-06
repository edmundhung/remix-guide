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
			`${origin}?${searchParams?.toString()}`,
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
