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
