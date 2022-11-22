import type { LoaderArgs } from '@remix-run/cloudflare';
import { redirect } from '@remix-run/cloudflare';
import { requireMaintainer } from '~/helpers';

export async function loader({ context }: LoaderArgs) {
	await requireMaintainer(context);

	return redirect('/admin/pages');
}
