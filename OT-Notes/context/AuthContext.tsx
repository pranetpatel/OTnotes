import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { supabase } from '@/services/supabase';
import { getCurrentStaffProfile, StaffProfile, signOut as signOutService } from '@/services/auth';

interface AuthContextType {
  session: Session | null;
  staff: StaffProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isOt: boolean;
  signOut: () => Promise<void>;
  refreshStaff: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  staff: null,
  loading: true,
  isAdmin: false,
  isOt: false,
  signOut: async () => {},
  refreshStaff: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);

  async function loadStaff() {
    const profile = await getCurrentStaffProfile().catch(() => null);
    setStaff(profile);
  }

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await loadStaff();
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      if (newSession) {
        loadStaff();
      } else {
        setStaff(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    await signOutService();
    setSession(null);
    setStaff(null);
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        staff,
        loading,
        isAdmin: !!staff?.isAdmin && staff.active,
        isOt: !!staff?.isOt && staff.active,
        signOut: handleSignOut,
        refreshStaff: loadStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
