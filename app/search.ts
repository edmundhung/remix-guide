import { useMemo } from 'react';
import { useLocation } from 'remix';

export function useResourcesSearch(): string {
  const location = useLocation();
  const search = useMemo(() => {
    const searchParams = new URLSearchParams(location.search);
    const supported = ['list', 'q', 'category', 'platform', 'integration'];

    for (const key of searchParams.keys()) {
      if (supported.includes(key)) {
        continue;
      }

      searchParams.delete(key);
    }

    return searchParams.toString();
  }, [location.search]);

  return search;
}
