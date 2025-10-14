// components/workspace-context.tsx
"use client"
import { createContext, useContext, useEffect, useState } from "react";
import { getCurrentWorkspace, apiClient } from "@/lib/api";
import { useAuth } from "@/contexts/auth-context";

type WorkspaceCtx = {
  currentWorkspaceId: string | null;
  setCurrentWorkspaceId: (id: string | null) => void;
  isLoading: boolean;
};

const Ctx = createContext<WorkspaceCtx | null>(null);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  const [currentWorkspaceId, setCurrentWorkspaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      console.log('[WorkspaceProvider] Auth state changed:', { user: !!user, isAuthenticated });
      
      // Reset state when user logs out
      if (!user || !isAuthenticated) {
        setCurrentWorkspaceId(null);
        setIsLoading(false);
        return;
      }

      // Only fetch workspace if user is authenticated
      if (!apiClient.isAuthenticated()) {
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        console.log('[WorkspaceProvider] Fetching workspace...');
        const ws = await getCurrentWorkspace();
        console.log('[WorkspaceProvider] Got workspace:', ws);
        setCurrentWorkspaceId(ws.id)
      } catch (e) {
        console.error("Failed to fetch current workspace", e);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [user, isAuthenticated]); // Re-run when auth state changes

  return <Ctx.Provider value={{ currentWorkspaceId, setCurrentWorkspaceId, isLoading }}>{children}</Ctx.Provider>;
}

export function useWorkspaceContext() {
  const ctx = useContext(Ctx);
  if (!ctx) {
    console.warn("useWorkspaceContext must be used within <WorkspaceProvider>");
    return null;
  }
  return ctx;
}