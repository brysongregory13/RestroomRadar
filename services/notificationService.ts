import * as Notifications from 'expo-notifications';
import { doc, updateDoc } from 'firebase/firestore';
import { db } from './firebase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export async function registerAndStorePushToken(uid: string): Promise<void> {
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return;
    const tokenData = await Notifications.getExpoPushTokenAsync();
    if (tokenData?.data) {
      await updateDoc(doc(db, 'users', uid), {
        expoPushToken: tokenData.data,
        tokenUpdatedAt: new Date().toISOString(),
      });
    }
  } catch {
    // Notifications not available in Expo Go — requires dev build
  }
}
