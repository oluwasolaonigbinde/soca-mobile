import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { zodResolver } from '@hookform/resolvers/zod';

import { Button, Input, Screen, StateCard, Surface, Text, theme } from '@/components/ui';
import {
  buildProfileFormSchema,
  getProfileFormDefaults,
  mapProfileFormValuesToUpdate,
  type ProfileFormValues,
} from '@/lib/profile-form';
import { useAuthStore } from '@/store/auth';

export default function ProfileSetupScreen() {
  const router = useRouter();
  const updateProfile = useAuthStore((s) => s.updateProfile);
  const profile = useAuthStore((s) => s.profile);
  const loading = useAuthStore((s) => s.loading);
  const [error, setError] = useState<string | null>(null);
  const role = profile?.role;

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(buildProfileFormSchema(role)),
    defaultValues: getProfileFormDefaults(profile),
  });

  const onSubmit = async (data: ProfileFormValues) => {
    setError(null);
    try {
      await updateProfile(mapProfileFormValuesToUpdate(data));
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
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <Surface elevated style={styles.card}>
            <Text variant="overline" style={styles.kicker}>
              PROFILE SETUP
            </Text>
            <Text variant="heading">Complete your profile</Text>
            <Text variant="body" style={styles.subtitle}>
              {role === 'player'
                ? 'Add your details to unlock discovery.'
                : 'Add your profile details to get started.'}
            </Text>

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
                title={loading ? 'Saving...' : 'Continue'}
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
  container: {
    flex: 1,
  },
  keyboard: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
    justifyContent: 'center',
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
  form: {
    gap: theme.spacing.md,
  },
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
