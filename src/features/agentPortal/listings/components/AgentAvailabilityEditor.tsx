import { useEffect, useState } from "react";
import * as React from "react";
import { CalendarDays, X } from "lucide-react";
import { toast } from "sonner";
import CustomDropdown from "@/shared/components/CustomDropdown";
import { agentAPI, agentErrorMessage, type AgentProperty, type AgentPropertyAvailability } from "@/features/agentPortal/common/services/agentAPI";
import { localISODate, splitLines } from "@/features/agentPortal/common/utils/agentListingUtils";

const DISPLAY_DAYS = [
  { day: 1, label: "Mon" },
  { day: 2, label: "Tue" },
  { day: 3, label: "Wed" },
  { day: 4, label: "Thu" },
  { day: 5, label: "Fri" },
  { day: 6, label: "Sat" },
  { day: 0, label: "Sun" },
];

const AgentAvailabilityEditor = ({
  property,
  onClose,
}: {
  property: AgentProperty;
  onClose: () => void;
}) => {
  const [availability, setAvailability] = useState<AgentPropertyAvailability | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [blackoutText, setBlackoutText] = useState("");
  const [blackoutDate, setBlackoutDate] = useState("");
  const [blackoutPickerOpen, setBlackoutPickerOpen] = useState(false);

  useEffect(() => {
    let active = true;
    void agentAPI.getPropertyAvailability(property.id)
      .then((response) => {
        if (!active) return;
        setAvailability(response);
        setBlackoutText(response.blackoutDates.join("\n"));
      })
      .catch((error: unknown) => {
        toast.error(agentErrorMessage(error, "We couldn't load visiting hours."));
        console.error("Agent property availability failed to load:", error);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => { active = false; };
  }, [property.id]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !saving) onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, saving]);

  const updateDay = (day: number, patch: Partial<AgentPropertyAvailability["week"][number]>) => {
    setAvailability((current) => current ? ({
      ...current,
      week: current.week.map((entry) => entry.day === day ? { ...entry, ...patch } : entry),
    }) : current);
  };

  const addBlackoutDate = () => {
    if (!blackoutDate) return;
    const dates = splitLines(blackoutText);
    if (!dates.includes(blackoutDate)) setBlackoutText([...dates, blackoutDate].join("\n"));
    setBlackoutDate("");
  };

  const removeBlackoutDate = (date: string) => {
    setBlackoutText(splitLines(blackoutText).filter((value) => value !== date).join("\n"));
  };

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!availability) return;
    setSaving(true);
    try {
      const response = await agentAPI.updatePropertyAvailability(property.id, {
        useDefault: availability.useDefault,
        week: availability.week,
        slotMinutes: availability.slotMinutes,
        maxVisitorsPerSlot: availability.maxVisitorsPerSlot,
        blackoutDates: splitLines(blackoutText),
      });
      setAvailability(response.data);
      toast.success(response.message);
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't save visiting hours."));
      console.error("Agent property availability update failed:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center overflow-y-auto bg-black/55 p-0 sm:items-center sm:p-6"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="flex h-[90dvh] max-h-[90dvh] w-full flex-col overflow-hidden rounded-t-3xl rounded-b-none border border-b-0 border-[#e5e7eb] bg-white p-5 text-[#111827] shadow-2xl dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white sm:h-[min(88vh,900px)] sm:max-h-[min(88vh,900px)] sm:max-w-[680px] sm:rounded-3xl sm:border-b sm:p-7"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-availability-title"
      >
        <div className="mb-5 flex flex-[0_0_auto] items-start justify-between gap-4">
          <div>
            <h2 id="agent-availability-title" className="m-0 font-serif text-[26px] font-semibold leading-tight text-[#111827] dark:text-white">Visiting hours</h2>
            <p className="mt-[5px] mb-0 text-[13px] text-[#4b5563] dark:text-[#9ca3af]">{property.title}</p>
          </div>
          <button
            type="button"
            aria-label="Close visiting hours"
            onClick={onClose}
            className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] border border-[#e5e7eb] bg-white p-0 text-[#4b5563] transition-colors hover:border-brand hover:bg-[#f3f4f6] hover:text-[#111827] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-[#9ca3af] dark:hover:border-brand dark:hover:bg-[#232323] dark:hover:text-white"
          >
            <X size={19} />
          </button>
        </div>
        {loading ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12" role="status" aria-live="polite">
            <span
              className="h-9 w-9 animate-spin rounded-full border-[3px] border-gray-200 border-t-brand dark:border-white/10 dark:border-t-brand-light"
              aria-hidden="true"
            />
            <p className="m-0 text-sm text-[#4b5563] dark:text-[#9ca3af]">Loading visiting hours…</p>
          </div>
        ) : availability ? (
          <form onSubmit={save} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="grid min-h-0 flex-1 gap-[17px] overflow-y-auto py-0 pr-0.5 pb-[18px]">
              <div className="box-border flex w-full items-center justify-between gap-3 rounded-[10px] border border-[#e5e7eb] px-3.5 py-3 text-[13px] font-semibold text-[#111827] dark:border-white/10 dark:text-white">
                <span>Use RewaCiti’s usual hours</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={availability.useDefault}
                  aria-label="Use RewaCiti’s usual hours"
                  onClick={() => setAvailability((current) => current ? { ...current, useDefault: !current.useDefault } : current)}
                  className={`relative h-[26px] w-12 shrink-0 rounded-full transition-colors ${availability.useDefault ? "bg-brand" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-[3px] left-[3px] h-5 w-5 rounded-full bg-white transition-transform ${availability.useDefault ? "translate-x-[22px]" : ""}`} />
                </button>
              </div>
              <section className="grid gap-[9px]">
                <h3 className="m-0 text-sm font-medium text-[#4b5563] dark:text-[#9ca3af]">Visiting hours</h3>
                <div className={`grid gap-0 overflow-hidden rounded-[14px] border border-[#e5e7eb] dark:border-white/10 ${availability.useDefault ? "opacity-[0.55]" : ""}`}>
                  {DISPLAY_DAYS.map(({ day, label }, index) => {
                    const entry = availability.week.find((item) => item.day === day);
                    if (!entry) return null;
                    return (
                      <div
                        key={day}
                        className={`box-border grid min-h-14 grid-cols-[48px_52px_minmax(0,1fr)] items-center gap-3 border-b border-[#e5e7eb] bg-white px-3 py-2 text-[13px] text-[#4b5563] last:border-b-0 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-[#9ca3af] max-[700px]:grid-cols-[48px_40px_minmax(0,1fr)] max-[700px]:gap-[5px] max-[700px]:p-2 max-[700px]:text-[11px] ${index === DISPLAY_DAYS.length - 1 ? "border-b-0" : ""}`}
                      >
                        <button
                          type="button"
                          role="switch"
                          aria-checked={entry.enabled}
                          aria-label={`${label} visits`}
                          disabled={availability.useDefault}
                          onClick={() => updateDay(day, { enabled: !entry.enabled })}
                          className={`relative h-[27px] w-12 rounded-full p-0 transition-colors ${entry.enabled ? "bg-brand" : "bg-gray-300"} ${availability.useDefault ? "cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <span className={`absolute top-[3px] left-[3px] h-[21px] w-[21px] rounded-full bg-white transition-transform ${entry.enabled ? "translate-x-[21px]" : ""}`} />
                        </button>
                        <span className="font-semibold text-[#111827] dark:text-white">{label}</span>
                        {entry.enabled ? (
                          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-[9px] max-[700px]:gap-[5px]">
                            <input
                              type="time"
                              aria-label={`${label} start`}
                              value={entry.start}
                              disabled={availability.useDefault}
                              onChange={(event) => updateDay(day, { start: event.target.value })}
                              className="box-border min-h-[38px] w-full min-w-0 rounded-[10px] border border-[#e5e7eb] bg-white px-[9px] py-1 text-[#111827] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white max-[700px]:p-1 max-[700px]:text-[10px]"
                            />
                            <span>to</span>
                            <input
                              type="time"
                              aria-label={`${label} end`}
                              value={entry.end}
                              disabled={availability.useDefault}
                              onChange={(event) => updateDay(day, { end: event.target.value })}
                              className="box-border min-h-[38px] w-full min-w-0 rounded-[10px] border border-[#e5e7eb] bg-white px-[9px] py-1 text-[#111827] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white max-[700px]:p-1 max-[700px]:text-[10px]"
                            />
                          </div>
                        ) : <span className="text-[#6b7280] dark:text-[#9ca3af]">No visits</span>}
                      </div>
                    );
                  })}
                </div>
              </section>
              <label className="grid w-full min-w-0 gap-[7px] text-xs font-semibold text-[#4b5563] dark:text-[#9ca3af]">
                <span>Length of each visit</span>
                <CustomDropdown
                  className="w-full"
                  buttonClassName="w-full min-h-[45px] rounded-md border border-[#e5e7eb] bg-white px-[13px] text-left text-xs text-[#111827] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white"
                  placeholder="30 minutes"
                  value={String(availability.slotMinutes)}
                  options={[15, 30, 45, 60].map((minutes) => ({ label: `${minutes} minutes`, value: String(minutes) }))}
                  menuClassName="!border-[#e5e7eb] !bg-white !text-[#111827] dark:!border-white/10 dark:!bg-[#1a1a1a] dark:!text-white"
                  onChange={(value) => setAvailability((current) => current ? { ...current, slotMinutes: Number(value) } : current)}
                />
              </label>
              <section className="grid justify-items-start gap-[11px]">
                <h3 className="m-0 text-sm font-medium text-[#4b5563] dark:text-[#9ca3af]">Days with no visits</h3>
                {splitLines(blackoutText).length > 0 && (
                  <div className="flex flex-wrap gap-[7px]">
                    {splitLines(blackoutText).map((date) => (
                      <span key={date} className="inline-flex items-center gap-1.5 rounded-full bg-[#f3f4f6] px-2 py-[5px] text-[11px] text-[#4b5563] dark:bg-[#232323] dark:text-[#9ca3af]">
                        {date}
                        <button type="button" aria-label={`Remove ${date}`} onClick={() => removeBlackoutDate(date)} className="grid h-[18px] w-[18px] place-items-center rounded-full border-0 bg-transparent p-0 text-inherit">
                          <X size={13} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
                <button
                  type="button"
                  aria-expanded={blackoutPickerOpen}
                  onClick={() => setBlackoutPickerOpen((open) => !open)}
                  className="inline-flex min-h-[38px] items-center gap-2 rounded-md border border-[#e5e7eb] bg-white px-3 text-xs text-[#4b5563] hover:border-brand dark:border-white/10 dark:bg-[#1a1a1a] dark:text-[#9ca3af] dark:hover:border-brand"
                >
                  <CalendarDays size={15} /> Close on certain days
                </button>
                {blackoutPickerOpen && (
                  <div className="flex flex-wrap gap-2">
                    <input type="date" min={localISODate()} value={blackoutDate} onChange={(event) => setBlackoutDate(event.target.value)} aria-label="Choose a blackout date" className="box-border min-h-10 rounded-[9px] border border-[#e5e7eb] bg-[#f3f4f6] px-2.5 py-1.5 text-xs text-[#111827] dark:border-white/10 dark:bg-[#232323] dark:text-white" />
                    <button type="button" disabled={!blackoutDate} onClick={addBlackoutDate} className="min-h-10 rounded-[9px] border border-[#e5e7eb] bg-white px-3.5 text-xs font-semibold text-[#111827] disabled:cursor-not-allowed disabled:opacity-55 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white">Add date</button>
                  </div>
                )}
              </section>
            </div>
            <div className="-mx-5 flex flex-[0_0_auto] justify-end gap-2.5 border-t border-[#e5e7eb] bg-white px-5 py-2.5 pb-[calc(10px+env(safe-area-inset-bottom))] dark:border-white/10 dark:bg-[#1a1a1a] sm:-mx-7 sm:px-7 sm:pb-2.5">
              <button type="button" onClick={onClose} className="min-h-10 min-w-28 rounded-lg border border-[#e5e7eb] bg-white px-[18px] text-[13px] font-semibold text-[#111827] transition-colors hover:border-brand hover:bg-[#f3f4f6] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white dark:hover:border-brand dark:hover:bg-[#232323] max-[700px]:min-w-0 max-[700px]:flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="min-h-10 min-w-28 rounded-lg border border-brand bg-brand px-[18px] text-[13px] font-semibold text-white transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-65 max-[700px]:min-w-0 max-[700px]:flex-1">{saving ? "Saving..." : "Save"}</button>
            </div>
          </form>
        ) : (
          <p className="m-0 rounded-[14px] bg-[#f3f4f6] p-4 text-sm text-[#4b5563] dark:bg-[#232323] dark:text-[#9ca3af]">Visiting hours couldn’t be loaded.</p>
        )}
      </section>
    </div>
  );
};


export default AgentAvailabilityEditor;
