import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';

import { Avatar, Button, Input, Screen, StateCard, Surface, Text, theme } from '@/components/ui';
import { uploadAvatar } from '@/lib/avatars';
import {
  buildProfileFormSchema,
  getProfileFormDefaults,
  mapProfileFormValuesToUpdate,
  type ProfileFormValues,
} from '@/lib/profile-form';
import { queryClient } from '@/lib/query';
import { useAuthStore } from '@/store/auth';

export default function EditProfileScreen() {
  const router = useRouter();
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const profile = useAuthStore((s) => s.profile);
  const currentUserId = useAuthStore((s) => s.session?.user?.id);
  const loading = useAuthStore((s) => s.loading);
  const [error, setError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const role = profile?.role;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(buildProfileFormSchema(role)),
    defaultValues: getProfileFormDefaults(profile),
  });

  const onUploadAvatar = async () => {
    try {
      setUploadingAvatar(true);
      const uploadedUrl = await uploadAvatar();
      if (uploadedUrl) {
        await fetchProfile();
        if (currentUserId) {
          await queryClient.invalidateQueries({
            queryKey: ['profile', currentUserId],
            refetchType: 'all',
          });
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      Alert.alert('Upload failed', msg);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onSubmit = async (data: ProfileFormValues) => {
    setError(null);
    try {
      await updateProfile(mapProfileFormValuesToUpdate(data));
      router.back();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  return (
    <Screen style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboard}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Surface elevated style={styles.card}>
            <Text variant="overline" style={styles.kicker}>
              EDIT PROFILE
            </Text>
            <Text variant="heading">Update your profile</Text>
            <Text variant="body" style={styles.subtitle}>
              Update your details anytime.
            </Text>

            <View style={styles.avatarSection}>
              <Avatar
                uri={profile?.avatar_url}
                cacheKey={profile?.updated_at}
                name={profile?.display_name || profile?.full_name || 'Profile'}
                size={104}
                style={[styles.avatar, !profile?.avatar_url && styles.avatarPlaceholder]}
              />
              <Button
                title={uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                variant="outline"
                onPress={onUploadAvatar}
                disabled={uploadingAvatar}
              />
            </View>

            {error ? <StateCard title={error} tone="danger" /> : null}

            <View style={styles.form}>
              <View>
                <Controller
                  control={control}
                  name="display_name"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="Display Name"
                      autoCapitalize="words"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                {errors.display_name ? (
                  <Text variant="caption" style={styles.fieldError}>
                    {errors.display_name.message}
                  </Text>
                ) : null}
              </View>

              {role === 'player' ? (
                <>
                  <View>
                    <Controller
                      control={control}
                      name="position"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                          placeholder="Playing Position"
                          autoCapitalize="words"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value ?? ''}
                        />
                      )}
                    />
                    {errors.position ? (
                      <Text variant="caption" style={styles.fieldError}>
                        {errors.position.message}
                      </Text>
                    ) : null}
                  </View>

                  <View>
                    <Controller
                      control={control}
                      name="birth_year"
                      render={({ field: { onChange, onBlur, value } }) => (
                        <Input
                          placeholder="Birth Year"
                          keyboardType="number-pad"
                          onBlur={onBlur}
                          onChangeText={onChange}
                          value={value ?? ''}
                        />
                      )}
                    />
                    {errors.birth_year ? (
                      <Text variant="caption" style={styles.fieldError}>
                        {errors.birth_year.message}
                      </Text>
                    ) : null}
                  </View>
                </>
              ) : null}

              <View>
                <Controller
                  control={control}
                  name="location"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="Location"
                      autoCapitalize="words"
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value}
                    />
                  )}
                />
                {errors.location ? (
                  <Text variant="caption" style={styles.fieldError}>
                    {errors.location.message}
                  </Text>
                ) : null}
              </View>

              <View>
                <Controller
                  control={control}
                  name="bio"
                  render={({ field: { onChange, onBlur, value } }) => (
                    <Input
                      placeholder="Bio (optional)"
                      multiline
                      numberOfLines={3}
                      onBlur={onBlur}
                      onChangeText={onChange}
                      value={value ?? ''}
                      style={styles.multiline}
                    />
                  )}
                />
              </View>

              <Button
                title={loading ? 'Saving...' : 'Save'}
                onPress={handleSubmit(onSubmit)}
                disabled={loading}
              />
            </View>
          </Surface>
        </ScrollView>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  keyboard: { flex: 1 },
  scroll: {
    flexGrow: 1,
    paddingHorizontal: theme.spacing.xxl,
    paddingVertical: theme.spacing.xxxl,
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
  avatarSection: {
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  avatar: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: theme.colors.surfaceTintStrong,
  },
  avatarPlaceholder: {
    backgroundColor: theme.colors.canvasMuted,
  },
  form: { gap: theme.spacing.md },
  fieldError: {
    color: theme.colors.danger,
    marginTop: 4,
    marginLeft: 4,
  },
  multiline: {
    minHeight: 110,
    textAlignVertical: 'top',
    paddingTop: theme.spacing.md,
  },
});
