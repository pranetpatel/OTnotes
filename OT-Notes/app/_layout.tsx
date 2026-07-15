import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { initDatabase } from '@/services/database';
import { RoleProvider } from '@/context/RoleContext';
import { StaffSessionProvider } from '@/context/StaffSessionContext';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { COLORS } from '@/constants/data';

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootNavigator() {
  const { session, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: COLORS.bg }}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <Stack>
      <Stack.Protected guard={!!session}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
        <Stack.Screen
          name="edit-assessment"
          options={{ presentation: 'modal', title: 'Edit Assessment', headerShown: true }}
        />
      </Stack.Protected>
      <Stack.Protected guard={!session}>
        <Stack.Screen name="login" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  useEffect(() => {
    initDatabase();
  }, []);

  return (
    <AuthProvider>
      <RoleProvider>
        <StaffSessionProvider>
          <RootNavigator />
          <StatusBar style="dark" />
        </StaffSessionProvider>
      </RoleProvider>
    </AuthProvider>
  );
}
