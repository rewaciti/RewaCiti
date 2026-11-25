import { ArrowUpRight, Building2, UserRound } from "lucide-react";
import type { AgentDeal } from "@/features/agentPortal/common/services/agentAPI";
import {
  dealAmount,
  dealCustomerName,
  dealPropertyTitle,
  dealStatusLabel,
  dealStatusPillClass,
  formatDealDate,
} from "@/features/agentPortal/earnings/utils/agentEarningsUtils";

interface AgentDealsTableProps {
  deals: AgentDeal[];
  onSelect: (deal: AgentDeal) => void;
}

const ui = {
  card: "rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-neutral-900",
  muted: "text-gray-600 dark:text-gray-400",
  th: "h-12 border-b border-gray-300 bg-gray-100 px-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:border-white/15 dark:bg-neutral-800 dark:text-gray-400",
  td: "h-[76px] border-b border-gray-200 px-4 py-3 align-middle text-sm text-gray-900 dark:border-white/10 dark:text-white",
};

const AgentDealsTable = ({ deals, onSelect }: AgentDealsTableProps) => (
  <>
    <div className={`${ui.card} hidden overflow-x-auto rounded-lg lg:block`}>
      <table className="w-full min-w-[860px] border-collapse text-left [&>tbody>tr:last-child>td]:border-b-0">
        <thead>
          <tr>
            <th className={`${ui.th} pl-5`}>Deal</th>
            <th className={ui.th}>Property</th>
            <th className={ui.th}>Customer</th>
            <th className={ui.th}>Status</th>
            <th className={ui.th}>Created</th>
            <th className={`${ui.th} pr-5 text-right`}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {deals.map((deal) => (
            <tr
              key={deal.id}
              tabIndex={0}
              onClick={() => onSelect(deal)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelect(deal);
                }
              }}
              className="cursor-pointer outline-none transition hover:bg-gray-50 focus-visible:bg-gray-50 dark:hover:bg-white/5 dark:focus-visible:bg-white/5"
            >
              <td className={`${ui.td} pl-5`}>
                <p className="m-0 flex items-center gap-1.5 font-semibold">
                  {deal.orderNumber}
                  <ArrowUpRight size={14} className="text-brand dark:text-brand-light" aria-hidden="true" />
                </p>
                <p className={`m-0 mt-1 text-xs ${ui.muted}`}>{deal.depositPercent}% deposit</p>
              </td>
              <td className={ui.td}>
                <p className="m-0 max-w-60 truncate">{dealPropertyTitle(deal)}</p>
              </td>
              <td className={ui.td}>
                <p className="m-0 max-w-48 truncate">{dealCustomerName(deal)}</p>
              </td>
              <td className={ui.td}>
                <span className={dealStatusPillClass(deal.status)}>{dealStatusLabel(deal.status)}</span>
              </td>
              <td className={ui.td}>
                <span className={`text-xs whitespace-nowrap ${ui.muted}`}>{formatDealDate(deal.createdAt)}</span>
              </td>
              <td className={`${ui.td} pr-5 text-right`}>
                <strong className="text-sm whitespace-nowrap">{dealAmount(deal)}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <ul className="m-0 grid list-none gap-3 p-0 lg:hidden">
      {deals.map((deal) => (
        <li key={deal.id} className={`${ui.card} p-4`}>
          <button type="button" onClick={() => onSelect(deal)} className="w-full cursor-pointer text-left">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="m-0 flex items-center gap-2 font-semibold">
                  <ArrowUpRight size={16} className="shrink-0 text-brand dark:text-brand-light" aria-hidden="true" />
                  <span className="truncate">{deal.orderNumber}</span>
                </p>
                <p className={`m-0 mt-1 truncate text-xs ${ui.muted}`}>{formatDealDate(deal.createdAt)}</p>
              </div>
              <span className={dealStatusPillClass(deal.status)}>{dealStatusLabel(deal.status)}</span>
            </div>
            <div className={`mt-3 grid gap-2 border-t border-gray-200 pt-3 dark:border-white/10 ${ui.muted}`}>
              <p className="m-0 flex min-w-0 items-center gap-2 text-xs">
                <Building2 size={14} className="shrink-0" aria-hidden="true" />
                <span className="truncate">{dealPropertyTitle(deal)}</span>
              </p>
              <p className="m-0 flex min-w-0 items-center gap-2 text-xs">
                <UserRound size={14} className="shrink-0" aria-hidden="true" />
                <span className="truncate">{dealCustomerName(deal)}</span>
              </p>
            </div>
            <div className="mt-3 flex items-center justify-between gap-3">
              <span className={`text-xs ${ui.muted}`}>{deal.depositPercent}% deposit</span>
              <strong className="shrink-0 text-sm whitespace-nowrap text-gray-900 dark:text-white">{dealAmount(deal)}</strong>
            </div>
          </button>
        </li>
      ))}
    </ul>
  </>
);

export default AgentDealsTable;
