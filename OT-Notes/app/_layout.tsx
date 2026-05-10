import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { initDatabase } from '@/services/database';

export const unstable_settings = {
  anchor: '(tabs)',
};

export default function RootLayout() {
  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7734/ingest/c079974f-ddd0-47ec-9f6b-db9a6b9cfe8e', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': '31309a' },
      body: JSON.stringify({
        sessionId: '31309a',
        runId: 'initial',
        hypothesisId: 'H0',
        location: 'app/_layout.tsx:RootLayout:useEffect',
        message: 'Root layout mounted',
        data: {},
        timestamp: Date.now(),
      }),
    }).catch(() => {});
    // #endregion
    initDatabase();
  }, []);

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
      </Stack>
      <StatusBar style="dark" />
    </>
  );
}
