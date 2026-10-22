import PropertyFeatureCard from "./PropertyFeatureCard";

interface FeatureSectionProps {
  title: string;
  items?: string[];
  extraItems?: string[];
  limit: number;
  noun: string;
  onShowAll: () => void;
  variant?: "rule" | "bill";
}

export default function FeatureSection({
  title,
  items = [],
  extraItems = [],
  limit,
  noun,
  onShowAll,
  variant,
}: FeatureSectionProps) {
  if (items.length === 0 && extraItems.length === 0) return null;

  const hasMore = items.length > limit || extraItems.length > 0;

  return (
    <section className="border-t border-gray-200 py-7 first:border-t-0 first:pt-0 dark:border-white/10">
      <h2 className="mb-4 text-xl font-semibold tracking-tight text-gray-900 dark:text-white">
        {title}
      </h2>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {items.slice(0, limit).map((item, index) => (
          <PropertyFeatureCard
            key={`${item}-${index}`}
            label={item}
            variant={variant}
          />
        ))}
      </ul>
      {hasMore && (
        <button
          type="button"
          onClick={onShowAll}
          className="mt-5 rounded-lg border border-gray-900 px-4 py-2.5 text-sm font-semibold text-gray-900 transition hover:bg-gray-50 dark:border-white dark:text-white dark:hover:bg-white/10"
        >
          Show all {noun}
        </button>
      )}
    </section>
  );
}
