import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { useAuthStore } from '@/store/auth';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link } from 'expo-router';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { StyleSheet, View } from 'react-native';
import { z } from 'zod';

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const schema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------

export default function SignupScreen() {
  const signUp = useAuthStore((s) => s.signUp);
  const loading = useAuthStore((s) => s.loading);
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
      // Route guard handles redirect on success
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    }
  };

  return (
    <Screen style={styles.container}>
      <Text variant="heading" style={styles.title}>
        Create Account
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
          {errors.fullName && (
            <Text variant="caption" style={styles.fieldError}>
              {errors.fullName.message}
            </Text>
          )}
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
          {errors.email && (
            <Text variant="caption" style={styles.fieldError}>
              {errors.email.message}
            </Text>
          )}
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
          {errors.password && (
            <Text variant="caption" style={styles.fieldError}>
              {errors.password.message}
            </Text>
          )}
        </View>

        <Button
          title={loading ? 'Creating account\u2026' : 'Sign Up'}
          onPress={handleSubmit(onSubmit)}
          disabled={loading}
        />
      </View>

      <Link href="/auth/login" style={styles.link}>
        <Text variant="caption" style={styles.linkText}>
          Already have an account? Log In
        </Text>
      </Link>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  title: {
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
  link: {
    marginTop: 24,
    alignSelf: 'center',
  },
  linkText: {
    color: '#2563EB',
  },
});
