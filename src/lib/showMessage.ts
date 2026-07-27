import { Alert, Platform } from 'react-native';

export function showMessage(title: string, message: string) {
  if (Platform.OS === 'web') {
    window.alert(`${title}: ${message}`);
    return;
  }

  Alert.alert(title, message);
}
