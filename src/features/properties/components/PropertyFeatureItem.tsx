import { Ban, House } from "lucide-react";
import { getPropertyFeatureItem } from "./propertyFeatureIcons";

interface PropertyFeatureItemProps {
  label: string;
  variant?: "rule" | "bill";
  divided?: boolean;
  showIcon?: boolean;
}

export default function PropertyFeatureItem({
  label,
  variant,
  divided = false,
  showIcon = false,
}: PropertyFeatureItemProps) {
  const feature = getPropertyFeatureItem(label);
  const Icon = feature?.icon ?? (showIcon ? House : null);
  const isProhibited = variant === "rule" && (feature?.prohibited ?? false);

  return (
    <li
      className={`flex items-center gap-3 py-3 text-gray-700 dark:text-gray-300 ${
        divided ? "border-b border-gray-200 last:border-b-0 dark:border-white/10" : ""
      }`}
    >
      {Icon && (
        <span
          className={`relative shrink-0 ${
            isProhibited ? "text-red-600" : "text-gray-700 dark:text-gray-300"
          }`}
        >
          <Icon aria-hidden="true" size={20} strokeWidth={1.6} />
          {isProhibited && (
            <span className="absolute -right-1.5 -top-1.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-red-600 text-white">
              <Ban aria-hidden="true" size={9} strokeWidth={2} />
            </span>
          )}
        </span>
      )}
      <span className="text-sm leading-6">{label}</span>
    </li>
  );
}
