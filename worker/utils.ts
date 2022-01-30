const ENCODING = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const ENCODING_LEN = ENCODING.length;

/**
 * Enocding UNIX Timestamp using Crockford's Base32
 * Inspired by ULID JS Implementation
 * @see https://github.com/ulid/javascript/blob/master/lib/index.ts#L66-L87
 */
export function generateId(now = Date.now()): string {
	let mod: number,
		str = '';

	for (let i = 10; i > 0; i--) {
		mod = now % ENCODING_LEN;
		str = ENCODING.charAt(mod) + str;
		now = (now - mod) / ENCODING_LEN;
	}

	return str;
}
