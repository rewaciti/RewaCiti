import { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router";
import {
  ArrowRight,
  Building2,
  CalendarClock,
  MessageSquareText,
  Wallet,
} from "lucide-react";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { agentAPI, agentErrorMessage, type AgentAttention, type AgentDashboard, type AgentProfile, type AgentStats } from "../services/agentAPI";
import { useAgentAuthStore } from "../store/useAgentAuthStore";
import AgentPortalHeader from "../components/AgentPortalHeader";
import AgentProfileModal from "../components/AgentProfileModal";
import "../styles/AgentPortal.css";

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
  const [profileOpen, setProfileOpen] = useState(false);

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
    <div className="agent-portal">
      <Helmet>
        <title>Agent dashboard | RewaCiti</title>
        <meta name="description" content="Manage your RewaCiti listings, leads, visits, and earnings." />
      </Helmet>
      <AgentPortalHeader
        name={displayName}
        email={agent?.email}
        payoutCount={attention?.payouts}
        activePage="home"
        onEditProfile={() => setProfileOpen(true)}
        onLogout={handleLogout}
      />

      <main className="agent-dashboard">
        <div className="agent-heading-row">
          <div>
            <p className="agent-eyebrow">YOUR WORKSPACE</p>
            <h1>{greeting()}, {displayName.split(" ")[0]}</h1>
            <p className="agent-subtitle">Here’s what needs you today.</p>
          </div>
          <button className="agent-refresh-button" type="button" onClick={() => void loadDashboard()} disabled={loading}>
            {loading ? "Updating..." : "Refresh"}
          </button>
        </div>

        {loading && !dashboard ? (
          <div className="agent-stat-grid" aria-label="Loading dashboard">
            {[0, 1, 2, 3].map((item) => <div className="agent-stat-card agent-skeleton" key={item} />)}
          </div>
        ) : dashboard && stats && attention ? (
          <>
            <section className="agent-stat-grid" aria-label="Your key figures">
              <a className="agent-stat-card" id="listings" href="#listings">
                <span className="agent-stat-label">Live listings <ArrowRight size={15} /></span>
                <span className="agent-stat-value">{dashboard.activeListings}</span>
                <span className="agent-stat-foot">{stats.listings} in total</span>
                <Building2 className="agent-stat-icon" size={19} />
              </a>
              <a className="agent-stat-card" id="leads" href="#leads">
                <span className="agent-stat-label">Open leads <ArrowRight size={15} /></span>
                <span className="agent-stat-value">{stats.openLeads}</span>
                <span className="agent-stat-foot">{dashboard.newInquiries} new inquiries</span>
                <MessageSquareText className="agent-stat-icon" size={19} />
              </a>
              <a className="agent-stat-card" id="visits" href="#visits">
                <span className="agent-stat-label">Upcoming visits <ArrowRight size={15} /></span>
                <span className="agent-stat-value">{dashboard.upcomingVisits}</span>
                <span className="agent-stat-foot">Scheduled with clients</span>
                <CalendarClock className="agent-stat-icon" size={19} />
              </a>
              <a className="agent-stat-card" id="earnings" href="#earnings">
                <span className="agent-stat-label">Estimated commission <ArrowRight size={15} /></span>
                <span className="agent-stat-value">{money(stats.estimatedCommission)}</span>
                <span className="agent-stat-foot">{plural(attention.payouts, "payout")} waiting</span>
                <Wallet className="agent-stat-icon" size={19} />
              </a>
            </section>

            <section className="agent-dashboard-panels">
              <article className="agent-panel">
                <div className="agent-panel-heading">
                  <h2>Next visits</h2>
                  <a href="#visits">All <ArrowRight size={15} /></a>
                </div>
                <p>{dashboard.upcomingVisits === 0 ? "No upcoming visits." : `${plural(dashboard.upcomingVisits, "visit")} coming up.`}</p>
              </article>
              <article className="agent-panel">
                <div className="agent-panel-heading">
                  <h2>New leads</h2>
                  <a href="#leads">All <ArrowRight size={15} /></a>
                </div>
                <p>{dashboard.newInquiries === 0 ? "You’re all caught up." : `${plural(dashboard.newInquiries, "new inquiry", "new inquiries")} to follow up.`}</p>
              </article>
            </section>
          </>
        ) : (
          <section className="agent-load-error">
            <h2>Your dashboard couldn’t load</h2>
            <p>Check your connection and try again.</p>
            <button className="agent-primary-button" type="button" onClick={() => void loadDashboard()}>Try again</button>
          </section>
        )}
      </main>

      {profileOpen && agent && (
        <AgentProfileModal
          agent={agent}
          onClose={() => setProfileOpen(false)}
          onSaved={(updatedAgent) => setAgent(updatedAgent)}
        />
      )}
    </div>
  );
};

export default AgentDashboardPage;
