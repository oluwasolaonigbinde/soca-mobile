import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAdminOverview } from '@/hooks/useAdmin';
import type { Href } from 'expo-router';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

function AdminCard({
  title,
  count,
  subtitle,
  onPress,
}: {
  title: string;
  count: number;
  subtitle: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <Text variant="caption" style={styles.cardLabel}>
        {title}
      </Text>
      <Text variant="heading">{count}</Text>
      <Text variant="body" style={styles.muted}>
        {subtitle}
      </Text>
    </Pressable>
  );
}

export default function AdminDashboardScreen() {
  const router = useRouter();
  const { data, isLoading, isRefetching, refetch, error } = useAdminOverview();

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
      >
        <View style={styles.header}>
          <Text variant="heading">Admin Console</Text>
          <Text variant="body" style={styles.muted}>
            Challenge setup, featured content, moderation, and verification tools for admin accounts.
          </Text>
        </View>

        <View style={styles.actions}>
          <Button title="Challenges" onPress={() => router.push('/admin/challenges')} style={styles.actionButton} />
          <Button
            title="Events"
            variant="outline"
            onPress={() => router.push('/admin/events' as Href)}
            style={styles.actionButton}
          />
        </View>
        <View style={styles.actions}>
          <Button title="Feature Content" onPress={() => router.push('/admin/feature')} style={styles.actionButton} />
          <Button
            title="Reports"
            onPress={() => router.push('/admin/reports')}
            style={styles.actionButton}
          />
          <Button
            title="Verification"
            variant="outline"
            onPress={() => router.push('/admin/verification')}
            style={styles.actionButton}
          />
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" />
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text variant="subheading">Unable to load admin metrics</Text>
            <Text variant="caption" style={styles.errorText}>
              Refresh after applying the admin schema in Supabase.
            </Text>
          </View>
        ) : null}

        {!isLoading && !error ? (
          <View style={styles.cardGrid}>
            <AdminCard
              title="Challenges"
              count={data?.challenge_count ?? 0}
              subtitle="Current rows available to manage."
              onPress={() => router.push('/admin/challenges')}
            />
            <AdminCard
              title="Events"
              count={data?.event_count ?? 0}
              subtitle="Public trial and showcase listings."
              onPress={() => router.push('/admin/events' as Href)}
            />
            <AdminCard
              title="Open Reports"
              count={data?.open_report_count ?? 0}
              subtitle="Items waiting for moderation."
              onPress={() => router.push('/admin/reports')}
            />
            <AdminCard
              title="Featured Items"
              count={data?.featured_item_count ?? 0}
              subtitle="Curated content currently stored."
              onPress={() => router.push('/admin/feature')}
            />
            <AdminCard
              title="Verified Profiles"
              count={data?.verified_profile_count ?? 0}
              subtitle="Profiles carrying the badge."
              onPress={() => router.push('/admin/verification')}
            />
            <AdminCard
              title="Results"
              count={data?.achievement_count ?? 0}
              subtitle="Winner achievements shown on profiles."
              onPress={() => router.push('/admin/challenges')}
            />
          </View>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: 24,
    gap: 16,
  },
  header: {
    gap: 8,
  },
  muted: {
    color: 'rgba(255, 255, 255, 0.62)',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  centered: {
    paddingVertical: 48,
    alignItems: 'center',
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
  cardGrid: {
    gap: 14,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#1F2A24',
    backgroundColor: '#111613',
    padding: 18,
    gap: 8,
  },
  cardLabel: {
    color: '#00FF88',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
});
