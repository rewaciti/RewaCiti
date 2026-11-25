import { Wallet } from "lucide-react";
import type { AgentPayout } from "@/features/agentPortal/common/services/agentAPI";
import {
  formatPayoutDate,
  payoutAmount,
  payoutDescription,
  payoutPropertyTitle,
  payoutReference,
  payoutStatusLabel,
  payoutStatusPillClass,
} from "@/features/agentPortal/earnings/utils/agentEarningsUtils";

interface AgentPayoutsTableProps {
  payouts: AgentPayout[];
}

const ui = {
  card: "rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-neutral-900",
  muted: "text-gray-600 dark:text-gray-400",
  th: "h-12 border-b border-gray-300 bg-gray-100 px-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:border-white/15 dark:bg-neutral-800 dark:text-gray-400",
  td: "h-[76px] border-b border-gray-200 px-4 py-3 align-middle text-sm text-gray-900 dark:border-white/10 dark:text-white",
};

const AgentPayoutsTable = ({ payouts }: AgentPayoutsTableProps) => (
  <>
    <div className={`${ui.card} hidden overflow-x-auto rounded-lg lg:block`}>
      <table className="w-full min-w-[760px] border-collapse text-left [&>tbody>tr:last-child>td]:border-b-0">
        <thead>
          <tr>
            <th className={`${ui.th} pl-5`}>Payout</th>
            <th className={ui.th}>Property</th>
            <th className={ui.th}>Status</th>
            <th className={ui.th}>Date</th>
            <th className={`${ui.th} pr-5 text-right`}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {payouts.map((payout) => (
            <tr key={payout.id}>
              <td className={`${ui.td} pl-5`}>
                <p className="m-0 font-semibold">{payoutReference(payout)}</p>
                <p className={`m-0 mt-1 max-w-56 truncate text-xs ${ui.muted}`}>{payoutDescription(payout)}</p>
              </td>
              <td className={ui.td}>
                <p className="m-0 max-w-60 truncate">{payoutPropertyTitle(payout)}</p>
              </td>
              <td className={ui.td}>
                <span className={payoutStatusPillClass(payout.status)}>{payoutStatusLabel(payout.status)}</span>
              </td>
              <td className={ui.td}>
                <span className={`text-xs whitespace-nowrap ${ui.muted}`}>{formatPayoutDate(payout.paidAt ?? payout.createdAt)}</span>
              </td>
              <td className={`${ui.td} pr-5 text-right`}>
                <strong className="text-sm whitespace-nowrap">{payoutAmount(payout)}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <ul className="m-0 grid list-none gap-3 p-0 lg:hidden">
      {payouts.map((payout) => (
        <li key={payout.id} className={`${ui.card} p-4`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="m-0 flex items-center gap-2 font-semibold">
                <Wallet size={16} className="shrink-0 text-[#b79bff] dark:text-[#b79bff]" aria-hidden="true" />
                <span className="truncate">{payoutReference(payout)}</span>
              </p>
              <p className={`m-0 mt-1 truncate text-xs ${ui.muted}`}>{payoutDescription(payout)}</p>
            </div>
            <span className={payoutStatusPillClass(payout.status)}>{payoutStatusLabel(payout.status)}</span>
          </div>
          <div className={`mt-3 flex items-center justify-between gap-3 border-t border-gray-200 pt-3 dark:border-white/10 ${ui.muted}`}>
            <div className="min-w-0">
              <p className="m-0 truncate text-xs">{payoutPropertyTitle(payout)}</p>
              <p className="m-0 mt-0.5 text-xs">{formatPayoutDate(payout.paidAt ?? payout.createdAt)}</p>
            </div>
            <strong className="shrink-0 text-sm whitespace-nowrap text-gray-900 dark:text-white">{payoutAmount(payout)}</strong>
          </div>
        </li>
      ))}
    </ul>
  </>
);

export default AgentPayoutsTable;
