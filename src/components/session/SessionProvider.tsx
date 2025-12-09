// src/components/session/SessionProvider.tsx
"use client";

import { useMemo, useState, type ReactNode, type ReactElement } from "react";
import { SessionContext } from "./SessionContext";
import type { SessionContextType, SessionData } from "./sessionTypes";

interface Props {
  children: ReactNode;
}

export function SessionProvider({ children }: Props): ReactElement {
  const [session, setSessionState] = useState<SessionData | null>(null);

  const value = useMemo<SessionContextType>(
    () => ({
      session,
      setSession: (data: SessionData) => setSessionState(data),
      clearSession: () => setSessionState(null),
    }),
    [session],
  );

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}
