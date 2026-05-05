import { ResizeMode, Video } from 'expo-av';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, useWindowDimensions, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { Screen, StateCard, Text, theme } from '@/components/ui';
import { useVideoById } from '@/hooks/useVideoById';
import { recordVideoView } from '@/lib/videos';
import { alpha } from '@/components/ui/theme';

export default function VideoDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const videoRef = useRef<Video>(null);
  const viewedRef = useRef<Set<string>>(new Set());
  const { data: video, isLoading, error, refetch } = useVideoById(id);

  useEffect(() => {
    if (!id || viewedRef.current.has(id)) return;
    viewedRef.current.add(id);
    recordVideoView(id)
      .then(() => refetch())
      .catch(() => {});
  }, [id, refetch]);

  if (!id || isLoading) {
    return (
      <Screen style={styles.centered}>
        <ActivityIndicator size="large" color={theme.colors.accent} />
      </Screen>
    );
  }

  if (error || !video) {
    return (
      <Screen style={styles.centered}>
        <StateCard title="Video not found" tone="danger" />
      </Screen>
    );
  }

  const ownerName =
    video.owner_profile?.display_name || video.owner_profile?.full_name || 'Unknown';

  const videoHeight = Math.round((width * 9) / 16);

  return (
    <View style={styles.screen}>
      <Video
        ref={videoRef}
        source={{ uri: video.playback_url }}
        style={[styles.player, { width, height: videoHeight }]}
        resizeMode={ResizeMode.CONTAIN}
        useNativeControls
        shouldPlay
      />

      <SafeAreaView edges={['top']} style={styles.overlay}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
          hitSlop={12}
        >
          <MaterialCommunityIcons name="arrow-left" size={22} color="#FFFFFF" />
        </Pressable>
      </SafeAreaView>

      <View style={styles.meta}>
        <Text variant="subheading" numberOfLines={2}>
          {video.caption || 'Highlight'}
        </Text>
        <Text variant="caption" style={styles.ownerText}>
          {ownerName}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#000000',
  },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  player: {
    backgroundColor: '#000000',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  backButton: {
    margin: theme.spacing.md,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: alpha('#000000', 0.5),
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  meta: {
    padding: theme.spacing.lg,
    gap: theme.spacing.xs,
  },
  ownerText: {
    color: theme.colors.textMuted,
  },
});
