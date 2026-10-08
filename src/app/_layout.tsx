import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';

import { TripProvider } from '@/features/trip/trip-context';

export default function RootLayout() {
  return (
    <TripProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
    </TripProvider>
  );
}
