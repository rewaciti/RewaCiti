import { useEffect, useState } from "react";
import * as React from "react";
import { CalendarDays, X } from "lucide-react";
import { toast } from "sonner";
import CustomDropdown from "../../properties/components/CustomDropdown";
import { agentAPI, agentErrorMessage, type AgentProperty, type AgentPropertyAvailability } from "../services/agentAPI";
import { localISODate, splitLines } from "../utils/agentListingUtils";

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
      className="fixed inset-0 z-30 grid place-items-center overflow-y-auto bg-black/55 p-6 max-[700px]:p-0"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="flex h-[min(88vh,900px)] max-h-[min(88vh,900px)] w-full max-w-[680px] flex-col overflow-hidden rounded-3xl border border-border bg-(--surface) p-7 text-(--text) shadow-2xl max-[700px]:h-[94dvh] max-[700px]:max-h-[94dvh] max-[700px]:rounded-[20px] max-[700px]:p-5"
        role="dialog"
        aria-modal="true"
        aria-labelledby="agent-availability-title"
      >
        <div className="mb-5 flex flex-[0_0_auto] items-start justify-between gap-4">
          <div>
            <h2 id="agent-availability-title" className="m-0 font-serif text-[26px] font-semibold leading-tight text-(--text)">Visiting hours</h2>
            <p className="mt-[5px] mb-0 text-[13px] text-muted">{property.title}</p>
          </div>
          <button
            type="button"
            aria-label="Close visiting hours"
            onClick={onClose}
            className="grid h-[38px] w-[38px] shrink-0 place-items-center rounded-[10px] border border-border bg-(--surface) p-0 text-muted transition-colors hover:border-primary hover:bg-(--surface-soft) hover:text-(--text)"
          >
            <X size={19} />
          </button>
        </div>
        {loading ? (
          <p className="my-4 text-sm text-muted">Loading visiting hours…</p>
        ) : availability ? (
          <form onSubmit={save} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="grid min-h-0 flex-1 gap-[17px] overflow-y-auto py-0 pr-0.5 pb-[18px]">
              <div className="box-border flex w-full items-center justify-between gap-3 rounded-[10px] border border-border px-3.5 py-3 text-[13px] font-semibold text-(--text)">
                <span>Use RewaCiti’s usual hours</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={availability.useDefault}
                  aria-label="Use RewaCiti’s usual hours"
                  onClick={() => setAvailability((current) => current ? { ...current, useDefault: !current.useDefault } : current)}
                  className={`relative h-[26px] w-12 shrink-0 rounded-full transition-colors ${availability.useDefault ? "bg-primary" : "bg-gray-300"}`}
                >
                  <span className={`absolute top-[3px] left-[3px] h-5 w-5 rounded-full bg-white transition-transform ${availability.useDefault ? "translate-x-[22px]" : ""}`} />
                </button>
              </div>
              <section className="grid gap-[9px]">
                <h3 className="m-0 text-sm font-medium text-muted">Visiting hours</h3>
                <div className={`grid gap-0 overflow-hidden rounded-[14px] border border-border ${availability.useDefault ? "opacity-[0.55]" : ""}`}>
                  {DISPLAY_DAYS.map(({ day, label }, index) => {
                    const entry = availability.week.find((item) => item.day === day);
                    if (!entry) return null;
                    return (
                      <div
                        key={day}
                        className={`box-border grid min-h-14 grid-cols-[48px_52px_minmax(0,1fr)] items-center gap-3 border-b border-border bg-(--surface) px-3 py-2 text-[13px] text-muted last:border-b-0 max-[700px]:grid-cols-[48px_40px_minmax(0,1fr)] max-[700px]:gap-[5px] max-[700px]:p-2 max-[700px]:text-[11px] ${index === DISPLAY_DAYS.length - 1 ? "border-b-0" : ""}`}
                      >
                        <button
                          type="button"
                          role="switch"
                          aria-checked={entry.enabled}
                          aria-label={`${label} visits`}
                          disabled={availability.useDefault}
                          onClick={() => updateDay(day, { enabled: !entry.enabled })}
                          className={`relative h-[27px] w-12 rounded-full p-0 transition-colors ${entry.enabled ? "bg-primary" : "bg-gray-300"} ${availability.useDefault ? "cursor-not-allowed" : "cursor-pointer"}`}
                        >
                          <span className={`absolute top-[3px] left-[3px] h-[21px] w-[21px] rounded-full bg-white transition-transform ${entry.enabled ? "translate-x-[21px]" : ""}`} />
                        </button>
                        <span className="font-semibold text-(--text)">{label}</span>
                        {entry.enabled ? (
                          <div className="grid grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] items-center gap-[9px] max-[700px]:gap-[5px]">
                            <input
                              type="time"
                              aria-label={`${label} start`}
                              value={entry.start}
                              disabled={availability.useDefault}
                              onChange={(event) => updateDay(day, { start: event.target.value })}
                              className="box-border min-h-[38px] w-full min-w-0 rounded-[10px] border border-border bg-(--surface) px-[9px] py-1 text-(--text) max-[700px]:p-1 max-[700px]:text-[10px]"
                            />
                            <span>to</span>
                            <input
                              type="time"
                              aria-label={`${label} end`}
                              value={entry.end}
                              disabled={availability.useDefault}
                              onChange={(event) => updateDay(day, { end: event.target.value })}
                              className="box-border min-h-[38px] w-full min-w-0 rounded-[10px] border border-border bg-(--surface) px-[9px] py-1 text-(--text) max-[700px]:p-1 max-[700px]:text-[10px]"
                            />
                          </div>
                        ) : <span className="text-(--faint)">No visits</span>}
                      </div>
                    );
                  })}
                </div>
              </section>
              <label className="grid w-full min-w-0 gap-[7px] text-xs font-semibold text-muted">
                <span>Length of each visit</span>
                <CustomDropdown
                  className="w-full"
                  buttonClassName="w-full min-h-[45px] rounded-md border border-border bg-(--surface) px-[13px] text-left text-xs text-(--text)"
                  placeholder="30 minutes"
                  value={String(availability.slotMinutes)}
                  options={[15, 30, 45, 60].map((minutes) => ({ label: `${minutes} minutes`, value: String(minutes) }))}
                  menuClassName="!border-border !bg-(--surface) !text-(--text)"
                  onChange={(value) => setAvailability((current) => current ? { ...current, slotMinutes: Number(value) } : current)}
                />
              </label>
              <section className="grid justify-items-start gap-[11px]">
                <h3 className="m-0 text-sm font-medium text-muted">Days with no visits</h3>
                {splitLines(blackoutText).length > 0 && (
                  <div className="flex flex-wrap gap-[7px]">
                    {splitLines(blackoutText).map((date) => (
                      <span key={date} className="inline-flex items-center gap-1.5 rounded-full bg-(--surface-soft) px-2 py-[5px] text-[11px] text-muted">
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
                  className="inline-flex min-h-[38px] items-center gap-2 rounded-md border border-border bg-(--surface) px-3 text-xs text-muted hover:border-primary"
                >
                  <CalendarDays size={15} /> Close on certain days
                </button>
                {blackoutPickerOpen && (
                  <div className="flex flex-wrap gap-2">
                    <input type="date" min={localISODate()} value={blackoutDate} onChange={(event) => setBlackoutDate(event.target.value)} aria-label="Choose a blackout date" className="box-border min-h-10 rounded-[9px] border border-border bg-(--surface-soft) px-2.5 py-1.5 text-xs text-(--text)" />
                    <button type="button" disabled={!blackoutDate} onClick={addBlackoutDate} className="min-h-10 rounded-[9px] border border-border bg-(--surface) px-3.5 text-xs font-semibold text-(--text) disabled:cursor-not-allowed disabled:opacity-55">Add date</button>
                  </div>
                )}
              </section>
            </div>
            <div className="flex flex-[0_0_auto] justify-end gap-2.5 border-t border-border bg-(--surface) px-7 py-2.5 -mx-7 max-[700px]:-mx-5 max-[700px]:px-5 max-[700px]:pb-[calc(10px+env(safe-area-inset-bottom))]">
              <button type="button" onClick={onClose} className="min-h-10 min-w-28 rounded-lg border border-border bg-(--surface) px-[18px] text-[13px] font-semibold text-(--text) transition-colors hover:border-primary hover:bg-(--surface-soft) max-[700px]:min-w-0 max-[700px]:flex-1">Cancel</button>
              <button type="submit" disabled={saving} className="min-h-10 min-w-28 rounded-lg border border-primary bg-primary px-[18px] text-[13px] font-semibold text-white transition-colors hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-65 max-[700px]:min-w-0 max-[700px]:flex-1">{saving ? "Saving..." : "Save"}</button>
            </div>
          </form>
        ) : (
          <p className="m-0 rounded-[14px] bg-(--surface-soft) p-4 text-sm text-muted">Visiting hours couldn’t be loaded.</p>
        )}
      </section>
    </div>
  );
};


export default AgentAvailabilityEditor;
