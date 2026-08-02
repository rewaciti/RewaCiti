import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const formatCurrency = (amount: number) => {
  if (amount >= 1000000000) {
    return `${(amount / 1000000000).toFixed(3).replace(/\.?0+$/, "")}B`;
  }
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(3).replace(/\.?0+$/, "")}M`;
  }
  return amount.toLocaleString();
};

export const ensureHttps = (url: string) => {
  if (!url) return url;
  if (url.startsWith("http://")) {
    return url.replace("http://", "https://");
  }
  return url;
};

export const setCookie = (name: string, value: string, days = 365) => {
  const expires = new Date();
  expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

export const getCookie = (name: string) => {
  if (typeof document === "undefined") {
    return "";
  }

  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : "";
};

export const deleteCookie = (name: string) => {
  document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/`;
};
