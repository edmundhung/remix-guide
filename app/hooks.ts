import { useMatches } from '@remix-run/react';
import type { GuideMetadata, SessionData } from '~/types';

export function useSessionData(): SessionData {
	const [rootMatch] = useMatches();

	return (rootMatch?.data as SessionData) ?? null;
}

export function useLists(): Required<GuideMetadata>['lists'] {
	const [, layoutMatch] = useMatches();

	return layoutMatch?.data.lists ?? [];
}
