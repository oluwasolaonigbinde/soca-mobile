import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { LinearGradient } from 'expo-linear-gradient';
import { Link, useRouter } from 'expo-router';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AuthCard, Button, Input, Screen, StateCard, Text, alpha, theme } from '@/components/ui';
import { useAuthStore } from '@/store/auth';

const schema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

// Dev Quick Login is a developer-only convenience. It is double-gated so it
// can never appear in a release/handover build:
//   1. __DEV__ must be true (Expo strips this in production bundles).
//   2. Both EXPO_PUBLIC_DEV_SIGNIN_EMAIL and _PASSWORD must be set.
// Even with both gates, Expo bakes EXPO_PUBLIC_* values into the JS bundle at
// build time, so these vars MUST remain unset for any build shared with the
// client. See .env.example for the full warning.
const devEmail = __DEV__ ? process.env.EXPO_PUBLIC_DEV_SIGNIN_EMAIL : undefined;
const devPassword = __DEV__ ? process.env.EXPO_PUBLIC_DEV_SIGNIN_PASSWORD : undefined;
const hasDevCredentials = __DEV__ && Boolean(devEmail && devPassword);
const googleAuthEnabled = process.env.EXPO_PUBLIC_GOOGLE_AUTH_ENABLED === 'true';
const loginHeroImage = require('../../assets/images/login-football-hero.png');

export default function LoginScreen() {
  const router = useRouter();
  const signIn = useAuthStore((s) => s.signIn);
  const signInWithGoogle = useAuthStore((s) => s.signInWithGoogle);
  const loading = useAuthStore((s) => s.loading);
  const [error, setError] = useState<string | null>(null);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: FormData) => {
    setError(null);
    try {
      await signIn(data.email, data.password);
      router.replace('/');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  const handleDevQuickLogin = async () => {
    if (!devEmail || !devPassword) return;
    setError(null);
    try {
      await signIn(devEmail, devPassword);
      router.replace('/');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Dev login failed');
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);

    if (!googleAuthEnabled) {
      setError('Google sign-in is not enabled yet.');
      return;
    }

    try {
      await signInWithGoogle();
      router.replace('/');
    } catch (e: unknown) {
      setError(
        e instanceof Error
          ? e.message
          : 'Google sign-in failed. Check dashboard config.',
      );
    }
  };

  return (
    <Screen unsafe style={styles.screen}>
      <ImageBackground source={loginHeroImage} style={styles.background} imageStyle={styles.backgroundImage}>
        <LinearGradient
          colors={['rgba(3, 8, 7, 0.14)', 'rgba(4, 9, 9, 0.54)', 'rgba(4, 8, 11, 0.94)']}
          locations={[0, 0.44, 1]}
          style={styles.overlay}
        >
          <SafeAreaView edges={['top', 'bottom']} style={styles.safeArea}>
            <View style={styles.spacer} />
            <View style={styles.content}>
              <AuthCard style={styles.card}>
                <Text variant="overline" style={styles.kicker}>
                  WELCOME BACK
                </Text>
                <Text variant="heading" style={styles.headline}>
                  LOG IN
                </Text>
                <Text variant="body" style={styles.subtitle}>
                  Sign in to your account.
                </Text>

                {error ? <StateCard title={error} tone="danger" /> : null}

                <View style={styles.form}>
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
                    title={loading ? 'Signing in...' : 'Log In'}
                    onPress={handleSubmit(onSubmit)}
                    disabled={loading}
                  />

                  {hasDevCredentials && (
                    <Button
                      title={loading ? 'Signing in...' : 'Dev Quick Login'}
                      variant="outline"
                      onPress={handleDevQuickLogin}
                      disabled={loading}
                    />
                  )}
                  <Button
                    title="Sign in with Google"
                    variant="outline"
                    onPress={handleGoogleSignIn}
                    disabled={loading}
                  />
                </View>
              </AuthCard>

              <Link href="/auth/signup" style={styles.link}>
                <Text variant="caption" style={styles.linkText}>
                  Don&apos;t have an account? Sign Up
                </Text>
              </Link>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </ImageBackground>
    </Screen>
  );
}

const styles = StyleSheet.create({
  screen: {
    backgroundColor: '#06090B',
  },
  background: {
    flex: 1,
  },
  backgroundImage: {
    opacity: 0.94,
  },
  overlay: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    paddingHorizontal: theme.spacing.xxl,
  },
  spacer: {
    flex: 1,
    minHeight: 160,
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingBottom: theme.spacing.xl,
    gap: theme.spacing.lg,
  },
  card: {
    gap: theme.spacing.lg,
    backgroundColor: alpha(theme.colors.surfaceDark, 0.86),
    borderColor: alpha(theme.colors.accent, 0.14),
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
    color: theme.colors.textSecondary,
    textShadowColor: alpha(theme.colors.black, 0.7),
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 8,
  },
});
