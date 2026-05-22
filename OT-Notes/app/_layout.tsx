import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { initDatabase } from '@/services/database';
import { RoleProvider } from '@/context/RoleContext';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <RoleProvider>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen
          name="edit-assessment"
          options={{ presentation: 'modal', title: 'Edit Assessment', headerShown: true }}
        />
      </Stack>
      <StatusBar style="dark" />
    </RoleProvider>
  );
}
