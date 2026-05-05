import { useAdminReports } from '@/hooks/useAdmin';
import {
  getReportStatusLabel,
  getReportTargetDescription,
  updateReportStatus,
  type AdminReportRecord,
} from '@/lib/admin';
import { showMessage } from '@/lib/showMessage';
import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

function formatDate(value: string) {
  return new Date(value).toLocaleString();
}

function ReportActions({
  report,
  onStatusChange,
  onOpenTarget,
}: {
  report: AdminReportRecord;
  onStatusChange: (status: AdminReportRecord['status']) => void;
  onOpenTarget: () => void;
}) {
  return (
    <View style={styles.actionsBlock}>
      <Button title="Open Target" variant="outline" onPress={onOpenTarget} />
      <View style={styles.statusRow}>
        <Button title="Reviewing" variant="outline" onPress={() => onStatusChange('reviewing')} style={styles.statusButton} />
        <Button title="Resolve" onPress={() => onStatusChange('resolved')} style={styles.statusButton} />
        <Button title="Dismiss" variant="outline" onPress={() => onStatusChange('dismissed')} style={styles.statusButton} />
      </View>
    </View>
  );
}

export default function AdminReportsScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { data, isLoading, isRefetching, refetch, error } = useAdminReports();

  const onStatusChange = async (reportId: string, status: AdminReportRecord['status']) => {
    try {
      await updateReportStatus(reportId, status);
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin'] }),
        queryClient.invalidateQueries({ queryKey: ['profile'] }),
        queryClient.invalidateQueries({ queryKey: ['video'] }),
      ]);
      showMessage('Report updated', `Status changed to ${getReportStatusLabel(status)}.`);
    } catch (statusError) {
      const message =
        statusError instanceof Error ? statusError.message : 'Unable to update report.';
      showMessage('Update failed', message);
    }
  };

  return (
    <Screen>
      <ScrollView
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => refetch()} />}
      >
        <View style={styles.header}>
          <Text variant="heading">Reported Content</Text>
          <Text variant="body" style={styles.muted}>
            Review profile and video reports submitted from the app, then mark their moderation status.
          </Text>
        </View>

        {isLoading ? (
          <View style={styles.centered}>
            <ActivityIndicator size="large" />
          </View>
        ) : null}

        {error ? (
          <View style={styles.errorBox}>
            <Text variant="subheading">Unable to load reports</Text>
            <Text variant="caption" style={styles.errorText}>
              Apply the admin schema and ensure your admin account has access, then refresh.
            </Text>
          </View>
        ) : null}

        {!isLoading && !error ? (
          data?.length ? (
            <View style={styles.list}>
              {data.map((report) => (
                <View key={report.id} style={styles.card}>
                  <View style={styles.cardTop}>
                    <Text variant="subheading">{getReportTargetDescription(report)}</Text>
                    <Text variant="caption" style={styles.statusBadge}>
                      {getReportStatusLabel(report.status)}
                    </Text>
                  </View>
                  <Text variant="caption" style={styles.muted}>
                    Reporter: {report.reporter_name || report.reporter_id}
                  </Text>
                  <Text variant="caption" style={styles.muted}>
                    Submitted: {formatDate(report.created_at)}
                  </Text>
                  <Text variant="body">{report.reason}</Text>
                  {report.reviewed_at ? (
                    <Text variant="caption" style={styles.muted}>
                      Reviewed: {formatDate(report.reviewed_at)}
                    </Text>
                  ) : null}
                  <ReportActions
                    report={report}
                    onStatusChange={(status) => onStatusChange(report.id, status)}
                    onOpenTarget={() =>
                      router.push(report.content_type === 'profile' ? `/profile/${report.content_id}` : `/video/${report.content_id}`)
                    }
                  />
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Text variant="subheading">No reports yet</Text>
              <Text variant="caption" style={styles.muted}>
                Profile and video reports will appear here after users submit them.
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
  muted: {
    color: 'rgba(255, 255, 255, 0.62)',
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
    gap: 10,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
  },
  statusBadge: {
    color: '#00FF88',
  },
  actionsBlock: {
    gap: 10,
  },
  statusRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statusButton: {
    flex: 1,
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
