export const AGENT_AUTH_STORAGE_KEY = "rewaciti-agent-auth";

export const hasAgentSession = () => {
  if (typeof window === "undefined") return false;

  try {
    const raw = window.localStorage.getItem(AGENT_AUTH_STORAGE_KEY);
    if (!raw) return false;

    const parsed = JSON.parse(raw) as { state?: { token?: string | null } };
    return Boolean(parsed.state?.token);
  } catch {
    return false;
  }
};
