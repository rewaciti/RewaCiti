import axios, { type AxiosError } from "axios";
import { toast } from "sonner";
import { useAuthStore } from "../../features/auth/store/useAuthStore";

const API_URL = import.meta.env.VITE_API_URL || "https://api.sabiflow.com/api";

/**
 * SabiFlow's Real Estate public API. Every call carries the website's public
 * key (`pk_`), which only works from the addresses allowed on it, so it's safe
 * in the browser. A signed-in customer's token goes along too, so what they
 * send lands on their own record.
 */
export const realEstateApi = axios.create({
  baseURL: `${API_URL}/real-estate/public/v1`,
  timeout: 20_000,
});

realEstateApi.interceptors.request.use((config) => {
  config.headers["x-api-key"] = import.meta.env.VITE_SABIFLOW_PUBLIC_KEY;
  const token = useAuthStore.getState().token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// An expired sign-in is refused on every route, browsing included. Try once
// more without it: if that changes the answer, the sign-in was the problem.
realEstateApi.interceptors.response.use(undefined, async (error: AxiosError) => {
  const config = error.config;
  if (error.response?.status !== 401 || !config?.headers.Authorization) throw error;

  const headers = config.headers.concat();
  headers.delete("Authorization");

  try {
    // Plain axios, so the request interceptor doesn't put the token back
    const response = await axios.request({ ...config, headers });
    useAuthStore.getState().logout();
    return response;
  } catch (retryError) {
    const sameAnswer =
      axios.isAxiosError(retryError) &&
      retryError.response?.status === 401 &&
      messageOf(retryError) === messageOf(error);
    if (!sameAnswer) useAuthStore.getState().logout();
    throw retryError;
  }
});

const messageOf = (error: AxiosError) => {
  const message = (error.response?.data as { message?: string | string[] } | undefined)?.message;
  return Array.isArray(message) ? message[0] : message;
};

/**
 * What to tell the visitor. The API's own messages are written for them
 * ("That time was just taken. Pick another time."), except for key and server
 * problems, which they can't do anything about.
 */
export const errorMessage = (error: unknown, fallback = "Something went wrong. Please try again.") => {
  if (!axios.isAxiosError(error)) return fallback;
  if (!error.response) return "We couldn't reach our server. Check your internet connection and try again.";

  const { status } = error.response;
  const message = messageOf(error);
  if (status === 401 || status === 403 || status >= 500 || !message) {
    console.error("Real Estate API:", status, message);
    return fallback;
  }
  return message;
};

/** Sent as `Idempotency-Key`: the same key twice gives back the first answer instead of a second record. */
export const newRequestKey = () =>
  typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;

export const once = (key: string) => ({ headers: { "Idempotency-Key": key } });

/** A test key checks everything but saves nothing, so say so rather than look like it worked. */
export const noteTestMode = (reply: { message: string; test?: boolean }) => {
  if (reply.test) toast.info(reply.message, { duration: 8000 });
};
