import { RoleGate } from '@/components/auth/RoleGate';
import { Button, Input, Screen, SectionHeader, Surface, Text, theme } from '@/components/ui';
import { createOrganizerEvent } from '@/lib/events';
import { showMessage } from '@/lib/showMessage';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

function OrganizerEventForm() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    title: '',
    date: '',
    location: '',
    description: '',
  });

  const onCreate = async () => {
    try {
      setSubmitting(true);
      const event = await createOrganizerEvent(form);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['events'] }),
        queryClient.invalidateQueries({ queryKey: ['explore'] }),
        queryClient.invalidateQueries({ queryKey: ['admin'] }),
      ]);
      showMessage('Event created', 'Your event is now visible to the SOCA network.');
      router.replace(`/events/${event.id}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to create the event.';
      showMessage('Create failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <SectionHeader
          eyebrow="EVENTS"
          title="Create an event"
          subtitle="Publish a trial, showcase, or football opportunity for the SOCA community."
        />

        <Surface elevated style={styles.form}>
          <View style={styles.field}>
            <Text variant="caption">Event title</Text>
            <Input
              placeholder="e.g. Open academy trials"
              value={form.title}
              onChangeText={(title) => setForm((current) => ({ ...current, title }))}
            />
          </View>
          <View style={styles.field}>
            <Text variant="caption">Date and time</Text>
            <Input
              placeholder="e.g. 2026-08-15 10:00"
              value={form.date}
              onChangeText={(date) => setForm((current) => ({ ...current, date }))}
              autoCapitalize="none"
            />
          </View>
          <View style={styles.field}>
            <Text variant="caption">Location (optional)</Text>
            <Input
              placeholder="Venue or city"
              value={form.location}
              onChangeText={(location) => setForm((current) => ({ ...current, location }))}
            />
          </View>
          <View style={styles.field}>
            <Text variant="caption">Description (optional)</Text>
            <Input
              placeholder="What should players and scouts know?"
              value={form.description}
              onChangeText={(description) => setForm((current) => ({ ...current, description }))}
              multiline
              style={styles.description}
            />
          </View>
          <Button
            title={submitting ? 'Publishing...' : 'Publish event'}
            onPress={onCreate}
            disabled={submitting}
          />
          <Button title="Cancel" variant="outline" onPress={() => router.back()} disabled={submitting} />
        </Surface>
      </ScrollView>
    </Screen>
  );
}

export default function NewEventScreen() {
  return (
    <RoleGate allowedRoles={['club', 'org']}>
      <OrganizerEventForm />
    </RoleGate>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: theme.spacing.xxl,
    gap: theme.spacing.xl,
  },
  form: {
    gap: theme.spacing.lg,
  },
  field: {
    gap: theme.spacing.xs,
  },
  description: {
    minHeight: 112,
    paddingTop: theme.spacing.md,
    textAlignVertical: 'top',
  },
});
