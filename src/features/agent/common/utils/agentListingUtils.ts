import type { AgentPropertyCharge } from "../services/agentAPI";
import { CircleDollarSign, FileText, ImagePlus, Info, ListChecks, MapPin } from "lucide-react";

export const PAGE_SIZE = 20;

export const SERVICE_CHARGE_RATE = 0.05;

export const serviceChargeFor = (propertyCost: number) =>
  Math.max(0, (Number(propertyCost) || 0) * SERVICE_CHARGE_RATE);

export type ListingTab = "all" | "live" | "pending_approval" | "draft" | "sold_let";
export type EditorTab = "general" | "price" | "location" | "details" | "media";
export type PropertyDetailAction = "details" | "availability" | "withdraw" | "book";

export const STATUS_FILTERS: { value: ListingTab; label: string }[] = [
  { value: "all", label: "All" },
  { value: "live", label: "Live" },
  { value: "pending_approval", label: "Pending approval" },
  { value: "draft", label: "Drafts" },
  { value: "sold_let", label: "Sold / Let" },
];

export const EDITOR_TABS: { value: EditorTab; label: string; icon: typeof FileText }[] = [
  { value: "general", label: "General", icon: Info },
  { value: "price", label: "Price & Visit Fee", icon: CircleDollarSign },
  { value: "location", label: "Location", icon: MapPin },
  { value: "details", label: "Details", icon: ListChecks },
  { value: "media", label: "Photos & Media", icon: ImagePlus },
];

export const PROPERTY_PURPOSES = [
  ["sale", "For Sale"],
  ["rent", "For Rent"],
  ["short_let", "Short-let"],
  ["lease", "Lease"],
  ["investment", "Investment"],
];

export const PRICE_PERIODS = [
  ["once", "One-off"],
  ["per_year", "Per year"],
  ["per_month", "Per month"],
  ["per_night", "Per night"],
];

export const CURRENCY_OPTIONS = [
  { label: "Naira (₦)", value: "NGN" },
  { label: "US Dollar ($)", value: "USD" },
  { label: "Pound (£)", value: "GBP" },
];

export const CURRENCY_SYMBOLS: Record<string, string> = {
  NGN: "₦",
  USD: "$",
  GBP: "£",
};

export const RENTAL_TERM_UNITS = [
  { label: "Days", value: "days" },
  { label: "Months", value: "months" },
  { label: "Years", value: "years" },
] as const;

export type RentalTermUnit = (typeof RENTAL_TERM_UNITS)[number]["value"];

export const isRentalTermUnit = (value: string): value is RentalTermUnit =>
  RENTAL_TERM_UNITS.some((unit) => unit.value === value);

export const CHARGE_RECIPIENT_OPTIONS = [
  { label: "The agent", value: "agent" },
  { label: "The company", value: "company" },
  { label: "The owner", value: "owner" },
];

export const DEFAULT_CHARGE_OPTIONS: AgentPropertyCharge[] = [
  { name: "Agent fee", refundable: false, keptBy: "agent" },
  { name: "Legal fee", refundable: false, keptBy: "company" },
  { name: "Service fee", refundable: false, keptBy: "company" },
  { name: "Caution fee", refundable: true, keptBy: "owner" },
];

export const LAND_TITLE_OPTIONS = [
  { label: "Certificate of Occupancy (C of O)", value: "Certificate of Occupancy (C of O)" },
  { label: "Governor's Consent", value: "Governor's Consent" },
  { label: "Registered survey", value: "Registered survey" },
  { label: "Deed of assignment", value: "Deed of assignment" },
];

export const DEFAULT_AMENITY_OPTIONS = [
  "Borehole", "Running water", "Water heater", "Generator", "Inverter", "Solar panel",
  "24-hour electricity", "Prepaid meter", "Air conditioning", "Wi-Fi", "CCTV",
  "24-hour security", "Fenced compound", "Parking space", "Fitted kitchen", "Wardrobes",
  "En-suite bathroom", "Balcony", "Garden", "Swimming pool", "Gym", "Elevator",
  "Boys' quarters", "Store room",
];

export const DEFAULT_RULE_OPTIONS = [
  "No pets", "No smoking", "No loud music", "No parties or events", "No subletting",
  "No unauthorised alterations", "Visiting hours apply", "Females only", "Males only",
  "Married couples only",
];

export const DEFAULT_BILL_OPTIONS = [
  "Electricity", "Water", "Waste disposal", "Security", "Service charge", "Internet",
];

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export const currencySymbol = (currency: string) => CURRENCY_SYMBOLS[currency] ?? "₦";

export const money = (amount: number, currency = "NGN") =>
  `${currencySymbol(currency)}${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(amount)}`;

export const compactMoney = (amount: number, currency = "NGN") => {
  const symbol = currencySymbol(currency);
  const abs = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";
  if (abs >= 1_000_000_000) {
    return `${sign}${symbol}${(abs / 1_000_000_000).toFixed(1).replace(/\.0$/, "")}B`;
  }
  if (abs >= 1_000_000) {
    return `${sign}${symbol}${(abs / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (abs >= 1_000) {
    return `${sign}${symbol}${(abs / 1_000).toFixed(1).replace(/\.0$/, "")}K`;
  }
  return money(amount, currency);
};

export const statusLabel = (status: string) =>
  status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase());

export const periodLabel = (period: string) => {
  const found = PRICE_PERIODS.find(([value]) => value === period);
  return found?.[1] ?? period.replaceAll("_", " ");
};

export const periodShortLabel = (period: string) => {
  if (period === "per_year") return "/yr";
  if (period === "per_month") return "/mo";
  if (period === "per_night") return "/night";
  return "";
};

export const purposeLabel = (purpose: string) =>
  purpose === "short_let" ? "Short-let" : statusLabel(purpose);

export const localISODate = () => {
  const date = new Date();
  date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
  return date.toISOString().slice(0, 10);
};

export const splitLines = (value: string) =>
  value.split(/\r?\n/).map((part) => part.trim()).filter(Boolean);

export const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("The selected file could not be read."));
    };
    reader.onerror = () => reject(reader.error ?? new Error("The selected file could not be read."));
    reader.onabort = () => reject(new Error("Reading the selected file was cancelled."));
    reader.readAsDataURL(file);
  });

export const DESCRIPTION_TAGS = new Set(["B", "STRONG", "I", "EM", "U", "UL", "OL", "LI", "BR", "H2", "H3", "BLOCKQUOTE"]);

export const escapeHtml = (value: string) =>
  value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");

export const sanitizeDescriptionHtml = (html: string) => {
  if (typeof DOMParser === "undefined") return escapeHtml(html.replace(/<[^>]*>/g, ""));
  const parsed = new DOMParser().parseFromString(html, "text/html");
  const serialize = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) return escapeHtml(node.textContent ?? "");
    if (node.nodeType !== Node.ELEMENT_NODE) return "";
    const element = node as HTMLElement;
    const tag = element.tagName.toUpperCase();
    const children = Array.from(element.childNodes).map(serialize).join("");
    if (tag === "P" || tag === "DIV") return `${children}<br>`;
    if (tag === "BR") return "<br>";
    if (tag === "A") {
      const href = element.getAttribute("href")?.trim() ?? "";
      try {
        const url = new URL(href);
        if (url.protocol === "https:" || url.protocol === "http:" || url.protocol === "mailto:") {
          return `<a href="${escapeHtml(url.href)}" target="_blank" rel="noopener noreferrer">${children}</a>`;
        }
      } catch {
        return children;
      }
      return children;
    }
    return DESCRIPTION_TAGS.has(tag) ? `<${tag.toLowerCase()}>${children}</${tag.toLowerCase()}>` : children;
  };
  return Array.from(parsed.body.childNodes)
    .map(serialize)
    .join("")
    .replace(/(?:<br>\s*)+$/i, "");
};

export const descriptionText = (html: string) =>
  html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/gi, " ").replace(/\s+/g, " ").trim();

