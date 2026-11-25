import { useCallback, useEffect, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  MessageSquareText,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { agentAPI, agentErrorMessage, type AgentAttention, type AgentDashboard, type AgentProfile, type AgentStats } from "../../common/services/agentAPI";
import { useAgentAuthStore } from "../../common/store/useAgentAuthStore";
import AgentPortalHeader from "../../common/components/AgentPortalHeader";

const money = (value: number) =>
  `₦${new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(value)}`;

const greeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
};

const plural = (count: number, singular: string, multiple = `${singular}s`) =>
  `${count} ${count === 1 ? singular : multiple}`;

const AgentDashboardPage = () => {
  const token = useAgentAuthStore((state) => state.token);
  const logout = useAgentAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [dashboard, setDashboard] = useState<AgentDashboard | null>(null);
  const [stats, setStats] = useState<AgentStats | null>(null);
  const [attention, setAttention] = useState<AgentAttention | null>(null);
  const [loading, setLoading] = useState(true);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    try {
      const [profile, overview, figures, needsAttention] = await Promise.all([
        agentAPI.getMe(),
        agentAPI.getDashboard(),
        agentAPI.getStats(),
        agentAPI.getAttention(),
      ]);
      setAgent(profile);
      setDashboard(overview);
      setStats(figures);
      setAttention(needsAttention);
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't load your dashboard. Please try again."));
      console.error("Agent dashboard failed to load:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (token) void loadDashboard();
  }, [loadDashboard, token]);

  if (!token) return <Navigate to="/agent/login" replace />;

  const handleLogout = () => {
    logout();
    navigate("/agent/login", { replace: true });
  };

  const displayName = agent?.name?.trim() || "Agent";

  return (
    <div data-agent-scroll className="fixed inset-0 overflow-y-auto overscroll-contain bg-[#d1d5db] font-sans text-[#111827] dark:bg-[#121212] dark:text-white">
      <Helmet>
        <title>Agent dashboard | RewaCiti</title>
        <meta name="description" content="Manage your RewaCiti listings, leads, visits, and earnings." />
      </Helmet>
      <AgentPortalHeader
        name={displayName}
        email={agent?.email}
        payoutCount={attention?.payouts}
        visitCount={attention?.bookings}
        activePage="home"
        onViewProfile={() => navigate("/agent/profile")}
        onLogout={handleLogout}
      />

      <main className="mx-auto w-[min(1280px,calc(100%_-_32px))] pt-9 pb-16 max-[700px]:pt-6 max-sm:pb-24">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <p className="m-0 mb-2 text-[11px] font-semibold tracking-[0.18em] text-[#6b7280] uppercase dark:text-[#9ca3af]">YOUR WORKSPACE</p>
            <h1 className="m-0 font-serif text-[34px] font-semibold tracking-[-0.02em] text-[#111827] leading-[1.15] dark:text-white max-[700px]:text-[26px]">{greeting()}, {displayName.split(" ")[0]}</h1>
            <p className="mt-1.5 mb-0 text-[15px] text-[#4b5563] dark:text-[#9ca3af]">Here’s what needs you today.</p>
          </div>
          <button className="cursor-pointer rounded-full border border-[#e5e7eb] bg-white px-[18px] py-[9px] text-[13px] font-semibold text-[#111827] transition-[background-color,color] duration-150 ease-[ease] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white enabled:hover:bg-[#703bf7] enabled:hover:text-white disabled:cursor-wait disabled:opacity-60" type="button" onClick={() => void loadDashboard()} disabled={loading}>
            {loading ? "Updating..." : "Refresh"}
          </button>
        </div>

        {loading && !dashboard ? (
          <div className="grid grid-cols-4 gap-6 max-[1000px]:grid-cols-2 max-[1000px]:gap-4 max-[430px]:gap-3" aria-label="Loading dashboard">
            {[0, 1, 2, 3].map((item) => <div className="relative flex min-h-[140px] animate-pulse flex-col rounded-3xl border border-[#e5e7eb] bg-[linear-gradient(90deg,#ffffff_20%,#f3f4f6_40%,#ffffff_60%)] bg-[length:200%_100%] p-[22px] text-inherit no-underline transition-[transform,box-shadow] duration-200 ease-[ease] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.1)] dark:border-white/10 dark:bg-[linear-gradient(90deg,#1a1a1a_20%,#232323_40%,#1a1a1a_60%)] max-[430px]:min-h-[120px] max-[430px]:rounded-[20px] max-[430px]:p-4" key={item} />)}
          </div>
        ) : dashboard && stats && attention ? (
          <>
            <section className="grid grid-cols-4 gap-6 max-[1000px]:grid-cols-2 max-[1000px]:gap-4 max-[430px]:gap-3" aria-label="Your key figures">
              <a className="relative flex min-h-[140px] flex-col rounded-3xl border border-[#e5e7eb] bg-white p-[22px] text-inherit no-underline transition-[transform,box-shadow] duration-200 ease-[ease] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.1)] dark:border-white/10 dark:bg-[#1a1a1a] max-[430px]:min-h-[120px] max-[430px]:rounded-[20px] max-[430px]:p-4" id="listings" href="#listings">
                <span className="flex items-center justify-between text-[13px] font-medium text-[#4b5563] dark:text-[#9ca3af]">Live listings <ArrowRight className="text-[#703bf7] dark:text-[#b79bff]" size={15} /></span>
                <span className="mt-2.5 font-serif text-[32px] font-semibold tracking-[-0.02em] text-[#111827] leading-[1.1] dark:text-white max-[430px]:text-[26px]">{dashboard.activeListings}</span>
                <span className="mt-1.5 text-xs text-[#6b7280] dark:text-[#9ca3af]">{stats.listings} in total</span>
                <Building2 className="absolute right-5 bottom-5 text-[#703bf7] opacity-[0.85] dark:text-[#b79bff] max-[430px]:right-3.5 max-[430px]:bottom-[14px]" size={19} />
              </a>
              <Link className="relative flex min-h-[140px] flex-col rounded-3xl border border-[#e5e7eb] bg-white p-[22px] text-inherit no-underline transition-[transform,box-shadow] duration-200 ease-[ease] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.1)] dark:border-white/10 dark:bg-[#1a1a1a] max-[430px]:min-h-[120px] max-[430px]:rounded-[20px] max-[430px]:p-4" id="leads" to="/agent/leads">
                <span className="flex items-center justify-between text-[13px] font-medium text-[#4b5563] dark:text-[#9ca3af]">Open leads <ArrowRight className="text-[#703bf7] dark:text-[#b79bff]" size={15} /></span>
                <span className="mt-2.5 font-serif text-[32px] font-semibold tracking-[-0.02em] text-[#111827] leading-[1.1] dark:text-white max-[430px]:text-[26px]">{stats.openLeads}</span>
                <span className="mt-1.5 text-xs text-[#6b7280] dark:text-[#9ca3af]">{dashboard.newInquiries} new inquiries</span>
                <MessageSquareText className="absolute right-5 bottom-5 text-[#703bf7] opacity-[0.85] dark:text-[#b79bff] max-[430px]:right-3.5 max-[430px]:bottom-[14px]" size={19} />
              </Link>
              <Link className="relative flex min-h-[140px] flex-col rounded-3xl border border-[#e5e7eb] bg-white p-[22px] text-inherit no-underline transition-[transform,box-shadow] duration-200 ease-[ease] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.1)] dark:border-white/10 dark:bg-[#1a1a1a] max-[430px]:min-h-[120px] max-[430px]:rounded-[20px] max-[430px]:p-4" id="visits" to="/agent/visits">
                <span className="flex items-center justify-between text-[13px] font-medium text-[#4b5563] dark:text-[#9ca3af]">Upcoming visits <ArrowRight className="text-[#703bf7] dark:text-[#b79bff]" size={15} /></span>
                <span className="mt-2.5 font-serif text-[32px] font-semibold tracking-[-0.02em] text-[#111827] leading-[1.1] dark:text-white max-[430px]:text-[26px]">{dashboard.upcomingVisits}</span>
                <span className="mt-1.5 text-xs text-[#6b7280] dark:text-[#9ca3af]">Scheduled with clients</span>
                <CalendarClock className="absolute right-5 bottom-5 text-[#703bf7] opacity-[0.85] dark:text-[#b79bff] max-[430px]:right-3.5 max-[430px]:bottom-[14px]" size={19} />
              </Link>
              <Link className="relative flex min-h-[140px] flex-col rounded-3xl border border-[#e5e7eb] bg-white p-[22px] text-inherit no-underline transition-[transform,box-shadow] duration-200 ease-[ease] hover:-translate-y-0.5 hover:shadow-[0_12px_28px_rgba(0,0,0,0.1)] dark:border-white/10 dark:bg-[#1a1a1a] max-[430px]:min-h-[120px] max-[430px]:rounded-[20px] max-[430px]:p-4" id="earnings" to="/agent/earnings">
                <span className="flex items-center justify-between text-[13px] font-medium text-[#4b5563] dark:text-[#9ca3af]">Estimated commission <ArrowRight className="text-[#703bf7] dark:text-[#b79bff]" size={15} /></span>
                <span className="mt-2.5 font-serif text-[32px] font-semibold tracking-[-0.02em] text-[#111827] leading-[1.1] dark:text-white max-[430px]:text-[26px]">{money(stats.estimatedCommission)}</span>
                <span className="mt-1.5 text-xs text-[#6b7280] dark:text-[#9ca3af]">{plural(attention.payouts, "payout")} waiting</span>
                <Wallet className="absolute right-5 bottom-5 text-[#703bf7] opacity-[0.85] dark:text-[#b79bff] max-[430px]:right-3.5 max-[430px]:bottom-[14px]" size={19} />
              </Link>
            </section>

            <section className="mt-6 grid grid-cols-2 gap-6 max-[700px]:grid-cols-1 max-[700px]:gap-4">
              <article className="min-h-[150px] rounded-3xl border border-[#e5e7eb] bg-white p-6 dark:border-white/10 dark:bg-[#1a1a1a]">
                <div className="flex items-center justify-between">
                  <h2 className="m-0 font-serif text-xl font-semibold text-[#111827] dark:text-white">Next visits</h2>
                  <Link to="/agent/visits" className="inline-flex items-center gap-[5px] text-[13px] font-semibold text-[#703bf7] no-underline dark:text-[#b79bff]">All <ArrowRight size={15} /></Link>
                </div>
                <p className="m-0 mt-5 text-sm text-[#4b5563] leading-[1.6] dark:text-[#9ca3af]">{dashboard.upcomingVisits === 0 ? "No upcoming visits." : `${plural(dashboard.upcomingVisits, "visit")} coming up.`}</p>
              </article>
              <article className="min-h-[150px] rounded-3xl border border-[#e5e7eb] bg-white p-6 dark:border-white/10 dark:bg-[#1a1a1a]">
                <div className="flex items-center justify-between">
                  <h2 className="m-0 font-serif text-xl font-semibold text-[#111827] dark:text-white">New leads</h2>
                  <Link to="/agent/leads" className="inline-flex items-center gap-[5px] text-[13px] font-semibold text-[#703bf7] no-underline dark:text-[#b79bff]">All <ArrowRight size={15} /></Link>
                </div>
                <p className="m-0 mt-5 text-sm text-[#4b5563] leading-[1.6] dark:text-[#9ca3af]">{dashboard.newInquiries === 0 ? "You’re all caught up." : `${plural(dashboard.newInquiries, "new inquiry", "new inquiries")} to follow up.`}</p>
              </article>
            </section>
          </>
        ) : (
          <section className="rounded-3xl border border-[#e5e7eb] bg-white px-6 py-10 text-center dark:border-white/10 dark:bg-[#1a1a1a]">
            <h2 className="m-0 font-serif text-[22px]">Your dashboard couldn’t load</h2>
            <p className="mt-2 mb-[22px] text-sm text-[#4b5563] dark:text-[#9ca3af]">Check your connection and try again.</p>
            <button className="inline-flex min-h-12 items-center justify-center gap-[9px] rounded-full border-0 bg-[#703bf7] px-6 text-sm font-semibold text-white transition-colors duration-150 ease-[ease] hover:bg-[#9677df]" type="button" onClick={() => void loadDashboard()}>Try again</button>
          </section>
        )}
      </main>

    </div>
  );
};

export default AgentDashboardPage;
