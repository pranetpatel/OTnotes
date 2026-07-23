import React, { createContext, useContext, useEffect, useState } from 'react';
import { Session } from '@supabase/supabase-js';
import { Platform } from 'react-native';
import { supabase } from '@/services/supabase';
import { getCurrentStaffProfile, StaffProfile, signOut as signOutService } from '@/services/auth';

const MUST_SET_PASSWORD_KEY = 'otnotes_must_set_password';

function readMustSetPasswordFlag(): boolean {
  if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
    return sessionStorage.getItem(MUST_SET_PASSWORD_KEY) === '1';
  }
  return false;
}

function writeMustSetPasswordFlag(value: boolean) {
  if (Platform.OS === 'web' && typeof sessionStorage !== 'undefined') {
    if (value) sessionStorage.setItem(MUST_SET_PASSWORD_KEY, '1');
    else sessionStorage.removeItem(MUST_SET_PASSWORD_KEY);
  }
}

/** True when the current URL is an invite / recovery auth callback. */
function urlRequiresPasswordSetup(): boolean {
  if (typeof window === 'undefined') return false;
  const hash = window.location.hash.replace(/^#/, '');
  const search = window.location.search.replace(/^\?/, '');
  const params = new URLSearchParams(hash.includes('=') ? hash : search);
  // Also parse search when hash has tokens (type may be in either).
  const searchParams = new URLSearchParams(search);
  const type = params.get('type') ?? searchParams.get('type');
  return type === 'invite' || type === 'recovery' || type === 'signup';
}

interface AuthContextType {
  session: Session | null;
  staff: StaffProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isOt: boolean;
  /** True after invite / forgot-password link until they finish set-password. */
  mustSetPassword: boolean;
  clearMustSetPassword: () => void;
  signOut: () => Promise<void>;
  refreshStaff: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  staff: null,
  loading: true,
  isAdmin: false,
  isOt: false,
  mustSetPassword: false,
  clearMustSetPassword: () => {},
  signOut: async () => {},
  refreshStaff: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [staff, setStaff] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [mustSetPassword, setMustSetPassword] = useState(() => {
    if (urlRequiresPasswordSetup()) {
      writeMustSetPasswordFlag(true);
      return true;
    }
    return readMustSetPasswordFlag();
  });

  async function loadStaff() {
    const profile = await getCurrentStaffProfile().catch(() => null);
    setStaff(profile);
  }

  function markMustSetPassword() {
    writeMustSetPasswordFlag(true);
    setMustSetPassword(true);
  }

  function clearMustSetPassword() {
    writeMustSetPasswordFlag(false);
    setMustSetPassword(false);
  }

  useEffect(() => {
    if (urlRequiresPasswordSetup()) markMustSetPassword();

    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session);
      if (data.session) await loadStaff();
      setLoading(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((event, newSession) => {
      setSession(newSession);
      if (event === 'PASSWORD_RECOVERY') {
        markMustSetPassword();
      }
      if (newSession) {
        loadStaff();
      } else {
        setStaff(null);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  async function handleSignOut() {
    clearMustSetPassword();
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
        mustSetPassword,
        clearMustSetPassword,
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
