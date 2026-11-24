import { useState } from "react";
import { Link } from "react-router";
import { ArrowLeft, ArrowRight, MailCheck } from "lucide-react";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { agentAPI, agentErrorMessage } from "../services/agentAPI";
import AgentThemeToggle from "../components/AgentThemeToggle";
import "../styles/AgentPortal.css";

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
    <main className="agent-auth-page">
      <Helmet>
        <title>Reset agent password | RewaCiti</title>
        <meta name="description" content="Request a password reset link for your RewaCiti agent account." />
      </Helmet>
      <header className="agent-topbar">
        <div className="agent-topbar-inner">
          <Link to="/agent/login" className="agent-brand" aria-label="RewaCiti agent portal">
            <img src="/Symbol.png" alt="" />
            <span>RewaCiti</span>
          </Link>
          <div className="agent-auth-header-actions">
            <AgentThemeToggle />
            <Link className="agent-back-link" to="/">Visit RewaCiti <ArrowRight size={15} /></Link>
          </div>
        </div>
      </header>

      <section className="agent-auth-content">
        <div className="agent-auth-card">
          <div className="agent-auth-mark"><MailCheck size={22} /></div>
          <p className="agent-eyebrow">ACCOUNT RECOVERY</p>
          <h1>{sent ? "Check your inbox" : "Forgot your password?"}</h1>
          <p className="agent-auth-intro">
            {sent
              ? "If that email belongs to an agent, we’ve sent a link to choose a new password."
              : "Enter the email address linked to your agent account and we’ll send you a reset link."}
          </p>

          {!sent && (
            <form className="agent-auth-form" onSubmit={submit}>
              <label htmlFor="recovery-email">Email address</label>
              <input
                id="recovery-email"
                autoComplete="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
              <button className="agent-primary-button" type="submit" disabled={loading}>
                {loading ? "Sending link..." : "Send password link"} {!loading && <ArrowRight size={17} />}
              </button>
            </form>
          )}

          <Link className="agent-return-link" to="/agent/login"><ArrowLeft size={16} /> Back to sign in</Link>
        </div>
      </section>
    </main>
  );
};

export default AgentForgotPasswordPage;
