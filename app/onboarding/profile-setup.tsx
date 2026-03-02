import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAuthStore } from '@/store/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const schema = z.object({
  display_name: z.string().min(1, 'Display name is required'),
  location: z.string().min(1, 'Location is required'),
  bio: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function ProfileSetupScreen() {
  const router = useRouter();
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);
  const [error, setError] = useState<string | null>(null);

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

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await updateProfile({
        display_name: data.display_name,
        location: data.location,
        bio: data.bio,
      });
      router.replace('/');
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
          <Text variant="heading" style={styles.title}>
            Complete Your Profile
          </Text>
          <Text variant="body" style={styles.subtitle}>
            Add your display name and location to get started.
          </Text>

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
              title={loading ? 'Saving\u2026' : 'Continue'}
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
  container: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    marginBottom: 8,
  },
  subtitle: {
    color: '#666',
    marginBottom: 24,
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#DC2626',
  },
  form: {
    gap: 16,
  },
  fieldError: {
    color: '#DC2626',
    marginTop: 4,
    marginLeft: 4,
  },
});
