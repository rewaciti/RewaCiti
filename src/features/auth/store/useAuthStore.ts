import { create } from "zustand";
import { persist } from "zustand/middleware";
import { deleteCookie, getCookie, setCookie } from "../../../shared/lib/utils";

interface Customer {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  companyId: string;
  enabledModules: string[];
  emailVerified: boolean;
  status: string;
  phoneNumber?: string;
}

interface AuthStore {
  token: string | null;
  customer: Customer | null;
  isAuthenticated: boolean;
  companyId: string;

  setToken: (token: string | null) => void;
  setCustomer: (customer: Customer | null) => void;
  setCompanyId: (companyId: string) => void;
  logout: () => void;
}

export const COMPANY_ID = import.meta.env.VITE_COMPANY_ID;
const AUTH_TOKEN_COOKIE = "rewaciti_auth_token";
const AUTH_CUSTOMER_COOKIE = "rewaciti_auth_customer";

const getCookieToken = () => {
  if (typeof document === "undefined") {
    return null;
  }

  const token = getCookie(AUTH_TOKEN_COOKIE);
  return token || null;
};

const getCookieCustomer = (): Customer | null => {
  if (typeof document === "undefined") {
    return null;
  }

  const customerCookie = getCookie(AUTH_CUSTOMER_COOKIE);
  if (!customerCookie) {
    return null;
  }

  try {
    return JSON.parse(customerCookie) as Customer;
  } catch {
    return null;
  }
};

const initialToken = getCookieToken();
const initialCustomer = getCookieCustomer();

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      token: initialToken,
      customer: initialCustomer,
      isAuthenticated: !!initialToken || !!initialCustomer,
      companyId: COMPANY_ID,

      setToken: (token) => {
        if (token) {
          setCookie(AUTH_TOKEN_COOKIE, token);
        } else {
          deleteCookie(AUTH_TOKEN_COOKIE);
        }

        set({
          token,
          isAuthenticated: !!token,
        });
      },

      setCustomer: (customer) => {
        if (customer) {
          setCookie(AUTH_CUSTOMER_COOKIE, JSON.stringify(customer));
        } else {
          deleteCookie(AUTH_CUSTOMER_COOKIE);
        }

        set({
          customer,
          isAuthenticated: !!customer,
        });
      },

      setCompanyId: (companyId) =>
        set({
          companyId,
        }),

      logout: () => {
        deleteCookie(AUTH_TOKEN_COOKIE);
        deleteCookie(AUTH_CUSTOMER_COOKIE);

        set({
          token: null,
          customer: null,
          isAuthenticated: false,
        });
      },
    }),
    {
      name: "auth-storage",
      onRehydrateStorage: () => (state) => {
        if (!state) return;

        const cookieToken = getCookieToken();
        const cookieCustomer = getCookieCustomer();

        if (cookieToken || cookieCustomer) {
          state.token = cookieToken;
          state.customer = cookieCustomer;
          state.isAuthenticated = !!(cookieToken || cookieCustomer);
        }
      },
      merge: (persistedState, currentState) => {
        const state = persistedState as Partial<AuthStore> | undefined;
        const cookieToken = getCookieToken();
        const cookieCustomer = getCookieCustomer();

        const nextState = {
          ...currentState,
          ...state,
          token: cookieToken || state?.token || null,
          customer: cookieCustomer || state?.customer || null,
          isAuthenticated: !!(cookieToken || cookieCustomer || state?.token || state?.customer),
          companyId: state?.companyId || COMPANY_ID,
        };

        return nextState;
      },
    }
  )
);
