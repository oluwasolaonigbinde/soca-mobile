import { SectionHeader } from '@/components/ui/SectionHeader';
import { StateCard } from '@/components/ui/StateCard';
import { Surface } from '@/components/ui/Surface';
import { Text } from '@/components/ui/Text';
import { theme } from '@/components/ui/theme';
import { useEvents } from '@/hooks/useEvents';
import type { EventRecord } from '@/lib/events';
import { useRouter } from 'expo-router';
import { ActivityIndicator, Pressable, StyleSheet, View } from 'react-native';

function formatDate(iso: string | null) {
  if (!iso) return 'Date TBD';

  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}

function EventPreviewRow({ event }: { event: EventRecord }) {
  const router = useRouter();

  return (
    <Pressable style={styles.eventRow} onPress={() => router.push(`/events/${event.id}`)}>
      <View style={styles.dateBadge}>
        <Text variant="caption" style={styles.dateText}>
          {formatDate(event.event_date)}
        </Text>
      </View>
      <View style={styles.eventCopy}>
        <Text variant="label" numberOfLines={1}>{event.title}</Text>
        <Text variant="caption" style={styles.muted} numberOfLines={1}>
          {event.location || 'Location TBD'}
        </Text>
      </View>
    </Pressable>
  );
}

export function HomeEventsPreview() {
  const router = useRouter();
  const { data, isLoading, error } = useEvents(2);

  return (
    <Surface elevated style={styles.card}>
      <SectionHeader
        eyebrow="UP NEXT"
        title="Upcoming events"
        actionLabel="View all"
        onActionPress={() => router.push('/events')}
      />

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={theme.colors.accent} />
        </View>
      ) : null}

      {!isLoading && error ? (
        <StateCard title="Unable to load events" tone="danger" />
      ) : null}

      {!isLoading && !error && data?.length ? (
        <View style={styles.list}>
          {data.map((event) => (
            <EventPreviewRow key={event.id} event={event} />
          ))}
        </View>
      ) : null}

      {!isLoading && !error && !data?.length ? (
        <StateCard title="No upcoming events" tone="tint" />
      ) : null}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    gap: theme.spacing.md,
    padding: theme.spacing.lg,
  },
  list: {
    gap: theme.spacing.sm,
  },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
  },
  dateBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: theme.spacing.xs,
    borderRadius: theme.radius.xs,
    backgroundColor: theme.colors.surfaceTint,
  },
  dateText: {
    color: theme.colors.accent,
  },
  eventCopy: {
    flex: 1,
    gap: 2,
  },
  centered: {
    paddingVertical: theme.spacing.md,
    alignItems: 'center',
  },
  muted: {
    color: theme.colors.textMuted,
  },
});
