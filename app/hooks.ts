import { useMatches } from 'remix';
import { GuideMetadata } from '~/types';

export function useLists(): Required<GuideMetadata>['lists'] {
	const [rootMatch] = useMatches();

	return rootMatch?.data.lists ?? [];
}
