import fs from 'node:fs/promises';
import path from 'node:path';
import fetch from 'node-fetch';

async function listKeys(accountId, namespaceId, token) {
	const response = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/keys`,
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
		},
	);

	if (!response.ok) {
		throw new Error(
			`Fail retrieving all keys; Received response with status ${response.status} ${response.statusText}`,
		);
	}

	const { result } = await response.json();

	return result;
}

async function getKeyValue(accountId, namespaceId, key, token) {
	const response = await fetch(
		`https://api.cloudflare.com/client/v4/accounts/${accountId}/storage/kv/namespaces/${namespaceId}/values/${encodeURIComponent(
			key,
		)}`,
		{
			method: 'GET',
			headers: {
				'Content-Type': 'application/json',
				Authorization: `Bearer ${token}`,
			},
		},
	);

	if (!response.ok) {
		throw new Error(
			`Fail retrieving value for key=${key}; Received response with status ${response.status} ${response.statusText}`,
		);
	}

	return await response.json();
}

async function backup() {
	const accountId = process.env.CF_ACCOUNT_ID;
	const namespaceId = process.env.CF_NAMESPACE_ID;
	const token = process.env.CF_API_TOKEN;

	const list = await listKeys(accountId, namespaceId, token);
	const result = [];

	// We can't get all values in paralel due to rate-limiting from Cloudflare
	for (const key of list) {
		const value = await getKeyValue(accountId, namespaceId, key.name, token);

		result.push({
			key: key.name,
			value,
			metadata: key.metadata,
		});

		console.log(`(${result.length}/${list.length}) ${key.name} downloaded`);
	}

	console.log(`${result.length} keys loaded`);

	const cwd = process.cwd();
	const output = path.resolve(cwd, `./${namespaceId}.json`);

	await fs.writeFile(output, JSON.stringify(result, null, 2));
}

backup().then(
	() => {
		console.log('Backup complete');
	},
	(e) => {
		console.error('Unknown error caught during backup');
		console.log(e);
	},
);
