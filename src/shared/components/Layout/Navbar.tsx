import { NavLink, useNavigate, useLocation } from "react-router";
import logo from "/Symbol.png";
import { useState, useEffect } from "react";
import { useThemeStore } from "../../store/useThemeStore";
import { FiSun, FiMoon, FiHeart, FiLogOut, FiUser, FiX, FiMenu } from "react-icons/fi";
import { usePropertyStore } from "../../../features/properties/store/usePropertyStore";
import { useAuthStore } from "../../../features/auth/store/useAuthStore";
import { toast } from "sonner";

// Same container as every page, so the logo lines up with the content.
const PAGE_CONTAINER = "mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-10";

// Same serif as the rest of the site (Fraunces is loaded in index.html)
const SERIF = { fontFamily: '"Fraunces", "Playfair Display", Georgia, serif' };

const ICON_BTN =
  "relative flex h-10 w-10 cursor-pointer items-center justify-center rounded-full text-gray-800 transition hover:bg-[#9677df] hover:text-white dark:text-white";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { theme, toggleTheme } = useThemeStore();
  const savedPropertyCount = usePropertyStore((state) => state.shortlistedProperties.length);
  const { isAuthenticated, customer, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const checkActive = (path: string) => {
    const currentPath = location.pathname.toLowerCase();
    const targetPath = path.toLowerCase();

    if (targetPath === "/properties") {
      return (
        currentPath === "/properties" ||
        currentPath.startsWith("/properties/") ||
        currentPath === "/studentarea"
      );
    }

    return currentPath === targetPath;
  };

  const profileInitials = (() => {
    const firstName = customer?.firstName?.trim();
    const lastName = customer?.lastName?.trim();
    const email = customer?.email?.trim();

    if (firstName && lastName) {
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    }

    if (firstName) {
      return firstName.slice(0, 2).toUpperCase();
    }

    if (email) {
      return email.slice(0, 2).toUpperCase();
    }

    return "U";
  })();

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Properties", path: "/properties" },
    { name: "Services", path: "/Service" },
    { name: "Contact", path: "/Contact" },
  ];

  const accountPath = isAuthenticated ? "/auth/profile" : "/auth/login";

  // Lock body scroll while the mobile menu is open
  useEffect(() => {
    document.body.style.overflow = isOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Escape closes the menu
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Close the mobile menu if the screen grows to the desktop layout
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e: MediaQueryListEvent) => {
      if (e.matches) setIsOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Close the menu on navigation
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate("/");
    toast.success("Logged out successfully");
  };

  return (
    <>
      {/* TOP SMALL BAR: lives in normal flow, scrolls away with the page */}
      <div
        className="w-full bg-gray-400 text-gray-900 dark:bg-[#1A1A1A] dark:text-white"
        style={{
          backgroundImage: "url('/logo/Abstract Design.png')",
          backgroundPosition: "center",
        }}
      >
        <div className={`${PAGE_CONTAINER} grid h-10 grid-cols-[1fr_auto_1fr] items-center`}>
          <div aria-hidden="true" />
          <div className="flex items-center justify-center text-sm">
            <p className="mr-1 flex items-center">✨ Find your dream property</p>
            <NavLink
              to="/blog"
              aria-label="View blog page"
              className="hidden font-semibold underline underline-offset-2 sm:block"
            >
              View Blog
            </NavLink>
          </div>

          <div className="flex items-center justify-self-end gap-2">
            {/* Saved properties: opens the Saved tab on the account page */}
            <button
              type="button"
              onClick={() => {
                if (!isAuthenticated) {
                  toast.error("Please log in to access your wishlist.");
                  return;
                }
                navigate("/auth/profile?tab=saved");
              }}
              title="Saved properties"
              aria-label="View saved properties"
              className="flex cursor-pointer items-center transition-colors hover:text-[#703BF7]"
            >
              <span className="relative rounded-full bg-gray-200 p-1 text-black transition-all duration-300 dark:bg-gray-700 dark:text-white">
                <FiHeart size={18} />
                {savedPropertyCount > 0 && (
                  <span className="absolute -right-2 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#703BF7] px-1 text-[10px] font-bold text-white">
                    {savedPropertyCount}
                  </span>
                )}
              </span>
            </button>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label="Toggle theme"
              title="Toggle theme"
              className="flex cursor-pointer items-center rounded-full bg-gray-200 p-1 text-black transition-all duration-300 dark:bg-gray-700 dark:text-white"
            >
              {theme === "dark" ? <FiSun size={20} /> : <FiMoon size={20} />}
            </button>
          </div>
        </div>
        <hr className="h-px w-full border-0 bg-gray-600" />
      </div>

      {/* MAIN NAVBAR: sticky, stays pinned once you scroll past the top bar */}
      <header className="sticky top-0 z-50 border-b border-gray-400 bg-gray-300 text-gray-900 shadow-sm dark:border-gray-700 dark:bg-[#1A1A1A] dark:text-white">
        <div className={PAGE_CONTAINER}>
          <div className="flex h-16 items-center justify-between gap-4 lg:grid lg:h-[72px] lg:grid-cols-[1fr_auto_1fr]">
            {/* Logo stays at the left on desktop. */}
            <div className="flex min-w-0 items-center">
              <NavLink to="/" className="flex shrink-0 items-center gap-2">
                <img src={logo} alt="" className="h-9" />
                <span style={SERIF} className="text-[24px] font-semibold leading-none">
                  RewaCiti
                </span>
              </NavLink>
            </div>

            <nav className="hidden items-center gap-1 lg:flex" aria-label="Main">
              {navItems.map((item) => {
                const isActive = checkActive(item.path);
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    aria-current={isActive ? "page" : undefined}
                    className={`rounded-full px-4 py-2 text-[15px] transition ${
                      isActive
                        ? "bg-[#703BF7] text-white"
                        : "text-gray-800 hover:bg-[#9677df] hover:text-white dark:text-white"
                    }`}
                  >
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>

            {/* Right side: account, CTA, menu button */}
            <div className="flex items-center gap-1 sm:gap-2 lg:justify-self-end">
              {/* Human icon (logged out) / initials (logged in) */}
              {isAuthenticated ? (
                <button
                  type="button"
                  title="Profile"
                  aria-label="Profile"
                  onClick={() => navigate("/auth/profile")}
                  className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-[#703BF7] text-sm font-semibold text-white transition hover:bg-[#9677df]"
                >
                  {profileInitials}
                </button>
              ) : (
                <button
                  type="button"
                  title="Log in"
                  aria-label="Log in"
                  onClick={() => navigate("/auth/login")}
                  className={ICON_BTN}
                >
                  <FiUser size={20} />
                </button>
              )}

              {/* CTA: visible from tablet width up, next to the menu button */}
              <button
                type="button"
                onClick={() => navigate("/list-property")}
                className="ml-1 hidden cursor-pointer rounded-full bg-[#703BF7] px-5 py-2.5 text-[15px] font-semibold text-white transition hover:bg-[#9677df] sm:block"
              >
                List your property
              </button>

              {/* Mobile / tablet menu button */}
              <button
                type="button"
                onClick={() => setIsOpen(true)}
                aria-label="Open menu"
                aria-expanded={isOpen}
                className={`${ICON_BTN} lg:hidden`}
              >
                <FiMenu size={24} />
              </button>
            </div>
          </div>
        </div>

        {/* Menu backdrop */}
        <div
          className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 lg:hidden ${
            isOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />

        {/* Menu: slides in from the right */}
        <aside
          aria-hidden={!isOpen}
          className={`fixed right-0 top-0 z-50 flex h-full w-[92%] max-w-sm flex-col bg-gray-200 shadow-xl transition-transform duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] dark:bg-[#1A1A1A] lg:hidden ${
            isOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-gray-400 px-4 dark:border-gray-700">
            <NavLink to="/" className="flex items-center gap-2">
              <img src={logo} alt="" className="h-9" />
              <span style={SERIF} className="text-[24px] font-semibold leading-none">
                RewaCiti
              </span>
            </NavLink>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close menu"
              className={ICON_BTN}
            >
              <FiX size={22} />
            </button>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto p-4" aria-label="Mobile">
            {navItems.map((item) => {
              const isActive = checkActive(item.path);
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  className={`block rounded-xl px-4 py-3.5 text-[17px] ${
                    isActive
                      ? "bg-[#703BF7]/10 font-semibold text-[#703BF7] dark:text-white"
                      : "text-gray-800 dark:text-gray-200"
                  }`}
                >
                  {item.name}
                </NavLink>
              );
            })}

            <NavLink
              to={accountPath}
              className={`block rounded-xl px-4 py-3.5 text-[17px] ${
                checkActive(accountPath)
                  ? "bg-[#703BF7]/10 font-semibold text-[#703BF7] dark:text-white"
                  : "text-gray-800 dark:text-gray-200"
              }`}
            >
              {isAuthenticated ? "My account" : "Log in"}
            </NavLink>

            {isAuthenticated && (
              <button
                type="button"
                onClick={handleLogout}
                className="flex w-full cursor-pointer items-center gap-2 rounded-xl px-4 py-3.5 text-left text-[17px] font-semibold text-red-500"
              >
                <FiLogOut size={18} /> Log out
              </button>
            )}
          </nav>

          <div className="shrink-0 border-t border-gray-400 p-4 dark:border-gray-700 sm:hidden">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                navigate("/list-property");
              }}
              className="w-full cursor-pointer rounded-full bg-[#703BF7] px-5 py-3.5 text-base font-semibold text-white transition hover:bg-[#9677df]"
            >
              List your property
            </button>
          </div>
        </aside>
      </header>
    </>
  );
};

export default Navbar;