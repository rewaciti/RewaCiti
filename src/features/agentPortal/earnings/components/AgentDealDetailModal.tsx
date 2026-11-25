import { useCallback, useEffect, useState } from "react";
import { CalendarDays, Copy, Mail, Phone, X } from "lucide-react";
import { toast } from "sonner";
import {
  agentAPI,
  agentErrorMessage,
  type AgentDeal,
} from "@/features/agentPortal/common/services/agentAPI";
import { money } from "@/features/agentPortal/common/utils/agentListingUtils";
import {
  dealPropertyTitle,
  dealStatusLabel,
  dealStatusPillClass,
  formatDealDate,
} from "@/features/agentPortal/earnings/utils/agentEarningsUtils";

interface AgentDealDetailModalProps {
  deal: AgentDeal;
  onClose: () => void;
  onUpdated?: (deal: AgentDeal) => void;
}

const ui = {
  muted: "text-gray-600 dark:text-gray-400",
  card: "rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-neutral-900",
  label: "m-0 mb-1 text-xs font-medium tracking-wide text-gray-600 uppercase dark:text-gray-400",
  value: "m-0 text-sm text-gray-900 dark:text-white",
};

const invoiceStatusClass = (status: string) =>
  `inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap ${
    status === "paid"
      ? "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300"
      : status === "void"
        ? "bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-gray-400"
        : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300"
  }`;

const AgentDealDetailModal = ({ deal, onClose, onUpdated }: AgentDealDetailModalProps) => {
  const [detail, setDetail] = useState<AgentDeal>(deal);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadDeal = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const fresh = await agentAPI.getDeal(deal.id);
      setDetail(fresh);
      onUpdated?.(fresh);
    } catch (requestError) {
      setError(agentErrorMessage(requestError, "We couldn't load this deal."));
    } finally {
      setLoading(false);
    }
  }, [deal.id, onUpdated]);

  useEffect(() => {
    void loadDeal();
  }, [loadDeal]);

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [onClose]);

  const copyPaymentLink = async (link?: string) => {
    if (!link) return;
    try {
      await navigator.clipboard.writeText(link);
      toast.success("Payment link copied");
    } catch {
      toast.error("Couldn't copy the payment link");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50" role="presentation" onMouseDown={onClose}>
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={`Deal ${detail.orderNumber}`}
        className="flex h-full w-full max-w-xl flex-col bg-white shadow-2xl dark:bg-neutral-950"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="flex items-start justify-between gap-4 border-b border-gray-200 px-5 py-4 dark:border-white/10">
          <div className="min-w-0">
            <p className={`${ui.label} mb-1`}>Deal</p>
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="m-0 text-lg font-bold">{detail.orderNumber}</h2>
              <span className={dealStatusPillClass(detail.status)}>{dealStatusLabel(detail.status)}</span>
            </div>
            <p className={`mt-1 truncate text-sm ${ui.muted}`}>{dealPropertyTitle(detail)}</p>
          </div>
          <button type="button" aria-label="Close deal details" onClick={onClose} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-white/10">
            <X size={18} />
          </button>
        </header>

        <div className="flex-1 overflow-y-auto px-5 py-5">
          {loading ? (
            <div className={`${ui.card} p-5 text-sm ${ui.muted}`}>Loading deal details…</div>
          ) : error ? (
            <div className={`${ui.card} p-5`}>
              <p className="m-0 text-sm text-red-600 dark:text-red-400">{error}</p>
              <button type="button" onClick={() => void loadDeal()} className="mt-3 h-10 rounded-lg bg-highlight px-4 text-sm font-semibold text-white hover:bg-highlight/90">
                Try again
              </button>
            </div>
          ) : (
            <div className="grid gap-5">
              <section className={`${ui.card} p-4`}>
                <h3 className="m-0 mb-3 text-sm font-semibold">Overview</h3>
                <dl className="m-0 grid grid-cols-2 gap-4">
                  <div>
                    <dt className={ui.label}>Amount</dt>
                    <dd className={`${ui.value} font-semibold`}>{money(Number(detail.amount) || 0)}</dd>
                  </div>
                  <div>
                    <dt className={ui.label}>Deposit</dt>
                    <dd className={ui.value}>{detail.depositPercent}%</dd>
                  </div>
                  <div>
                    <dt className={ui.label}>Customer</dt>
                    <dd className={ui.value}>{detail.customer?.name || "—"}</dd>
                  </div>
                  <div>
                    <dt className={ui.label}>Created</dt>
                    <dd className={ui.value}>{formatDealDate(detail.createdAt)}</dd>
                  </div>
                </dl>
                {(detail.customer?.email || detail.customer?.phone) && (
                  <div className={`mt-4 flex flex-wrap gap-3 border-t border-gray-200 pt-3 text-xs dark:border-white/10 ${ui.muted}`}>
                    {detail.customer?.email && (
                      <a href={`mailto:${detail.customer.email}`} className="inline-flex items-center gap-1.5 hover:text-highlight">
                        <Mail size={14} /> {detail.customer.email}
                      </a>
                    )}
                    {detail.customer?.phone && (
                      <a href={`tel:${detail.customer.phone}`} className="inline-flex items-center gap-1.5 hover:text-highlight">
                        <Phone size={14} /> {detail.customer.phone}
                      </a>
                    )}
                  </div>
                )}
              </section>

              {detail.notes && (
                <section className={`${ui.card} p-4`}>
                  <h3 className="m-0 mb-2 text-sm font-semibold">Notes</h3>
                  <p className={`m-0 text-sm leading-relaxed ${ui.muted}`}>{detail.notes}</p>
                </section>
              )}

              {detail.lines.length > 0 && (
                <section className={`${ui.card} p-4`}>
                  <h3 className="m-0 mb-3 text-sm font-semibold">Breakdown</h3>
                  <ul className="m-0 grid list-none gap-2 p-0">
                    {detail.lines.map((line, index) => (
                      <li key={`${line.label}-${index}`} className="flex items-center justify-between gap-3 text-sm">
                        <span className={ui.muted}>{line.label}</span>
                        <strong>{money(Number(line.amount) || 0)}</strong>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {detail.invoices.length > 0 && (
                <section className={`${ui.card} p-4`}>
                  <h3 className="m-0 mb-3 text-sm font-semibold">Payment requests</h3>
                  <ul className="m-0 grid list-none gap-3 p-0">
                    {detail.invoices.map((invoice) => (
                      <li key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 p-3 dark:border-white/10">
                        <div className="min-w-0">
                          <p className="m-0 text-sm font-semibold">{invoice.label}</p>
                          <p className={`m-0 mt-0.5 text-xs ${ui.muted}`}>{invoice.number}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={invoiceStatusClass(invoice.status)}>{dealStatusLabel(invoice.status)}</span>
                          <strong className="text-sm whitespace-nowrap">{money(Number(invoice.amount) || 0)}</strong>
                          {invoice.paymentLink && (
                            <button
                              type="button"
                              onClick={() => void copyPaymentLink(invoice.paymentLink)}
                              className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-gray-300 px-2.5 text-xs font-semibold text-gray-900 hover:border-highlight hover:text-highlight dark:border-white/15 dark:text-white dark:hover:border-highlight dark:hover:text-highlight"
                            >
                              <Copy size={13} /> Copy link
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}

              {detail.timeline.length > 0 && (
                <section className={`${ui.card} p-4`}>
                  <h3 className="m-0 mb-3 text-sm font-semibold">Timeline</h3>
                  <ol className="m-0 grid list-none gap-4 border-l border-gray-200 pl-4 p-0 dark:border-white/10">
                    {detail.timeline.map((entry) => (
                      <li key={entry.id} className="relative">
                        <span className="absolute top-1 -left-[21px] grid h-3 w-3 place-items-center rounded-full bg-highlight ring-4 ring-white dark:ring-neutral-900" />
                        <p className="m-0 text-sm font-semibold">{entry.label}</p>
                        {entry.remark && <p className={`m-0 mt-1 text-xs ${ui.muted}`}>{entry.remark}</p>}
                        <p className={`mt-1 flex items-center gap-1.5 text-xs ${ui.muted}`}>
                          <CalendarDays size={12} /> {formatDealDate(entry.at)}
                          {entry.by ? ` · ${entry.by}` : ""}
                        </p>
                      </li>
                    ))}
                  </ol>
                </section>
              )}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};

export default AgentDealDetailModal;
