import { useState } from 'react';
import { Platform, ScrollView, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button, Input, Screen, StateCard, Surface, TabSwitch, Text, theme } from '@/components/ui';
import { createImagePost, createTextPost, createVideoAttachmentPost } from '@/lib/posts';
import { queryClient } from '@/lib/query';
import { uploadVideo } from '@/lib/videos';

export default function UploadVideoScreen() {
  const router = useRouter();
  const [postMode, setPostMode] = useState<'text' | 'image' | 'video'>('text');
  const [body, setBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const invalidateContent = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['posts'] }),
      queryClient.invalidateQueries({ queryKey: ['videos'] }),
      queryClient.invalidateQueries({ queryKey: ['profile'] }),
    ]);

  const onCreateTextPost = async () => {
    setError(null);
    try {
      setSubmitting(true);
      await createTextPost(body);
      await invalidateContent();
      router.replace('/feed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create post.');
    } finally {
      setSubmitting(false);
    }
  };

  const onCreateVideoPost = async () => {
    setError(null);
    try {
      setSubmitting(true);
      const video = await uploadVideo(body);
      if (!video) return;
      await createVideoAttachmentPost(video.id, body);

      await invalidateContent();

      router.replace(`/video/${video.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create video post.');
    } finally {
      setSubmitting(false);
    }
  };

  const onCreateImagePost = async () => {
    setError(null);
    try {
      setSubmitting(true);
      const post = await createImagePost(body);
      if (!post) return;
      await invalidateContent();
      router.replace('/feed');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create image post.');
    } finally {
      setSubmitting(false);
    }
  };

  const onSubmit = () => {
    if (postMode === 'text') return onCreateTextPost();
    if (postMode === 'image') return onCreateImagePost();
    return onCreateVideoPost();
  };

  const getButtonTitle = () => {
    if (submitting) {
      if (postMode === 'video') return 'Uploading...';
      return 'Posting...';
    }

    if (postMode === 'text') return 'Post';
    if (postMode === 'image') return 'Choose Image and Post';
    return 'Choose Video and Post';
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Surface elevated style={styles.card}>
          <Text variant="overline" style={styles.kicker}>
            NEW POST
          </Text>
          <Text variant="heading">Create post</Text>
          <Text variant="body" style={styles.subtitle}>
            Share a text update, upload a video, or add a caption to a highlight.
          </Text>

          <TabSwitch
            options={[
              { value: 'text', label: 'Text' },
              { value: 'image', label: 'Image' },
              { value: 'video', label: 'Video' },
            ]}
            value={postMode}
            onChange={(value) => setPostMode(value)}
          />

          <View style={styles.form}>
            <Input
              placeholder={postMode === 'text' ? 'What do you want to share?' : 'Caption (optional)'}
              value={body}
              onChangeText={setBody}
              autoCapitalize="sentences"
              multiline
              numberOfLines={4}
              style={Platform.OS === 'web' ? styles.multilineWeb : styles.multilineMobile}
            />

            {postMode === 'video' ? (
              <StateCard
                title="Video posts keep highlight upload and playback"
                description="Choose a video from your library. Player-only video upload permissions still apply."
                tone="tint"
                icon="video-plus-outline"
              />
            ) : null}

            {postMode === 'image' ? (
              <StateCard
                title="Image posts appear in the main feed"
                description="Choose a photo from your library and add an optional caption."
                tone="tint"
                icon="image-plus"
              />
            ) : null}

            {error ? <StateCard title={error} tone="danger" /> : null}

            <Button
              title={getButtonTitle()}
              onPress={onSubmit}
              disabled={submitting}
            />
          </View>
        </Surface>
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  scroll: {
    padding: theme.spacing.xxl,
  },
  card: {
    gap: theme.spacing.md,
  },
  kicker: {
    color: theme.colors.primary,
  },
  subtitle: {
    color: theme.colors.textMuted,
  },
  form: {
    gap: theme.spacing.md,
  },
  multilineWeb: {
    minHeight: 110,
    textAlignVertical: 'top',
    paddingTop: theme.spacing.md,
  },
  multilineMobile: {
    minHeight: 110,
    textAlignVertical: 'top',
  },
});
