import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { AuthCard, Button, Input, Screen, StateCard, Text, theme } from '@/components/ui';
import { useAuthStore } from '@/store/auth';

const schema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export default function SignupScreen() {
  const router = useRouter();
  const signUp = useAuthStore((s) => s.signUp);
  const loading = useAuthStore((s) => s.loading);
  const pendingEmailVerification = useAuthStore((s) => s.pendingEmailVerification);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { fullName: '', email: '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await signUp(data.email, data.password, data.fullName);
      const pending = useAuthStore.getState().pendingEmailVerification;
      if (!pending) {
        router.replace('/');
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  return (
    <Screen style={styles.screen}>
      <AuthCard style={styles.card}>
        <Text variant="overline" style={styles.kicker}>
          CREATE ACCOUNT
        </Text>
        <Text variant="heading" style={styles.headline}>
          SIGN UP
        </Text>
        <Text variant="body" style={styles.subtitle}>
          Create your account to get started.
        </Text>

        {error ? <StateCard title={error} tone="danger" /> : null}
        {pendingEmailVerification ? (
          <StateCard
            title="Account created"
            description="Check your email to verify your account, then log in."
            tone="tint"
          />
        ) : null}

        <View style={styles.form}>
          <View>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="Full Name"
                  autoCapitalize="words"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.fullName ? (
              <Text variant="caption" style={styles.fieldError}>
                {errors.fullName.message}
              </Text>
            ) : null}
          </View>

          <View>
            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="Email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.email ? (
              <Text variant="caption" style={styles.fieldError}>
                {errors.email.message}
              </Text>
            ) : null}
          </View>

          <View>
            <Controller
              control={control}
              name="password"
              render={({ field: { onChange, onBlur, value } }) => (
                <Input
                  placeholder="Password"
                  secureTextEntry
                  onBlur={onBlur}
                  onChangeText={onChange}
                  value={value}
                />
              )}
            />
            {errors.password ? (
              <Text variant="caption" style={styles.fieldError}>
                {errors.password.message}
              </Text>
            ) : null}
          </View>

          <Button
            title={loading ? 'Creating account...' : 'Sign Up'}
            onPress={handleSubmit(onSubmit)}
            disabled={loading}
          />
        </View>
      </AuthCard>

      <Link href="/auth/login" style={styles.link}>
        <Text variant="caption" style={styles.linkText}>
          Already have an account? Log In
        </Text>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
    paddingHorizontal: theme.spacing.xxl,
    gap: theme.spacing.lg,
  },
  card: {
    gap: theme.spacing.lg,
  },
  kicker: {
    color: theme.colors.accent,
  },
  headline: {
    color: theme.colors.textPrimary,
    letterSpacing: 0.5,
  },
  subtitle: {
    color: theme.colors.textMuted,
  },
  form: {
    gap: theme.spacing.md,
  },
  fieldError: {
    color: theme.colors.danger,
    marginTop: theme.spacing.xs,
    marginLeft: theme.spacing.xs,
  },
  link: {
    alignSelf: 'center',
  },
  linkText: {
    color: theme.colors.accent,
  },
});
