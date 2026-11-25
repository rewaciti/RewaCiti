import { Star } from "lucide-react";
import type { AgentRatingSummary } from "@/features/agent/common/services/agentAPI";

interface AgentRatingCardProps {
  rating: AgentRatingSummary | null;
}

const AgentRatingCard = ({ rating }: AgentRatingCardProps) => {
  const average = Number(rating?.average) || 0;
  const count = Number(rating?.count) || 0;
  const filledStars = Math.max(0, Math.min(5, Math.round(average)));

  return (
    <article className="rounded-xl border border-gray-200 bg-white p-4 dark:border-white/10 dark:bg-neutral-900">
      <h2 className="m-0 text-sm font-semibold text-gray-900 dark:text-white">Your rating</h2>
      <div className="mt-3 flex items-center gap-3">
        <strong className="font-serif text-3xl font-semibold text-gray-900 dark:text-white">{average.toFixed(1)}</strong>
        <div>
          <div className="flex items-center gap-0.5" aria-label={`${average.toFixed(1)} out of 5 stars`}>
            {Array.from({ length: 5 }, (_, index) => (
              <Star
                key={index}
                size={16}
                className={index < filledStars ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"}
                aria-hidden="true"
              />
            ))}
          </div>
          <p className="m-0 mt-1 text-xs text-gray-600 dark:text-gray-400">
            {count} {count === 1 ? "review" : "reviews"}
          </p>
        </div>
      </div>
    </article>
  );
};

export default AgentRatingCard;
