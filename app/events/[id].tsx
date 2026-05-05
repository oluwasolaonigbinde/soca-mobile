import {
  ActivityIndicator,
  Alert,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';

import { Button, Screen, SectionHeader, StateCard, Surface, Text, theme } from '@/components/ui';
import { useEventById, useEventInterest } from '@/hooks/useEvents';

function formatDate(iso: string | null) {
  if (!iso) return 'Date TBD';

  return new Date(iso).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export default function EventDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const {
    data: event,
    isLoading,
    error,
    refetch,
    isRefetching,
  } = useEventById(id);
  const { isInterested, isLoading: isInterestLoading, setInterested } = useEventInterest(id);

  const onToggleInterested = async () => {
    try {
      await setInterested(!isInterested);
    } catch (toggleError) {
      const message =
        toggleError instanceof Error ? toggleError.message : 'Unable to update interest right now.';

      if (Platform.OS === 'web') {
        window.alert(message);
      } else {
        Alert.alert('Unable to update interest', message);
      }
    }
  };

  if (!id || isLoading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </Screen>
    );
  }

  if (error || !event) {
    return (
      <Screen style={styles.centered}>
        <StateCard title="Event not found" tone="danger" />
      </Screen>
    );
  }

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefetching}
            tintColor={theme.colors.primary}
            onRefresh={() => refetch()}
          />
        }
      >
        <SectionHeader
          eyebrow="EVENT"
          title={event.title}
          subtitle={event.description || 'Event details.'}
        />

        <Text variant="caption" style={styles.accent}>
          {[formatDate(event.event_date), event.location].filter(Boolean).join(' | ')}
        </Text>

        <Surface elevated style={styles.metaCard}>
          <Text variant="title">Event details</Text>
          {event.organizer_name ? (
            <Text variant="body" style={styles.muted}>
              Organizer: {event.organizer_name}
            </Text>
          ) : null}
          <Text variant="body" style={styles.muted}>
            {event.interested_count} people marked Interested.
          </Text>
        </Surface>

        <View style={styles.actions}>
          <Button
            title="All Events"
            variant="outline"
            onPress={() => router.push('/events')}
            style={styles.actionButton}
          />
          <Button
            title={isInterested ? 'Interested' : 'Mark Interested'}
            onPress={onToggleInterested}
            variant={isInterested ? 'outline' : 'solid'}
            disabled={isInterestLoading}
            style={styles.actionButton}
          />
        </View>

        <StateCard
          title="Mark Interested"
          description="A lightweight discovery signal for events you care about."
          tone="tint"
        />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
  },
  scroll: {
    padding: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },
  accent: {
    color: theme.colors.primary,
  },
  muted: {
    color: theme.colors.textMuted,
  },
  metaCard: {
    gap: theme.spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: theme.spacing.sm,
  },
  actionButton: {
    flex: 1,
  },
});
