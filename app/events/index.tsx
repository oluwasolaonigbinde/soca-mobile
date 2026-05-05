import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';

import {
  AppHeader,
  AppShell,
  SectionHeader,
  StateCard,
  Surface,
  Text,
  theme,
} from '@/components/ui';
import { useEvents } from '@/hooks/useEvents';

function formatDate(iso: string | null) {
  if (!iso) return 'Date TBD';

  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function EventsScreen() {
  const router = useRouter();
  const { data, isLoading, isRefetching, refetch, error } = useEvents();

  return (
    <AppShell
      header={
        <AppHeader badge="EVENTS" title="Events" />
      }
    >
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            tintColor={theme.colors.accent}
            onRefresh={() => refetch()}
          />
        }
      >
        <SectionHeader
          eyebrow="EVENTS"
          title="Events"
          subtitle="Trials, showcases, and scouting opportunities."
        />

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" color={theme.colors.accent} />
          </View>
        ) : null}

        {error ? (
          <StateCard
            title="Unable to load events"
            description="Something went wrong. Pull to refresh."
            tone="danger"
            icon="alert-circle-outline"
          />
        ) : null}

        {!isLoading && !error ? (
          data?.length ? (
            <View style={styles.list}>
              {data.map((event) => (
                <Pressable
                  key={event.id}
                  onPress={() => router.push(`/events/${event.id}`)}
                >
                  <Surface elevated style={styles.card}>
                    <View style={styles.cardTop}>
                      <Text variant="title" style={styles.flex}>
                        {event.title}
                      </Text>
                      <Text variant="caption" style={styles.interestBadge}>
                        {event.interested_count} interested
                      </Text>
                    </View>
                    <Text variant="caption" style={styles.accent}>
                      {[formatDate(event.event_date), event.location].filter(Boolean).join(' | ')}
                    </Text>
                    <Text variant="body" style={styles.muted}>
                      {event.description || 'Open the event detail screen for the full listing.'}
                    </Text>
                    {event.organizer_name ? (
                      <Text variant="caption" style={styles.muted}>
                        Organizer: {event.organizer_name}
                      </Text>
                    ) : null}
                  </Surface>
                </Pressable>
              ))}
            </View>
          ) : (
            <StateCard
              title="No events yet"
              description="Upcoming trials, showcases, and scouting opportunities will appear here."
              tone="tint"
              icon="calendar-blank-outline"
            />
          )
        ) : null}
      </ScrollView>
    </AppShell>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: theme.spacing.xxxl,
    gap: theme.spacing.lg,
  },
  centered: {
    paddingVertical: theme.spacing.xxxl,
    alignItems: 'center',
  },
  list: {
    gap: theme.spacing.md,
  },
  card: {
    gap: theme.spacing.sm,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  flex: {
    flex: 1,
  },
  interestBadge: {
    color: theme.colors.primary,
  },
  accent: {
    color: theme.colors.primary,
  },
  muted: {
    color: theme.colors.textMuted,
  },
});
