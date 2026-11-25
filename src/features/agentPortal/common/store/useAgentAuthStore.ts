import { create } from "zustand";
import { persist } from "zustand/middleware";
import { AGENT_AUTH_STORAGE_KEY } from "@/shared/lib/agentSession";

interface AgentAuthState {
  token: string | null;
  setToken: (token: string | null) => void;
  logout: () => void;
}

export const useAgentAuthStore = create<AgentAuthState>()(
  persist(
    (set) => ({
      token: null,
      setToken: (token) => set({ token }),
      logout: () => set({ token: null }),
    }),
    { name: AGENT_AUTH_STORAGE_KEY }
  )
);
