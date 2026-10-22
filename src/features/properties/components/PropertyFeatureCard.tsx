import { Ban, House } from "lucide-react";
import { getPropertyFeatureItem } from "./propertyFeatureIcons";

interface PropertyFeatureCardProps {
  label: string;
  className?: string;
  variant?: "rule" | "bill";
}

export default function PropertyFeatureCard({
  label,
  className = "",
  variant,
}: PropertyFeatureCardProps) {
  const feature = getPropertyFeatureItem(label);
  const Icon = feature?.icon ?? House;
  const isProhibited = variant === "rule" && (feature?.prohibited ?? false);

  return (
    <li
      className={`relative flex min-h-28 flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center ${
        isProhibited
          ? "border-red-500/40 bg-red-500/5"
          : "border-gray-600/20 bg-gray-50 dark:bg-black/20"
      } ${className}`}
    >
      <span className="relative text-[#703BF7]">
        <Icon aria-hidden="true" size={24} strokeWidth={1.5} />
        {isProhibited && (
          <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full border border-white bg-red-600 text-white dark:border-[#1A1A1A]">
            <Ban aria-hidden="true" size={10} strokeWidth={2} />
          </span>
        )}
      </span>
      <span className="text-sm text-gray-700 dark:text-gray-300">{label}</span>
    </li>
  );
}
