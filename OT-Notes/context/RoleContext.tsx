import React, { createContext, useContext, useState } from 'react';

type Role = 'supervisor' | 'admin';

interface RoleContextType {
  role: Role;
  setRole: (r: Role) => void;
  isAdmin: boolean;
}

const RoleContext = createContext<RoleContextType>({
  role: 'supervisor',
  setRole: () => {},
  isAdmin: false,
});

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>('supervisor');
  return (
    <RoleContext.Provider value={{ role, setRole, isAdmin: role === 'admin' }}>
      {children}
    </RoleContext.Provider>
  );
}

export function useRole() {
  return useContext(RoleContext);
}
