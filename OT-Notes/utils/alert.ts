import { Alert, Platform } from 'react-native';

/** Cross-platform alert — React Native Alert is unreliable on web. */
export function showAlert(title: string, message?: string, buttons?: { text: string; onPress?: () => void; style?: 'default' | 'cancel' | 'destructive' }[]) {
  if (Platform.OS === 'web') {
    const body = message ? `${title}\n\n${message}` : title;
    if (!buttons || buttons.length <= 1) {
      window.alert(body);
      buttons?.[0]?.onPress?.();
      return;
    }
    const cancel = buttons.find(b => b.style === 'cancel');
    const primary = buttons.find(b => b.style !== 'cancel') ?? buttons[0];
    if (window.confirm(body)) {
      primary.onPress?.();
    } else {
      cancel?.onPress?.();
    }
    return;
  }
  Alert.alert(title, message, buttons);
}
