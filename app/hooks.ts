import { useMatches } from 'remix';
import { GuideMetadata } from '~/types';

export function useFlashMessage(): string | null {
	const [rootMatch] = useMatches();

	return rootMatch?.data.message ?? null;
}

export function useLists(): Required<GuideMetadata>['lists'] {
	const [rootMatch] = useMatches();

	return rootMatch?.data.lists ?? [];
}
