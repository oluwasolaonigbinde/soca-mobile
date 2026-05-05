import { getConversationThread, listConversations } from '@/lib/messages';
import { useQuery } from '@tanstack/react-query';

export function useConversations() {
  return useQuery({
    queryKey: ['messages', 'conversations'],
    queryFn: listConversations,
  });
}

export function useConversationThread(conversationId: string | undefined) {
  return useQuery({
    queryKey: ['messages', 'conversation', conversationId],
    queryFn: () => getConversationThread(conversationId!),
    enabled: !!conversationId,
  });
}
