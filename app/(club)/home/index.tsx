import { Button } from '@/components/ui/Button';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { uploadAvatar } from '@/lib/avatars';
import { useAuthStore } from '@/store/auth';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Platform, StyleSheet } from 'react-native';

export default function ClubHomeScreen() {
  const router = useRouter();
  const signOut = useAuthStore((s) => s.signOut);
  const profile = useAuthStore((s) => s.profile);
  const fetchProfile = useAuthStore((s) => s.fetchProfile);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);

  const onUploadAvatar = async () => {
    try {
      setUploadingAvatar(true);
      const uploadedUrl = await uploadAvatar();
      if (uploadedUrl) {
        await fetchProfile();
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unable to upload avatar.';
      Alert.alert('Upload failed', message);
    } finally {
      setUploadingAvatar(false);
    }
  };

  const onSignOut = async () => {
    try {
      await signOut();
      router.replace('/welcome');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Sign out failed';
      console.error('Sign out error:', error);
      if (Platform.OS === 'web') {
        window.alert(`Sign out failed: ${message}`);
      } else {
        Alert.alert('Sign out failed', message);
      }
    }
  };

  return (
    <Screen style={styles.container}>
      <Text variant="heading">Club Home</Text>
      <Text variant="body" style={styles.subtitle}>
        Welcome{profile?.display_name || profile?.full_name ? `, ${profile.display_name || profile.full_name}` : ''}.
      </Text>
      {profile?.avatar_url ? (
        <Image
          source={{ uri: profile.avatar_url }}
          style={styles.avatar}
          accessibilityLabel="Current avatar"
        />
      ) : null}
      <Button
        title="My Profile"
        variant="outline"
        onPress={() => profile?.id && router.push(`/profile/${profile.id}`)}
        style={styles.profileButton}
      />
      <Button
        title={uploadingAvatar ? 'Uploading...' : 'Upload Avatar'}
        variant="outline"
        onPress={onUploadAvatar}
        disabled={uploadingAvatar}
        style={styles.uploadAvatar}
      />
      <Button
        title="Sign Out"
        variant="outline"
        onPress={onSignOut}
        style={styles.signOut}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  subtitle: {
    marginTop: 8,
    color: '#666',
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginTop: 16,
    backgroundColor: '#eee',
  },
  profileButton: {
    marginTop: 20,
    alignSelf: 'stretch',
  },
  uploadAvatar: {
    marginTop: 20,
    alignSelf: 'stretch',
  },
  signOut: {
    marginTop: 12,
    alignSelf: 'stretch',
  },
});
