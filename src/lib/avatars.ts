import { buildAvatarImageUri } from '@/lib/avatar-url';
import { supabase } from '@/lib/supabase';
import * as ImagePicker from 'expo-image-picker';

function getFileExtension(uri: string, mimeType: string | null | undefined) {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (mimeType === 'image/heic' || mimeType === 'image/heif') return 'heic';

  const extFromUri = uri.split('.').pop()?.toLowerCase();
  if (extFromUri && /^[a-z0-9]+$/.test(extFromUri)) return extFromUri;

  return 'jpg';
}

export async function uploadAvatar() {
  const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permission.granted) {
    throw new Error('Media library permission is required to upload an avatar.');
  }

  const pickerResult = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    quality: 0.85,
  });

  if (pickerResult.canceled) {
    return null;
  }
  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  if (!userData.user) throw new Error('You must be logged in to upload an avatar.');

  const asset = pickerResult.assets[0];
  const extension = getFileExtension(asset.uri, asset.mimeType);
  const filePath = `${userData.user.id}/${Date.now()}.${extension}`;

  const imageResponse = await fetch(asset.uri);
  const imageBlob = await imageResponse.blob();

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, imageBlob, {
      contentType: asset.mimeType ?? 'image/jpeg',
      upsert: true,
    });

  if (uploadError) throw uploadError;

  const {
    data: { publicUrl },
  } = supabase.storage.from('avatars').getPublicUrl(filePath);
  const updatedAt = new Date().toISOString();

  const { error: profileError } = await supabase
    .from('profiles')
    .update({ avatar_url: publicUrl, updated_at: updatedAt })
    .eq('id', userData.user.id);

  if (profileError) throw profileError;

  return buildAvatarImageUri(publicUrl, updatedAt);
}
