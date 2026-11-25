import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, ArrowRight, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { agentAPI, agentErrorMessage } from "../../common/services/agentAPI";
import AgentThemeToggle from "../../common/components/AgentThemeToggle";

const AgentForgotPasswordPage = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      const response = await agentAPI.forgotPassword(email.trim());
      setSent(true);
      toast.success(response.message);
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't send the password link. Please try again."));
      console.error("Agent password recovery failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="fixed inset-0 flex flex-col overflow-y-auto overscroll-contain bg-[#d1d5db] text-[#111827] dark:bg-[#121212] dark:text-white">
      <Helmet>
        <title>Reset agent password | RewaCiti</title>
        <meta name="description" content="Request a password reset link for your RewaCiti agent account." />
      </Helmet>
      <header className="sticky top-0 z-10 h-16 border-b border-[#b8bec8] bg-white dark:border-white/15 dark:bg-[#1a1a1a] max-[700px]:h-[58px]">
        <div className="mx-auto grid h-full w-[calc(100%-32px)] max-w-[1280px] grid-cols-[1fr_auto_1fr] items-center max-[1000px]:grid-cols-[1fr_auto] max-[700px]:grid-cols-[auto_1fr_auto]">
          <Link to="/agent/login" className="inline-flex w-fit items-center gap-[9px] font-serif text-lg font-semibold whitespace-nowrap text-[#111827] no-underline dark:text-white max-[700px]:gap-1.5 max-[700px]:text-[15px]" aria-label="RewaCiti agent portal">
            <img src="/Symbol.png" alt="" className="block h-9 w-9 object-contain max-[700px]:h-[30px] max-[700px]:w-[30px]" />
            <span>RewaCiti</span>
          </Link>
          <div className="col-start-3 flex items-center justify-self-end gap-2.5 max-[1000px]:col-start-2">
            <AgentThemeToggle />
            <Link className="inline-flex items-center gap-2 text-[13px] font-medium text-[#4b5563] no-underline transition-colors duration-150 ease-[ease] hover:text-brand dark:text-[#9ca3af] dark:hover:text-brand-light" to="/">Visit RewaCiti <ArrowRight size={15} /></Link>
          </div>
        </div>
      </header>

      <section className="mx-auto flex w-[calc(100%-32px)] max-w-[440px] flex-1 flex-col justify-center py-10 pb-14">
        <div className="rounded-3xl border border-[#e5e7eb] bg-white px-7 py-8 text-[#111827] shadow-[0_12px_40px_rgba(0,0,0,0.08)] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white max-[430px]:px-5 max-[430px]:py-6">
          <div className="mb-[18px] grid h-[46px] w-[46px] place-items-center rounded-2xl bg-brand/10 text-brand dark:bg-brand-light/15 dark:text-brand-light"><MailCheck size={22} /></div>
          <p className="mb-2 text-[11px] font-semibold tracking-[0.18em] text-[#6b7280] uppercase dark:text-[#9ca3af]">ACCOUNT RECOVERY</p>
          <h1 className="m-0 font-serif text-[30px] font-semibold leading-[1.15] tracking-[-0.02em] text-[#111827] dark:text-white max-[430px]:text-[26px]">{sent ? "Check your inbox" : "Forgot your password?"}</h1>
          <p className="mt-2 mb-[26px] text-sm leading-[1.6] text-[#4b5563] dark:text-[#9ca3af]">
            {sent
              ? "If that email belongs to an agent, we’ve sent a link to choose a new password."
              : "Enter the email address linked to your agent account and we’ll send you a reset link."}
          </p>

          {!sent && (
            <form className="flex flex-col gap-2" onSubmit={submit}>
              <label htmlFor="recovery-email" className="text-[11px] font-semibold tracking-[0.08em] text-[#6b7280] uppercase dark:text-[#9ca3af]">Email address</label>
              <input
                id="recovery-email"
                autoComplete="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full min-h-12 rounded-[14px] border border-[#e5e7eb] bg-[#f3f4f6] px-4 text-sm text-[#111827] outline-none transition-[border-color,box-shadow] duration-150 ease-[ease] placeholder:text-[#9ca3af] focus:border-brand focus:shadow-[0_0_0_3px_rgba(112,59,247,0.18)] dark:border-white/10 dark:bg-[#232323] dark:text-white"
              />
              <button className="mt-3.5 inline-flex min-h-12 w-full cursor-pointer items-center justify-center gap-[9px] rounded-full border-0 bg-brand px-6 text-sm font-semibold text-white transition-colors duration-150 ease-[ease] hover:bg-[#9677df] disabled:cursor-wait disabled:opacity-65" type="submit" disabled={loading}>
                {loading ? "Sending link..." : "Send password link"} {!loading && <ArrowRight size={17} />}
              </button>
            </form>
          )}

          <Link className="mt-[22px] inline-flex items-center gap-2 text-[13px] font-medium text-[#4b5563] no-underline transition-colors duration-150 ease-[ease] hover:text-brand dark:text-[#9ca3af] dark:hover:text-brand-light" to="/agent/login"><ArrowLeft size={16} /> Back to sign in</Link>
        </div>
      </section>
    </main>
  );
};

export default AgentForgotPasswordPage;
