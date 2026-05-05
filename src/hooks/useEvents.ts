import {
  getCurrentUserEventInterest,
  getEventById,
  listEvents,
  setEventInterested,
} from '@/lib/events';
import { useAuthStore } from '@/store/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

export function useEvents(limit = 12) {
  return useQuery({
    queryKey: ['events', 'list', limit],
    queryFn: () => listEvents(limit),
  });
}

export function useEventById(eventId: string | undefined) {
  return useQuery({
    queryKey: ['events', 'detail', eventId],
    queryFn: () => getEventById(eventId!),
    enabled: !!eventId,
  });
}

export function useEventInterest(eventId: string | undefined) {
  const currentUserId = useAuthStore((state) => state.session?.user?.id);
  const queryClient = useQueryClient();

  const statusQuery = useQuery({
    queryKey: ['events', 'interest', currentUserId, eventId],
    queryFn: () => getCurrentUserEventInterest(eventId!),
    enabled: !!currentUserId && !!eventId,
  });

  const mutation = useMutation({
    mutationFn: async (interested: boolean) => {
      if (!eventId) throw new Error('Event not found.');
      await setEventInterested(eventId, interested);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['explore'] });
    },
  });

  return {
    isInterested: statusQuery.data ?? false,
    isLoading: statusQuery.isLoading || mutation.isPending,
    setInterested: (interested: boolean) => mutation.mutateAsync(interested),
  };
}
