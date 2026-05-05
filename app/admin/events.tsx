import { useAdminEvents } from '@/hooks/useAdmin';
import { createEvent } from '@/lib/admin';
import { showMessage } from '@/lib/showMessage';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

function formatEventDate(value: string | null) {
  if (!value) return 'Date TBD';
  return new Date(value).toLocaleString();
}

export default function AdminEventsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isRefetching, refetch, error } = useAdminEvents();
  const [form, setForm] = useState({
    title: '',
    date: '',
    location: '',
    organizer_id: '',
    description: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const onCreate = async () => {
    try {
      setSubmitting(true);
      await createEvent(form);
      setForm({
        title: '',
        date: '',
        location: '',
        organizer_id: '',
        description: '',
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events'] }),
        queryClient.invalidateQueries({ queryKey: ['admin'] }),
        queryClient.invalidateQueries({ queryKey: ['explore'] }),
      ]);
      showMessage('Event created', 'The event is now available in public Events and Explore surfaces.');
    } catch (createError) {
      const message = createError instanceof Error ? createError.message : 'Unable to create event.';
      showMessage('Create failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
      >
        <View style={styles.header}>
          <Text variant="heading">Manage Events</Text>
          <Text variant="body" style={styles.muted}>
            Create trial, showcase, and scouting listings for the public Events screen.
          </Text>
        </View>

        <View style={styles.panel}>
          <Text variant="subheading">Create Event</Text>
          <View style={styles.form}>
            <Input
              placeholder="Title"
              value={form.title}
              onChangeText={(value) => setForm((current) => ({ ...current, title: value }))}
            />
            <Input
              placeholder="Event date or ISO timestamp"
              value={form.date}
              onChangeText={(value) => setForm((current) => ({ ...current, date: value }))}
            />
            <Input
              placeholder="Location (optional)"
              value={form.location}
              onChangeText={(value) => setForm((current) => ({ ...current, location: value }))}
            />
            <Input
              placeholder="Organizer profile id (optional)"
              value={form.organizer_id}
              onChangeText={(value) => setForm((current) => ({ ...current, organizer_id: value }))}
            />
            <Input
              placeholder="Description (optional)"
              multiline
              value={form.description}
              onChangeText={(value) => setForm((current) => ({ ...current, description: value }))}
              style={styles.multilineInput}
            />
            <Button
              title={submitting ? 'Creating...' : 'Create Event'}
              onPress={onCreate}
              disabled={submitting}
            />
          </View>
        </View>

        <Button title="Open Public Events" variant="outline" onPress={() => router.push('/events')} />

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" />
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text variant="subheading">Unable to load events</Text>
            <Text variant="caption" style={styles.errorText}>
              Confirm the events table and admin policies exist, then refresh.
            </Text>
          </View>
        ) : null}

        {!isLoading && !error ? (
          data?.length ? (
            <View style={styles.list}>
              {data.map((event) => (
                <View key={event.id} style={styles.card}>
                  <Text variant="subheading">{event.title}</Text>
                  <Text variant="caption" style={styles.accent}>
                    {[formatEventDate(event.event_date), event.location].filter(Boolean).join(' | ')}
                  </Text>
                  <Text variant="body" style={styles.muted}>
                    {event.description || 'No description added yet.'}
                  </Text>
                  <Text variant="caption" style={styles.muted}>
                    Interested: {event.interested_count}
                  </Text>
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text variant="subheading">No events yet</Text>
              <Text variant="caption" style={styles.muted}>
                Use the form above to create the first public event listing.
              </Text>
            </View>
          )
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 24,
    gap: 18,
  },
  header: {
    gap: 8,
  },
  panel: {
    borderWidth: 1,
    borderColor: '#1F2A24',
    borderRadius: 18,
    padding: 18,
    gap: 14,
    backgroundColor: '#111613',
  },
  form: {
    gap: 12,
  },
  multilineInput: {
    height: 112,
    textAlignVertical: 'top',
    paddingTop: 14,
  },
  muted: {
    color: 'rgba(255, 255, 255, 0.62)',
  },
  accent: {
    color: '#00FF88',
  },
  centered: {
    paddingVertical: 48,
    alignItems: 'center',
  },
  errorBox: {
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
    padding: 18,
    gap: 6,
  },
  errorText: {
    color: '#EF4444',
  },
  list: {
    gap: 14,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1F2A24',
    backgroundColor: '#111613',
    padding: 16,
    gap: 8,
  },
  emptyState: {
    borderRadius: 18,
    backgroundColor: '#111613',
    padding: 18,
    gap: 8,
  },
});
