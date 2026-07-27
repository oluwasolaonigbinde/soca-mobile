import { File as ExpoFile } from 'expo-file-system';
import { Platform } from 'react-native';

export async function readUploadBody(uri: string, label: string): Promise<ArrayBuffer | Blob> {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    const blob = await response.blob();
    if (blob.size <= 0) {
      throw new Error(`${label} file is empty. Choose another file and try again.`);
    }
    return blob;
  }

  const file = new ExpoFile(uri);
  const body = await file.arrayBuffer();
  if (body.byteLength <= 0) {
    throw new Error(`${label} file is empty. Choose another file and try again.`);
  }

  return body;
}
