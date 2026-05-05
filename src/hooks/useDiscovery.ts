import {
  getExploreSections,
  listDiscoverProfiles,
  type DiscoveryFilters,
} from '@/lib/discovery';
import { useQuery } from '@tanstack/react-query';

export function useDiscoverProfiles(filters: DiscoveryFilters) {
  return useQuery({
    queryKey: [
      'discover',
      filters.search ?? '',
      filters.position ?? '',
      filters.location ?? '',
      filters.role ?? 'player',
      filters.minAge ?? '',
      filters.maxAge ?? '',
      filters.sort ?? 'latest',
      filters.limit ?? 40,
    ],
    queryFn: () => listDiscoverProfiles(filters),
  });
}

export function useExploreSections() {
  return useQuery({
    queryKey: ['explore'],
    queryFn: getExploreSections,
  });
}
