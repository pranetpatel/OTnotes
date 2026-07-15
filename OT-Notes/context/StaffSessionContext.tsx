import React, { createContext, useContext, useState } from 'react';
import { StaffMember } from '@/services/staff';

interface StaffSessionContextType {
  activeStaff: StaffMember | null;
  setActiveStaff: (s: StaffMember | null) => void;
}

const StaffSessionContext = createContext<StaffSessionContextType>({
  activeStaff: null,
  setActiveStaff: () => {},
});

export function StaffSessionProvider({ children }: { children: React.ReactNode }) {
  const [activeStaff, setActiveStaff] = useState<StaffMember | null>(null);
  return (
    <StaffSessionContext.Provider value={{ activeStaff, setActiveStaff }}>
      {children}
    </StaffSessionContext.Provider>
  );
}

export function useStaffSession() {
  return useContext(StaffSessionContext);
}
