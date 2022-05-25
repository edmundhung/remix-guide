export function configureStore<Env, T extends Record<string, any>>(
	handlersCreator: (state: DurableObjectState, env: Env) => Promise<T>,
) {
	class Store {
		env: Env;
		state: DurableObjectState;
		handlers: T | null;

		constructor(state: DurableObjectState, env: Env) {
			this.state = state;
			this.env = env;
			this.handlers = null;

			state.blockConcurrencyWhile(async () => {
				this.handlers = await handlersCreator(state, env);
			});
		}

		async fetch(request: Request): Promise<Response> {
			const { method, args } = await request.json<{
				method: string;
				args: any[];
			}>();

			try {
				if (!this.handlers) {
					throw new Error(
						'The handlers are not initialised; Please check if the store is setup properly',
					);
				}

				const handler = this.handlers[method];

				if (typeof handler === 'function') {
					const result = JSON.stringify(await handler(...args)) ?? null;

					return new Response(result, {
						status: result !== null ? 200 : 204,
					});
				} else {
					return new Response('Not Found', { status: 404 });
				}
			} catch (e) {
				console.error(e);
				return new Response('Internal Server Error', { status: 500 });
			}
		}
	}

	function createClient(namespace: DurableObjectNamespace, name: string): T {
		const id = namespace.idFromName(name);
		const stub = namespace.get(id);
		const client = new Proxy(
			{},
			{
				get(_, method) {
					return async (...args: any[]) => {
						const response = await stub.fetch('http://store', {
							headers: {
								'content-type': 'application/json',
							},
							method: 'POST',
							body: JSON.stringify({ method, args }),
						});

						switch (response.status) {
							case 200:
								return await response.json();
							case 204:
								return;
							case 404:
								throw new Error(`Method ${method.toString()} is not available`);
							default:
								throw new Error(
									`Unknown error caught; Received a ${response.status} response`,
								);
						}
					};
				},
			},
		);

		return client as T;
	}

	return {
		Store,
		createClient,
	};
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
