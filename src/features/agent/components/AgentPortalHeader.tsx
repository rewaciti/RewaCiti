import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router";
import { ClipboardList, LogOut, Menu, X } from "lucide-react";
import AgentThemeToggle from "./AgentThemeToggle";

interface AgentPortalHeaderProps {
  name: string;
  email?: string;
  payoutCount?: number;
  activePage: "home" | "listings";
  onEditProfile: () => void;
  onLogout: () => void;
}

const AgentPortalHeader = ({
  name,
  email,
  payoutCount,
  activePage,
  onEditProfile,
  onLogout,
}: AgentPortalHeaderProps) => {
  const location = useLocation();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const nav = [
    { label: "Home", href: "/agent", active: activePage === "home" },
    { label: "Listings", href: "/agent/listings", active: activePage === "listings" },
    { label: "Leads", href: "/agent#leads", active: false },
    { label: "Visits", href: "/agent#visits", active: false },
    { label: "Earnings", href: "/agent#earnings", active: false, badge: payoutCount },
  ];

  useEffect(() => {
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    document.body.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenuOpen]);

  const editProfile = () => {
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
    onEditProfile();
  };

  return (
    <header className="agent-topbar">
      <div className="agent-topbar-inner">
        <Link to="/agent" className="agent-brand" aria-label="RewaCiti agent home">
          <img src="/Symbol.png" alt="" />
          <span>RewaCiti</span>
        </Link>

        <nav className="agent-nav" aria-label="Agent portal navigation">
          {nav.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={`agent-nav-link${item.active ? " is-active" : ""}`}
              aria-current={item.active ? "page" : undefined}
            >
              {item.label}
              {item.badge ? <span className="agent-nav-badge">{item.badge}</span> : null}
            </Link>
          ))}
        </nav>

        <div className="agent-header-actions">
          <AgentThemeToggle />
          <div className="agent-user-menu">
            <button
              type="button"
              className="agent-avatar"
              aria-label="Open account menu"
              aria-expanded={accountMenuOpen}
              onClick={() => setAccountMenuOpen((open) => !open)}
            >
              {initials || "A"}
            </button>
            {accountMenuOpen && (
              <div className="agent-dropdown">
                <div className="agent-dropdown-person">
                  <strong>{name}</strong>
                  <span>{email}</span>
                </div>
                <button type="button" onClick={editProfile}>
                  <ClipboardList size={16} /> Edit profile
                </button>
                <button type="button" onClick={onLogout}>
                  <LogOut size={16} /> Sign out
                </button>
              </div>
            )}
          </div>
          <button
            type="button"
            className="agent-mobile-menu-button"
            aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
            aria-expanded={mobileMenuOpen}
            onClick={() => setMobileMenuOpen((open) => !open)}
          >
            {mobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
          </button>
        </div>
      </div>

      <div
        className={`agent-mobile-menu-backdrop${mobileMenuOpen ? " is-open" : ""}`}
        onClick={() => setMobileMenuOpen(false)}
        aria-hidden="true"
      />
      <aside className={`agent-mobile-menu${mobileMenuOpen ? " is-open" : ""}`} aria-hidden={!mobileMenuOpen}>
        <div className="agent-mobile-menu-heading">
          <div className="agent-dropdown-person">
            <strong>{name}</strong>
            <span>{email}</span>
          </div>
          <button type="button" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)}>
            <X size={21} />
          </button>
        </div>
        <nav className="agent-mobile-nav" aria-label="Agent portal mobile navigation">
          {nav.map((item) => (
            <Link
              key={item.label}
              to={item.href}
              className={`agent-mobile-nav-link${item.active ? " is-active" : ""}`}
              aria-current={item.active ? "page" : undefined}
            >
              {item.label}
              {item.badge ? <span className="agent-nav-badge">{item.badge}</span> : null}
            </Link>
          ))}
          <button type="button" className="agent-mobile-action" onClick={editProfile}>
            <ClipboardList size={18} /> Edit profile
          </button>
          <button type="button" className="agent-mobile-action agent-mobile-signout" onClick={onLogout}>
            <LogOut size={18} /> Sign out
          </button>
        </nav>
      </aside>
    </header>
  );
};

export default AgentPortalHeader;
