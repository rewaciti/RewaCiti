import { useState } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { agentAPI, agentErrorMessage, type AgentProfile } from "../services/agentAPI";

interface AgentProfileModalProps {
  agent: AgentProfile;
  onClose: () => void;
  onSaved: (agent: AgentProfile) => void;
}

const AgentProfileModal = ({ agent, onClose, onSaved }: AgentProfileModalProps) => {
  const [bio, setBio] = useState(agent.bio ?? "");
  const [saving, setSaving] = useState(false);

  const save = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    try {
      const response = await agentAPI.updateMe(bio.trim());
      onSaved(response.data);
      toast.success(response.message);
      onClose();
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't save your profile. Please try again."));
      console.error("Agent profile update failed:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-20 grid place-items-center bg-black/50 p-5 backdrop-blur-sm" role="presentation" onMouseDown={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <section className="w-full max-w-[480px] rounded-3xl border border-border bg-(--surface) p-7 text-(--text) shadow-2xl" role="dialog" aria-modal="true" aria-labelledby="agent-profile-title">
        <div className="mb-5 flex items-start justify-between">
          <div><p className="mb-1 text-[10px] font-semibold tracking-[0.16em] text-muted">YOUR ACCOUNT</p><h2 id="agent-profile-title" className="m-0 font-serif text-2xl font-semibold">Agent profile</h2></div>
          <button type="button" className="grid h-[34px] w-[34px] place-items-center rounded-full bg-(--surface-soft) text-[22px] leading-none text-muted hover:bg-primary hover:text-white" aria-label="Close profile" onClick={onClose}>×</button>
        </div>
        <div className="my-[18px] grid gap-[5px] rounded-2xl border border-border bg-(--surface-soft) px-4 py-3.5 text-sm text-muted">
          <span>{agent.name}</span><span>{agent.email}</span><span>{agent.phone}</span>
        </div>
        <form className="grid gap-3 text-sm text-(--text)" onSubmit={save}>
          <label htmlFor="agent-bio" className="font-semibold">About you</label>
          <textarea id="agent-bio" className="min-h-[110px] resize-y rounded-xl border border-border bg-(--surface-soft) p-3 text-(--text) outline-none placeholder:text-(--faint) focus:border-primary focus:ring-2 focus:ring-(--primary-soft)" rows={4} maxLength={1000} value={bio} onChange={(event) => setBio(event.target.value)} placeholder="Share your experience, areas, and availability." />
          <button className="mt-1 inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-primary px-5 text-sm font-semibold text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-55" type="submit" disabled={saving}>
            {saving ? "Saving..." : "Save profile"} {!saving && <ArrowRight size={17} />}
          </button>
        </form>
      </section>
    </div>
  );
};

export default AgentProfileModal;
