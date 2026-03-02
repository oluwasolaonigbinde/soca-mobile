import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { uploadAvatar } from '@/lib/avatars';
import { useAuthStore } from '@/store/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { z } from 'zod';

const schema = z.object({
  display_name: z.string().min(1, 'Display name is required'),
  location: z.string().min(1, 'Location is required'),
  bio: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function EditProfileScreen() {
  const router = useRouter();
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);
  const [error, setError] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      display_name: profile?.full_name ?? profile?.display_name ?? '',
      location: profile?.location ?? '',
      bio: profile?.bio ?? '',
    },
  });

  const onUploadAvatar = async () => {
    try {
      setUploadingAvatar(true);
      const uploadedUrl = await uploadAvatar();
      if (uploadedUrl) {
        await fetchProfile();
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Upload failed';
      Alert.alert('Upload failed', msg);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await updateProfile({
        display_name: data.display_name,
        location: data.location,
        bio: data.bio,
      });
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
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.avatarSection}>
            {profile?.avatar_url ? (
              <Image source={{ uri: profile.avatar_url }} style={styles.avatar} />
            ) : (
              <View style={[styles.avatar, styles.avatarPlaceholder]} />
            )}
            <Button
              title={uploadingAvatar ? 'Uploading…' : 'Change Photo'}
              variant="outline"
              onPress={onUploadAvatar}
              disabled={uploadingAvatar}
              style={styles.avatarButton}
            />
          </View>

          {error && (
            <View style={styles.errorBox}>
              <Text variant="caption" style={styles.errorText}>
                {error}
              </Text>
            </View>
          )}

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
              {errors.display_name && (
                <Text variant="caption" style={styles.fieldError}>
                  {errors.display_name.message}
                </Text>
              )}
            </View>

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
              {errors.location && (
                <Text variant="caption" style={styles.fieldError}>
                  {errors.location.message}
                </Text>
              )}
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
                  />
                )}
              />
            </View>

            <Button
              title={loading ? 'Saving…' : 'Save'}
              onPress={handleSubmit(onSubmit)}
              disabled={loading}
            />
          </View>
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
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  avatarSection: {
    alignItems: 'center',
    marginBottom: 24,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#eee',
  },
  avatarPlaceholder: {
    backgroundColor: '#ddd',
  },
  avatarButton: {
    marginTop: 12,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: { color: '#DC2626' },
  form: { gap: 16 },
  fieldError: {
    color: '#DC2626',
    marginTop: 4,
    marginLeft: 4,
  },
});
