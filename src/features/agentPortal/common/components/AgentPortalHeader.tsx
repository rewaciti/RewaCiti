import { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router";
import { Building2, CalendarClock, Home, LogOut, Menu, MessageSquareText, UserRound, Wallet, X } from "lucide-react";
import AgentThemeToggle from "./AgentThemeToggle";

interface AgentPortalHeaderProps {
  name: string;
  email?: string;
  payoutCount?: number;
  visitCount?: number;
  activePage: "home" | "listings" | "leads" | "visits" | "earnings" | "profile";
  onViewProfile: () => void;
  onLogout: () => void;
}

const AgentPortalHeader = ({
  name,
  email,
  payoutCount,
  visitCount,
  activePage,
  onViewProfile,
  onLogout,
}: AgentPortalHeaderProps) => {
  const location = useLocation();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);
  const initials = name.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const nav = [
    { label: "Home", href: "/agent", active: activePage === "home", Icon: Home },
    { label: "Listings", href: "/agent/listings", active: activePage === "listings", Icon: Building2 },
    { label: "Enquiries", href: "/agent/leads", active: activePage === "leads", Icon: MessageSquareText },
    { label: "Visits", href: "/agent/visits", active: activePage === "visits", Icon: CalendarClock, badge: visitCount },
    { label: "Earnings", href: "/agent/earnings", active: activePage === "earnings", Icon: Wallet, badge: payoutCount },
  ];

  useEffect(() => {
    setMobileMenuOpen(false);
    setAccountMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!accountMenuOpen) return;
    const closeOnOutsideClick = (event: MouseEvent) => {
      if (!accountMenuRef.current?.contains(event.target as Node)) {
        setAccountMenuOpen(false);
      }
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setAccountMenuOpen(false);
    };
    document.addEventListener("mousedown", closeOnOutsideClick);
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.removeEventListener("mousedown", closeOnOutsideClick);
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [accountMenuOpen]);

  useEffect(() => {
    if (!mobileMenuOpen) return;

    const scrollRoot = document.querySelector<HTMLElement>("[data-agent-scroll]");
    document.body.style.overflow = "hidden";
    if (scrollRoot) scrollRoot.style.overflow = "hidden";
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileMenuOpen(false);
    };
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = "";
      if (scrollRoot) scrollRoot.style.overflow = "";
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileMenuOpen]);

  const viewProfile = () => {
    setAccountMenuOpen(false);
    setMobileMenuOpen(false);
    onViewProfile();
  };

  return (
    <>
      <header className="sticky top-0 z-10 h-16 border-b border-[#b8bec8] bg-white dark:border-white/15 dark:bg-[#1a1a1a] max-[700px]:h-[58px]">
        <div className="mx-auto grid h-full w-[calc(100%-32px)] max-w-7xl grid-cols-[1fr_auto_1fr] items-center max-[1000px]:grid-cols-[1fr_auto] max-[700px]:grid-cols-[auto_1fr_auto]">
          <Link to="/agent" className="inline-flex w-fit items-center gap-[9px] font-serif text-lg font-semibold whitespace-nowrap text-[#111827] no-underline dark:text-white max-[700px]:gap-1.5 max-[700px]:text-[15px]" aria-label="RewaCiti agent home">
            <img src="/Symbol.png" alt="" className="block h-9 w-9 object-contain max-[700px]:h-[30px] max-[700px]:w-[30px]" />
            <span>RewaCiti</span>
          </Link>

          <nav className="flex items-center gap-1 max-[1000px]:hidden" aria-label="Agent portal navigation">
            {nav.map((item, index) => (
              <Link
                key={item.label}
                to={item.href}
                className={`inline-flex min-h-9 items-center gap-[7px] rounded-full px-4 text-sm font-medium no-underline transition-colors duration-150 ease-[ease] max-[700px]:min-h-8 max-[700px]:px-2.5 max-[700px]:text-xs ${item.active ? "bg-brand font-semibold text-white" : "text-[#4b5563] hover:bg-[#9677df] hover:text-white dark:text-[#9ca3af]"} ${index === 1 ? "max-[430px]:hidden" : ""} ${index === 2 || index === 3 ? "max-[700px]:hidden" : ""}`}
                aria-current={item.active ? "page" : undefined}
              >
                {item.label}
                {item.badge ? <span className="inline-grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#ef4444] text-[10px] font-bold text-white">{item.badge}</span> : null}
              </Link>
            ))}
          </nav>

          <div className="flex items-center justify-self-end gap-2.5 max-[1000px]:col-start-2 max-sm:col-start-3">
            <AgentThemeToggle />
            <div ref={accountMenuRef} className="relative max-[1000px]:hidden max-sm:block">
              <button
                type="button"
                className="flex h-[42px] w-[42px] cursor-pointer items-center justify-center rounded-full border-0 bg-brand text-xs font-bold text-white transition-colors duration-150 ease-[ease] hover:bg-[#9677df] [&_svg]:hidden max-[700px]:h-9 max-[700px]:w-9"
                aria-label="Open account menu"
                aria-expanded={accountMenuOpen}
                onClick={() => setAccountMenuOpen((open) => !open)}
              >
                {initials || "A"}
              </button>
              {accountMenuOpen && (
                <div className="absolute right-0 top-[calc(100%+10px)] z-20 w-60 rounded-[20px] border border-[#e5e7eb] bg-white p-2 shadow-[0_16px_40px_rgba(0,0,0,0.14)] dark:border-white/10 dark:bg-[#1a1a1a]">
                  <div className="grid gap-[3px] border-b border-[#e5e7eb] px-3 py-[11px] dark:border-white/10">
                    <strong className="text-[13px]">{name}</strong>
                    <span className="overflow-hidden text-xs text-[#6b7280] text-ellipsis dark:text-[#9ca3af]">{email}</span>
                  </div>
                  <button type="button" onClick={viewProfile} className="mt-1 flex w-full cursor-pointer items-center gap-2.5 rounded-xl border-0 bg-transparent px-3 py-2.5 text-left text-[13px] text-[#111827] transition-colors duration-150 ease-[ease] hover:bg-brand/10 hover:text-brand dark:text-white dark:hover:bg-brand-light/15 dark:hover:text-brand-light">
                    <UserRound size={16} /> View profile
                  </button>
                  <button type="button" onClick={onLogout} className="mt-1 flex w-full cursor-pointer items-center gap-2.5 rounded-xl border-0 bg-transparent px-3 py-2.5 text-left text-[13px] text-[#111827] transition-colors duration-150 ease-[ease] hover:bg-brand/10 hover:text-brand dark:text-white dark:hover:bg-brand-light/15 dark:hover:text-brand-light">
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
            <button
              type="button"
              className="hidden h-10 w-10 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-[#111827] hover:bg-brand/10 hover:text-brand dark:text-white dark:hover:bg-brand-light/15 dark:hover:text-brand-light max-[1000px]:grid max-sm:hidden"
              aria-label={mobileMenuOpen ? "Close menu" : "Open menu"}
              aria-expanded={mobileMenuOpen}
              onClick={() => setMobileMenuOpen((open) => !open)}
            >
              {mobileMenuOpen ? <X size={23} /> : <Menu size={23} />}
            </button>
          </div>
        </div>

        <div
          className={`fixed inset-0 z-40 bg-black/45 transition-opacity duration-200 ease-[ease] ${mobileMenuOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"}`}
          onClick={() => setMobileMenuOpen(false)}
          aria-hidden="true"
        />
        <aside className={`fixed right-0 top-0 z-50 flex h-dvh w-[92%] max-w-[380px] flex-col border-l border-[#e5e7eb] bg-white shadow-[-12px_0_36px_rgba(0,0,0,0.12)] transition-[transform,visibility] duration-260 ease-[cubic-bezier(0.32,0.72,0,1)] dark:border-white/10 dark:bg-[#1a1a1a] ${mobileMenuOpen ? "visible translate-x-0" : "invisible translate-x-full"}`} aria-hidden={!mobileMenuOpen}>
          <div className="flex min-h-[72px] items-center justify-between gap-3 border-b border-[#e5e7eb] px-[18px] py-3 dark:border-white/10">
            <div className="grid min-w-0 flex-1 gap-[3px] border-0 px-3 py-[11px]">
              <strong className="text-[13px]">{name}</strong>
              <span className="overflow-hidden text-xs text-[#6b7280] text-ellipsis dark:text-[#9ca3af]">{email}</span>
            </div>
            <button type="button" aria-label="Close menu" onClick={() => setMobileMenuOpen(false)} className="grid h-10 w-10 shrink-0 place-items-center rounded-full border-0 bg-[#f3f4f6] text-[#111827] dark:bg-[#232323] dark:text-white">
              <X size={21} />
            </button>
          </div>
          <nav className="flex flex-1 flex-col gap-1 overflow-y-auto p-4" aria-label="Agent portal mobile navigation">
            {nav.map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={`flex min-h-[50px] items-center justify-between gap-2.5 rounded-[14px] border-0 bg-transparent px-4 text-left text-base text-[#111827] no-underline hover:bg-brand/10 dark:text-white dark:hover:bg-brand-light/15 ${item.active ? "bg-brand/10 font-semibold text-brand dark:bg-brand-light/15 dark:text-brand-light" : ""}`}
                aria-current={item.active ? "page" : undefined}
              >
                {item.label}
                {item.badge ? <span className="inline-grid h-[18px] min-w-[18px] place-items-center rounded-full bg-[#ef4444] text-[10px] font-bold text-white">{item.badge}</span> : null}
              </Link>
            ))}
            <button type="button" className="flex min-h-[50px] cursor-pointer items-center justify-start gap-2.5 rounded-[14px] border-0 bg-transparent px-4 text-left text-base text-[#111827] no-underline hover:bg-brand/10 dark:text-white dark:hover:bg-brand-light/15" onClick={viewProfile}>
              <UserRound size={18} /> View profile
            </button>
            <button type="button" className="flex min-h-[50px] cursor-pointer items-center justify-start gap-2.5 rounded-[14px] border-0 bg-transparent px-4 text-left text-base text-[#ef4444] no-underline hover:bg-brand/10 dark:hover:bg-brand-light/15" onClick={onLogout}>
              <LogOut size={18} /> Sign out
            </button>
          </nav>
        </aside>
      </header>

      <nav
        className="fixed inset-x-0 bottom-0 z-20 hidden grid-cols-5 border-t border-[#b8bec8] bg-white pt-1.5 pb-[max(6px,env(safe-area-inset-bottom))] dark:border-white/15 dark:bg-[#1a1a1a] max-sm:grid"
        aria-label="Agent portal mobile navigation"
      >
        {nav.map(({ label, href, active, Icon, badge }) => (
          <Link
            key={label}
            to={href}
            aria-current={active ? "page" : undefined}
            className={`relative flex flex-col items-center justify-center gap-0.5 py-1 text-[11px] no-underline transition-colors ${active
              ? "font-semibold text-brand dark:text-brand-light"
              : "font-medium text-[#4b5563] hover:text-[#111827] dark:text-[#9ca3af] dark:hover:text-white"}`}
          >
            <span className="relative inline-flex">
              <Icon size={20} strokeWidth={active ? 2.25 : 1.75} aria-hidden="true" />
              {badge ? (
                <span className="absolute -top-1.5 -right-2 inline-grid h-4 min-w-4 place-items-center rounded-full bg-[#ef4444] px-1 text-[10px] leading-none font-bold text-white">
                  {badge}
                </span>
              ) : null}
            </span>
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </>
  );
};

export default AgentPortalHeader;
