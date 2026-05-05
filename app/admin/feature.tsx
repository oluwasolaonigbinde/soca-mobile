import { useAdminFeaturedItems } from '@/hooks/useAdmin';
import {
  createFeaturedItem,
  deleteFeaturedItem,
  getFeaturedItemDescription,
  type AdminFeaturedItemRecord,
} from '@/lib/admin';
import { showMessage } from '@/lib/showMessage';
import type { FeaturedItemType } from '@/types/database';
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

const FEATURE_TYPES: FeaturedItemType[] = ['profile', 'video', 'challenge', 'event'];

function FeatureTypePicker({
  value,
  onChange,
}: {
  value: FeaturedItemType;
  onChange: (nextValue: FeaturedItemType) => void;
}) {
  return (
    <View style={styles.typeRow}>
      {FEATURE_TYPES.map((itemType) => (
        <Button
          key={itemType}
          title={itemType}
          variant={value === itemType ? 'solid' : 'outline'}
          onPress={() => onChange(itemType)}
          style={styles.typeButton}
        />
      ))}
    </View>
  );
}

function FeaturedItemCard({
  item,
  onRemove,
}: {
  item: AdminFeaturedItemRecord;
  onRemove: () => void;
}) {
  return (
    <View style={styles.card}>
      <Text variant="subheading">{getFeaturedItemDescription(item)}</Text>
      <Text variant="caption" style={styles.accent}>
        {[item.section || 'default', `sort ${item.sort_order}`, item.is_active ? 'active' : 'inactive'].join(' | ')}
      </Text>
      <Text variant="caption" style={styles.muted}>
        {[item.starts_at || 'now', item.ends_at || 'open-ended'].join(' to ')}
      </Text>
      <Button title="Remove Feature" variant="outline" onPress={onRemove} />
    </View>
  );
}

export default function AdminFeatureScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isRefetching, refetch, error } = useAdminFeaturedItems();
  const [form, setForm] = useState({
    item_type: 'profile' as FeaturedItemType,
    item_id: '',
    section: '',
    sort_order: '0',
    starts_at: '',
    ends_at: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const onSubmit = async () => {
    try {
      setSubmitting(true);
      await createFeaturedItem(form);
      setForm((current) => ({
        ...current,
        item_id: '',
        section: '',
        sort_order: '0',
        starts_at: '',
        ends_at: '',
      }));
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin'] }),
        queryClient.invalidateQueries({ queryKey: ['discover'] }),
        queryClient.invalidateQueries({ queryKey: ['explore'] }),
        queryClient.invalidateQueries({ queryKey: ['videos'] }),
      ]);
      showMessage('Item featured', 'Refresh Explore to confirm the curated slot.');
    } catch (submitError) {
      const message =
        submitError instanceof Error ? submitError.message : 'Unable to feature item.';
      showMessage('Feature failed', message);
    } finally {
      setSubmitting(false);
    }
  };

  const onRemove = async (featuredItemId: string) => {
    try {
      await deleteFeaturedItem(featuredItemId);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin'] }),
        queryClient.invalidateQueries({ queryKey: ['discover'] }),
        queryClient.invalidateQueries({ queryKey: ['explore'] }),
        queryClient.invalidateQueries({ queryKey: ['videos'] }),
      ]);
    } catch (removeError) {
      const message =
        removeError instanceof Error ? removeError.message : 'Unable to remove featured item.';
      showMessage('Remove failed', message);
    }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
      >
        <View style={styles.header}>
          <Text variant="heading">Feature Content</Text>
          <Text variant="body" style={styles.muted}>
            Curate profiles, videos, challenges, and events using the raw row id from Supabase.
          </Text>
        </View>

        <View style={styles.panel}>
          <Text variant="subheading">Create / Update Featured Item</Text>
          <FeatureTypePicker
            value={form.item_type}
            onChange={(item_type) => setForm((current) => ({ ...current, item_type }))}
          />
          <View style={styles.form}>
            <Input
              placeholder="Item id"
              value={form.item_id}
              onChangeText={(value) => setForm((current) => ({ ...current, item_id: value }))}
            />
            <Input
              placeholder="Section (optional)"
              value={form.section}
              onChangeText={(value) => setForm((current) => ({ ...current, section: value }))}
            />
            <Input
              placeholder="Sort order"
              keyboardType="number-pad"
              value={form.sort_order}
              onChangeText={(value) => setForm((current) => ({ ...current, sort_order: value }))}
            />
            <Input
              placeholder="Start date or ISO timestamp (optional)"
              value={form.starts_at}
              onChangeText={(value) => setForm((current) => ({ ...current, starts_at: value }))}
            />
            <Input
              placeholder="End date or ISO timestamp (optional)"
              value={form.ends_at}
              onChangeText={(value) => setForm((current) => ({ ...current, ends_at: value }))}
            />
            <Button
              title={submitting ? 'Saving...' : 'Save Feature'}
              onPress={onSubmit}
              disabled={submitting}
            />
          </View>
        </View>

        <Button title="Open Explore" variant="outline" onPress={() => router.push('/explore')} />

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" />
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text variant="subheading">Unable to load featured items</Text>
            <Text variant="caption" style={styles.errorText}>
              Apply the schema and admin policies, then refresh.
            </Text>
          </View>
        ) : null}

        {!isLoading && !error ? (
          data?.length ? (
            <View style={styles.list}>
              {data.map((item) => (
                <FeaturedItemCard key={item.id} item={item} onRemove={() => onRemove(item.id)} />
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text variant="subheading">No featured items yet</Text>
              <Text variant="caption" style={styles.muted}>
                Add a profile or video first, then confirm it appears on Explore.
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
  typeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  typeButton: {
    minWidth: 88,
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
  errorBox: {
    borderRadius: 18,
    backgroundColor: '#FEF2F2',
    padding: 18,
    gap: 6,
  },
  errorText: {
    color: '#B91C1C',
  },
});
