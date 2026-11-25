import { useCallback, useEffect, useState } from "react";
import * as React from "react";
import {
  ArrowRightLeft,
  CalendarPlus,
  CheckCircle2,
  Circle,
  FileText,
  ImagePlus,
  Mail,
  MessageCircle,
  Phone,
  X,
} from "lucide-react";
import { toast } from "sonner";
import CustomDropdown from "@/shared/components/CustomDropdown";
import {
  agentAPI,
  agentErrorMessage,
  type AgentInquiry,
  type AgentInquiryStatus,
} from "@/features/agentPortal/common/services/agentAPI";
import { money, periodShortLabel } from "@/features/agentPortal/common/utils/agentListingUtils";
import {
  LEAD_STATUS_OPTIONS,
  formatLeadDateTime,
  leadStatusLabel,
  leadStatusPillClass,
} from "@/features/agentPortal/leads/utils/agentLeadUtils";

interface AgentLeadDetailViewProps {
  inquiry: AgentInquiry;
  onClose: () => void;
  onUpdated: (updated: AgentInquiry) => void;
  /** Name shown under "Assigned to". Falls back to "You". */
  agentName?: string;
  /** If provided, a "Book a visit" button is shown. */
  onBookVisit?: (inquiry: AgentInquiry) => void;
}

type ComposerTab = "note" | "call" | "followup";

const TABS: { value: ComposerTab; label: string; placeholder: string }[] = [
  { value: "note", label: "Note", placeholder: "Add a note" },
  { value: "call", label: "Log call", placeholder: "What was discussed on the call?" },
  { value: "followup", label: "Follow-up", placeholder: "e.g. Send floor plan and service charge breakdown" },
];

const fieldInputClass =
  "w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 outline-none transition placeholder:text-gray-500 focus:border-highlight focus:ring-2 focus:ring-highlight/15 dark:border-white/15 dark:bg-[#101010] dark:text-white dark:placeholder:text-gray-500 dark:focus:border-highlight dark:focus:ring-highlight/15";

const outlineBtn =
  "inline-flex h-9 items-center justify-center gap-2 rounded-md border border-gray-200 bg-white px-3 text-sm font-medium text-gray-900 no-underline transition-colors hover:border-highlight hover:text-highlight dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white dark:hover:border-highlight dark:hover:text-highlight";

const toWhatsAppNumber = (phone: string) => {
  const digits = phone.replace(/\D/g, "");
  return digits.startsWith("0") ? `234${digits.slice(1)}` : digits;
};

const sourceLabel = (source: string) => source.replaceAll("_", " ");

const AgentLeadDetailView = ({ inquiry, onClose, onUpdated, agentName, onBookVisit }: AgentLeadDetailViewProps) => {
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [tab, setTab] = useState<ComposerTab>("note");
  const [body, setBody] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [saving, setSaving] = useState(false);
  const [togglingTaskId, setTogglingTaskId] = useState<string | null>(null);

  const [visible, setVisible] = useState(false);

  // Slide in after first paint
  useEffect(() => {
    const frame = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Slide out, then tell the parent to unmount us
  const handleClose = useCallback(() => {
    setVisible(false);
    window.setTimeout(onClose, 300);
  }, [onClose]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && handleClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleClose]);

  const contactName = inquiry.contact?.name || inquiry.customer?.name || "Prospect";
  const contactEmail = inquiry.contact?.email || inquiry.customer?.email || "";
  const contactPhone = inquiry.contact?.phone || inquiry.customer?.phone || "";
  const consentAt = (inquiry as { consentAt?: string }).consentAt;
  const propertyLocation = [
    inquiry.property?.location?.area,
    inquiry.property?.location?.city,
    inquiry.property?.location?.state,
  ].filter(Boolean).join(", ");

  const activeTab = TABS.find((item) => item.value === tab) ?? TABS[0];

  const changeStatus = async (value: string) => {
    const nextStatus = value as AgentInquiryStatus;
    if (nextStatus === inquiry.status) return;
    setUpdatingStatus(true);
    try {
      const response = await agentAPI.updateInquiryStatus(inquiry.id, { status: nextStatus });
      toast.success(response.message);
      onUpdated(response.data);
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't update this lead's status."));
      console.error("Agent lead status update failed:", error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const submitActivity = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = body.trim();
    if (!text) return;
    setSaving(true);
    try {
      const isFollowUp = tab === "followup";
      const dueIso = isFollowUp && dueAt ? new Date(dueAt).toISOString() : undefined;
      const response = await agentAPI.addInquiryActivity(inquiry.id, {
        type: isFollowUp ? "task" : "note",
        body: tab === "call" ? `Call logged: ${text}` : text,
        ...(dueIso ? { dueAt: dueIso } : {}),
      });
      toast.success(response.message);
      setBody("");
      setDueAt("");
      onUpdated(response.data);
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't save that. Please try again."));
      console.error("Agent add inquiry activity failed:", error);
    } finally {
      setSaving(false);
    }
  };

  const toggleTask = async (activityId: string) => {
    setTogglingTaskId(activityId);
    try {
      const response = await agentAPI.toggleInquiryActivity(inquiry.id, activityId);
      toast.success(response.message);
      onUpdated(response.data);
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't update that task."));
      console.error("Agent toggle task failed:", error);
    } finally {
      setTogglingTaskId(null);
    }
  };

  const activityIcon = (type: string) => {
    if (type === "status") return <ArrowRightLeft size={13} />;
    if (type === "email") return <Mail size={13} />;
    return <FileText size={13} />;
  };

  return (
    <div className="fixed inset-0 z-25" role="presentation">
      {/* Backdrop */}
      <button
        type="button"
        aria-label="Close lead"
        onClick={handleClose}
        className={`absolute inset-0 h-full w-full cursor-default border-0 bg-black/55 p-0 transition-opacity duration-300 motion-reduce:transition-none ${visible ? "opacity-100" : "opacity-0"}`}
      />

      {/* Drawer */}
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-lead-detail-title"
        className={`absolute top-0 right-0 flex h-full w-full max-w-[520px] flex-col bg-white text-[#111827] shadow-2xl transition-transform duration-300 ease-out motion-reduce:transition-none dark:bg-[#1a1a1a] dark:text-white ${visible ? "translate-x-0" : "translate-x-full"}`}
      >
        {/* Header */}
        <header className="shrink-0 border-b border-gray-200 px-5 pt-5 pb-4 dark:border-white/10">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2.5">
              <h1 id="agent-lead-detail-title" className="m-0 truncate text-lg font-bold">
                {contactName}
              </h1>
              <span className={leadStatusPillClass(inquiry.status)}>{leadStatusLabel(inquiry.status)}</span>
            </div>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close"
              className="grid h-8 w-8 shrink-0 place-items-center rounded-md border-0 bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-neutral-800 dark:hover:text-white"
            >
              <X size={18} />
            </button>
          </div>

          <p className="mt-1.5 mb-0 text-xs text-gray-600 dark:text-gray-400">
            {inquiry.reference} · <span className="capitalize">{sourceLabel(inquiry.source)}</span> · {formatLeadDateTime(inquiry.createdAt)}
          </p>

          <div className="mt-3 flex flex-wrap items-center gap-2">
            {contactPhone && (
              <a href={`tel:${contactPhone}`} className={outlineBtn}>
                <Phone size={15} /> Call
              </a>
            )}
            {contactPhone && (
              <a
                href={`https://wa.me/${toWhatsAppNumber(contactPhone)}`}
                target="_blank"
                rel="noreferrer"
                className={outlineBtn}
              >
                <MessageCircle size={15} /> WhatsApp
              </a>
            )}
            {contactEmail && (
              <a href={`mailto:${contactEmail}`} className={outlineBtn}>
                <Mail size={15} /> Email
              </a>
            )}
          </div>
        </header>

        {/* Scrollable body */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-5">
          {/* Property */}
          {inquiry.property && (
            <section className="flex items-start gap-3 rounded-md border border-gray-200 p-2.5 dark:border-white/10">
              <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded bg-gray-100 text-gray-500 dark:bg-[#232323] dark:text-gray-400">
                {inquiry.property.photo ? (
                  <img src={inquiry.property.photo} alt="" className="h-full w-full object-cover" />
                ) : (
                  <ImagePlus size={18} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="m-0 truncate text-sm font-semibold">{inquiry.property.title}</h2>
                {propertyLocation && (
                  <p className="mt-0.5 mb-0 truncate text-xs text-gray-600 dark:text-gray-400">{propertyLocation}</p>
                )}
                <p className="mt-1 mb-0 text-sm font-semibold">
                  {money(inquiry.property.price)}{periodShortLabel(inquiry.property.pricePeriod)}
                </p>
              </div>
            </section>
          )}

          {/* Message */}
          <blockquote className="mx-0 mt-4 mb-0 border-l-2 border-highlight/40 pl-3 text-sm leading-relaxed whitespace-pre-wrap text-gray-800 italic dark:border-highlight/40 dark:text-gray-200">
            “{inquiry.message}”
          </blockquote>

          {/* Contact line */}
          <div className="mt-4 text-xs leading-relaxed text-gray-600 dark:text-gray-400">
            <p className="m-0">
              {contactEmail && (
                <a href={`mailto:${contactEmail}`} className="text-inherit no-underline hover:underline">{contactEmail}</a>
              )}
              {contactEmail && contactPhone && " · "}
              {contactPhone && (
                <a href={`tel:${contactPhone}`} className="text-inherit no-underline hover:underline">{contactPhone}</a>
              )}
              {!contactEmail && !contactPhone && "No contact details provided"}
            </p>
            {consentAt && <p className="m-0">Agreed to be contacted on {formatLeadDateTime(consentAt)}</p>}
          </div>

          <hr className="my-4 border-0 border-t border-gray-200 dark:border-white/10" />

          {/* Status + assigned */}
          <div className="grid grid-cols-2 items-start gap-4">
            <div>
              <span className="mb-1.5 block text-xs text-gray-600 dark:text-gray-400">Status</span>
              <CustomDropdown
                className="w-full"
                buttonClassName={`h-10 w-full rounded-md border border-gray-300 bg-white! px-3 text-left text-sm text-gray-900! hover:border-highlight dark:border-white/15 dark:bg-[#101010]! dark:text-white! ${updatingStatus ? "pointer-events-none opacity-60" : ""}`}
                menuClassName="overflow-hidden rounded-xl border-gray-300! bg-white! text-gray-900! shadow-lg! dark:border-white/15! dark:bg-[#1a1a1a]! dark:text-white!"
                menuItemClassName="block w-full bg-white! px-4 py-2.5 text-left text-sm text-gray-900! transition hover:bg-gray-100! dark:bg-[#1a1a1a]! dark:text-white! dark:hover:bg-neutral-800!"
                placeholder="Select status"
                value={inquiry.status}
                options={LEAD_STATUS_OPTIONS}
                onChange={(value) => void changeStatus(value)}
              />
            </div>
            <div>
              <span className="mb-1.5 block text-xs text-gray-600 dark:text-gray-400">Assigned to</span>
              <p className="m-0 flex h-10 items-center text-sm font-medium">{agentName || "You"}</p>
            </div>
          </div>

          {onBookVisit && (
            <button type="button" onClick={() => onBookVisit(inquiry)} className={`${outlineBtn} mt-4 h-10`}>
              <CalendarPlus size={16} /> Book a visit
            </button>
          )}

          <hr className="my-5 border-0 border-t border-gray-200 dark:border-white/10" />

          {/* Composer */}
          <div role="tablist" aria-label="Add activity" className="grid grid-cols-3 border-b border-gray-200 dark:border-white/10">
            {TABS.map((item) => {
              const active = tab === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  role="tab"
                  aria-selected={active}
                  onClick={() => setTab(item.value)}
                  className={`-mb-px h-10 border text-sm transition-colors ${active
                    ? "border-gray-900 font-semibold text-gray-900 dark:border-white dark:text-white"
                    : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"}`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={(event) => void submitActivity(event)} className="mt-3 grid gap-3">
            <textarea
              rows={3}
              maxLength={1000}
              value={body}
              onChange={(event) => setBody(event.target.value)}
              placeholder={activeTab.placeholder}
              aria-label={activeTab.label}
              className={`${fieldInputClass} min-h-[88px] resize-y`}
            />
            <div className="flex flex-wrap items-center justify-between gap-3">
              {tab === "followup" ? (
                <label className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-400">
                  <span>Due</span>
                  <input
                    type="datetime-local"
                    value={dueAt}
                    onChange={(event) => setDueAt(event.target.value)}
                    className="rounded-md border border-gray-300 bg-white px-2.5 py-1.5 text-xs text-gray-900 outline-none focus:border-highlight dark:border-white/15 dark:bg-[#101010] dark:text-white"
                  />
                </label>
              ) : <span />}
              <button
                type="submit"
                disabled={saving || !body.trim()}
                className="inline-flex h-10 items-center justify-center rounded-md bg-highlight px-5 text-sm font-semibold text-white transition-colors hover:bg-[#b79bff] disabled:cursor-not-allowed disabled:bg-gray-400 disabled:opacity-80 dark:disabled:bg-neutral-600"
              >
                {saving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>

          {/* Timeline */}
          <ol className="m-0 mt-6 list-none p-0">
            {inquiry.activities.length === 0 && (
              <li className="text-sm text-gray-500 dark:text-gray-400">No activity recorded yet.</li>
            )}
            {inquiry.activities.map((activity, index) => {
              const isTask = activity.type === "task";
              const isDone = Boolean(activity.done);
              const isLast = index === inquiry.activities.length - 1;
              const label = activity.type === "status" && !activity.body ? "Status changed" : activity.body;
              return (
                <li key={activity.id} className="relative flex gap-3 pb-5 last:pb-0">
                  {!isLast && (
                    <span className="absolute top-7 bottom-0 left-[13px] w-px bg-gray-200 dark:bg-white/10" aria-hidden="true" />
                  )}

                  {isTask ? (
                    <button
                      type="button"
                      disabled={togglingTaskId === activity.id}
                      onClick={() => void toggleTask(activity.id)}
                      aria-label={isDone ? `Mark "${activity.body}" as not done` : `Mark "${activity.body}" as done`}
                      className={`relative z-[1] grid h-[27px] w-[27px] shrink-0 place-items-center rounded-full border border-gray-300 bg-white p-0 transition-colors disabled:opacity-50 dark:border-white/15 dark:bg-[#1a1a1a] ${isDone ? "text-green-600 dark:text-green-400" : "text-gray-500 hover:text-highlight dark:text-gray-400 dark:hover:text-highlight"}`}
                    >
                      {isDone ? <CheckCircle2 size={15} /> : <Circle size={15} />}
                    </button>
                  ) : (
                    <span className="relative z-[1] grid h-[27px] w-[27px] shrink-0 place-items-center rounded-full border border-gray-300 bg-white text-gray-600 dark:border-white/15 dark:bg-[#1a1a1a] dark:text-gray-300">
                      {activityIcon(activity.type)}
                    </span>
                  )}

                  <div className="min-w-0 flex-1">
                    <p className={`m-0 text-sm leading-snug ${isTask && isDone ? "text-gray-500 line-through dark:text-gray-400" : ""}`}>
                      {label}
                    </p>
                    {activity.remark && (
                      <p className="mt-0.5 mb-0 text-xs text-gray-600 dark:text-gray-300">“{activity.remark}”</p>
                    )}
                    <p className="mt-0.5 mb-0 text-xs text-gray-500 dark:text-gray-400">
                      {activity.by} · {formatLeadDateTime(activity.at)}
                      {isTask && activity.dueAt ? ` · Due ${formatLeadDateTime(activity.dueAt)}` : ""}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </aside>
    </div>
  );
};

export default AgentLeadDetailView;