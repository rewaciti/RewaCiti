import { Ban, House } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getPropertyFeatureItem } from "./propertyFeatureIcons";

interface PropertyFeatureItemProps {
  label: string;
  variant?: "rule" | "bill";
  divided?: boolean;
  showIcon?: boolean;
  icon?: LucideIcon;
  highlighted?: boolean;
}

export default function PropertyFeatureItem({
  label,
  variant,
  divided = false,
  showIcon = false,
  icon,
  highlighted = false,
}: PropertyFeatureItemProps) {
  const feature = getPropertyFeatureItem(label);
  const Icon = icon ?? feature?.icon ?? (showIcon ? House : null);
  const isProhibited = variant === "rule" && (feature?.prohibited ?? false);

  return (
    <li
      className={`flex items-center gap-3 py-3 text-gray-700 dark:text-gray-300 ${
        divided ? "border-b border-gray-200 last:border-b-0 dark:border-white/10" : ""
      } ${
        highlighted
          ? "gap-0 rounded-md border-l border-[#703BF7] bg-[#703BF7]/5 p-2"
          : ""
      }`}
    >
      {Icon && (
        <span
          className={`relative shrink-0 ${
            isProhibited
              ? "text-red-600"
              : highlighted
                ? "text-[#703BF7]"
                : "text-gray-700 dark:text-gray-300"
          }`}
        >
          <Icon
            aria-hidden="true"
            size={20}
            strokeWidth={1.6}
            className={highlighted ? "fill-[#703BF7]" : undefined}
          />
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
