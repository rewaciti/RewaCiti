import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { ArrowRight, Eye, EyeOff, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { Helmet } from "react-helmet-async";
import { agentAPI, agentErrorMessage } from "../services/agentAPI";
import { useAgentAuthStore } from "../store/useAgentAuthStore";
import AgentThemeToggle from "../components/AgentThemeToggle";
import "../styles/AgentPortal.css";

const AgentLoginPage = () => {
  const navigate = useNavigate();
  const setToken = useAgentAuthStore((state) => state.setToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      const { token } = await agentAPI.login(email.trim(), password);
      if (!token) throw new Error("The sign-in response did not include an agent token.");
      setToken(token);
      navigate("/agent", { replace: true });
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't sign you in. Please try again."));
      console.error("Agent login failed:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="agent-auth-page">
      <Helmet>
        <title>Agent sign in | RewaCiti</title>
        <meta name="description" content="Sign in to your RewaCiti agent portal." />
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
          <div className="agent-auth-mark"><KeyRound size={22} /></div>
          <p className="agent-eyebrow">WELCOME BACK</p>
          <h1>Sign in to your portal</h1>
          <p className="agent-auth-intro">Manage your listings, connect with clients, and keep track of your business.</p>

          <form className="agent-auth-form" onSubmit={submit}>
            <label htmlFor="agent-email">Email address</label>
            <input
              id="agent-email"
              autoComplete="email"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />

            <div className="agent-password-label">
              <label htmlFor="agent-password">Password</label>
              <Link to="/agent/forgot-password">Forgot password?</Link>
            </div>
            <div className="agent-password-wrap">
              <input
                id="agent-password"
                autoComplete="current-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
              <button type="button" onClick={() => setShowPassword((value) => !value)} aria-label={showPassword ? "Hide password" : "Show password"}>
                {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
              </button>
            </div>

            <button className="agent-primary-button" type="submit" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"} {!loading && <ArrowRight size={17} />}
            </button>
          </form>

          <p className="agent-auth-footnote">Agent access is provided by your RewaCiti administrator.</p>
        </div>
      </section>
    </main>
  );
};

export default AgentLoginPage;
