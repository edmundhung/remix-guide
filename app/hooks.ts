import { useMatches } from 'remix';
import { GuideMetadata, SessionData } from '~/types';

export function useSessionData(): SessionData {
	const [rootMatch] = useMatches();

	return (rootMatch?.data as SessionData) ?? null;
}

export function useLists(): Required<GuideMetadata>['lists'] {
	const [rootMatch] = useMatches();

	return rootMatch?.data.lists ?? [];
}
