import { create } from "zustand";
import { persist } from "zustand/middleware";

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
    { name: "rewaciti-agent-auth" }
  )
);
