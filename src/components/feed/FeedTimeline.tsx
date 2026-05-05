import React from 'react';
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';

import { usePosts } from '@/hooks/usePosts';

import { PostCard } from './PostCard';
import { StateCard } from '../ui/StateCard';
import { theme } from '../ui/theme';

export interface FeedTimelineProps {
  emptyTitle: string;
  emptyDescription: string;
  emptyActionLabel?: string;
  onEmptyActionPress?: () => void;
  headerContent?: React.ReactNode;
}

export function FeedTimeline({
  emptyTitle,
  emptyDescription,
  emptyActionLabel,
  onEmptyActionPress,
  headerContent,
}: FeedTimelineProps) {
  const { data: posts, isLoading, refetch, isRefetching, error } = usePosts();

  return (
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
      {headerContent}

      {isLoading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.accent} />
        </View>
      ) : null}

      {error ? (
        <StateCard
          title="Unable to load the feed"
          description="Pull to refresh and try again."
          tone="danger"
          icon="alert-circle-outline"
        />
      ) : null}

      {!isLoading && !error && posts?.length === 0 ? (
        <StateCard
          title={emptyTitle}
          description={emptyDescription}
          tone="tint"
          icon="post-outline"
          actionLabel={emptyActionLabel}
          onActionPress={onEmptyActionPress}
        />
      ) : null}

      {!isLoading && !error
        ? posts?.map((post) => <PostCard key={post.id} post={post} />)
        : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: {
    paddingBottom: theme.spacing.jumbo,
    gap: theme.spacing.lg,
  },
  centered: {
    paddingVertical: theme.spacing.xxxl,
    alignItems: 'center',
  },
});
