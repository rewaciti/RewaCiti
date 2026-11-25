import { CalendarDays, UserRound } from "lucide-react";
import type { AgentBooking } from "@/features/agent/common/services/agentAPI";
import { money } from "@/features/agent/common/utils/agentListingUtils";
import {
  formatVisitDate,
  formatVisitTime,
  paymentStatusPillClass,
  visitStatusLabel,
  visitStatusPillClass,
} from "@/features/agent/common/utils/agentVisitUtils";

interface AgentVisitFeesTableProps {
  bookings: AgentBooking[];
}

const ui = {
  card: "rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-neutral-900",
  muted: "text-gray-600 dark:text-gray-400",
  th: "h-12 border-b border-gray-300 bg-gray-100 px-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:border-white/15 dark:bg-neutral-800 dark:text-gray-400",
  td: "h-[76px] border-b border-gray-200 px-4 py-3 align-middle text-sm text-gray-900 dark:border-white/10 dark:text-white",
};

const visitorName = (booking: AgentBooking) =>
  booking.contact?.name || booking.customer?.name || "Visitor";

const AgentVisitFeesTable = ({ bookings }: AgentVisitFeesTableProps) => (
  <>
    <div className={`${ui.card} hidden overflow-x-auto rounded-lg lg:block`}>
      <table className="w-full min-w-[820px] border-collapse text-left [&>tbody>tr:last-child>td]:border-b-0">
        <thead>
          <tr>
            <th className={`${ui.th} pl-5`}>Visit</th>
            <th className={ui.th}>Property</th>
            <th className={ui.th}>Visitor</th>
            <th className={ui.th}>Visit status</th>
            <th className={ui.th}>Payment</th>
            <th className={`${ui.th} pr-5 text-right`}>Fee</th>
          </tr>
        </thead>
        <tbody>
          {bookings.map((booking) => (
            <tr key={booking.id}>
              <td className={`${ui.td} pl-5`}>
                <p className="m-0 font-semibold">{booking.reference}</p>
                <p className={`m-0 mt-1 text-xs ${ui.muted}`}>{formatVisitDate(booking.date)} · {formatVisitTime(booking.start)}</p>
              </td>
              <td className={ui.td}>
                <p className="m-0 max-w-60 truncate">{booking.property?.title || "—"}</p>
              </td>
              <td className={ui.td}>
                <p className="m-0 max-w-48 truncate">{visitorName(booking)}</p>
              </td>
              <td className={ui.td}>
                <span className={visitStatusPillClass(booking.status)}>{visitStatusLabel(booking.status)}</span>
              </td>
              <td className={ui.td}>
                <span className={paymentStatusPillClass(booking.paymentStatus)}>{visitStatusLabel(booking.paymentStatus)}</span>
              </td>
              <td className={`${ui.td} pr-5 text-right`}>
                <strong className="text-sm whitespace-nowrap">{money(booking.fee)}</strong>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <ul className="m-0 grid list-none gap-3 p-0 lg:hidden">
      {bookings.map((booking) => (
        <li key={booking.id} className={`${ui.card} p-4`}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="m-0 font-semibold">{booking.reference}</p>
              <p className={`m-0 mt-1 flex items-center gap-1.5 text-xs ${ui.muted}`}>
                <CalendarDays size={13} className="shrink-0" /> {formatVisitDate(booking.date)} · {formatVisitTime(booking.start)}
              </p>
            </div>
            <span className={paymentStatusPillClass(booking.paymentStatus)}>{visitStatusLabel(booking.paymentStatus)}</span>
          </div>
          <div className={`mt-3 grid gap-2 border-t border-gray-200 pt-3 dark:border-white/10 ${ui.muted}`}>
            <p className="m-0 truncate text-xs">{booking.property?.title || "—"}</p>
            <p className="m-0 flex min-w-0 items-center gap-2 text-xs">
              <UserRound size={14} className="shrink-0" aria-hidden="true" />
              <span className="truncate">{visitorName(booking)}</span>
            </p>
          </div>
          <div className="mt-3 flex items-center justify-between gap-3">
            <span className={visitStatusPillClass(booking.status)}>{visitStatusLabel(booking.status)}</span>
            <strong className="shrink-0 text-sm whitespace-nowrap text-gray-900 dark:text-white">{money(booking.fee)}</strong>
          </div>
        </li>
      ))}
    </ul>
  </>
);

export default AgentVisitFeesTable;
