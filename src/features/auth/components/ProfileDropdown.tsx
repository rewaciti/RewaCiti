import { Link } from "react-router";
import { FiUser, FiLogOut, FiSun, FiMoon, FiChevronRight } from "react-icons/fi";
import { useAuthStore } from "../store/useAuthStore";
import { useThemeStore } from "../../../shared/store/useThemeStore";
import { useState } from "react";

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

function ProfileDropdown({isOpen,onClose, isMobile}: ProfileDropdownProps) {
  const { customer, logout } = useAuthStore();
  const { theme, setTheme } = useThemeStore();
  const [showThemeMenu, setShowThemeMenu] = useState(false);

  if (!isOpen) return null;

  const firstName = customer?.firstName ?? "";
  const lastName = customer?.lastName ?? "";
  const email = customer?.email ?? "";

  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";

  const handleLogout = () => {
    logout();
    onClose();
  };



  return (
    <div className="absolute right-0 top-12.5 z-50 w-64 rounded-b-xl border border-gray-600/50 bg-gray-300 shadow-xl dark:border-gray-700 dark:bg-[#1A1A1A]">
      {/* User Information */}
      <div className="flex items-center gap-3 border-b border-gray-600/50 p-4 dark:border-gray-700">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#703BF7] font-semibold text-white">
          {initials}
        </div>

        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-gray-900 dark:text-white">
            {firstName} {lastName}
          </p>
          <p className="truncate text-xs text-gray-600 dark:text-gray-400">
            {email}
          </p>
        </div>
      </div>

      {/* View Profile */}
      <Link
        to="/auth/profile"
        onClick={onClose}
        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-800 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
      >
        <FiUser size={18} />
        <span>View Profile</span>
      </Link>

      {/* Theme */}
      {isMobile ? (
        <div>
          {/* Mobile Theme Toggle */}
          <button
            onClick={() => setShowThemeMenu(!showThemeMenu)}
            className="flex w-full items-center justify-between px-4 py-3 text-sm text-gray-800 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10"
          >
            <div className="flex items-center gap-3">
              {theme === "dark" ? <FiMoon size={18} /> : <FiSun size={18} />}
              <span>Theme</span>
            </div>

            <FiChevronRight
              size={16}
              className={`transition-transform duration-200 ${
                showThemeMenu ? "rotate-90" : ""
              }`}
            />
          </button>

          {showThemeMenu && (
            <div className="ml-8 border-l border-gray-600/50 dark:border-gray-700">
              <button
                onClick={() => setTheme("light")}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/10 ${
                  theme === "light"
                    ? "text-violet-600 dark:text-violet-400"
                    : "text-gray-700 dark:text-gray-200"
                }`}
              >
                <FiSun size={16} />
                Light
              </button>

              <button
                onClick={() => setTheme("dark")}
                className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm hover:bg-gray-100 dark:hover:bg-white/10 ${
                  theme === "dark"
                    ? "text-violet-600 dark:text-violet-400"
                    : "text-gray-700 dark:text-gray-200"
                }`}
              >
                <FiMoon size={16} />
                Dark
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="relative group">
          {/* Desktop Theme */}
          <div className="flex cursor-pointer items-center justify-between px-4 py-3 text-sm text-gray-800 transition hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/10">
            <div className="flex items-center gap-3">
              {theme === "dark" ? <FiMoon size={18} /> : <FiSun size={18} />}
              <span>Theme</span>
            </div>

            <FiChevronRight size={16} />
          </div>

          <div className="absolute right-full top-0 mr-1 hidden w-44 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg group-hover:block dark:border-gray-700 dark:bg-[#1A1A1A]">
            <button
              onClick={() => setTheme("light")}
              className={`flex w-full items-center gap-3 rounded-t-lg px-4 py-3 text-left text-sm transition hover:bg-gray-200 dark:hover:bg-white/10 ${
                theme === "light"
                  ? "bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
                  : "text-gray-700 dark:text-gray-200"
              }`}
            >
              <FiSun size={16} />
              Light
            </button>

            <button
              onClick={() => setTheme("dark")}
              className={`flex w-full items-center gap-3 rounded-b-lg px-4 py-3 text-left text-sm transition hover:bg-gray-200 dark:hover:bg-white/10 ${
                theme === "dark"
                  ? "bg-violet-50 text-violet-600 dark:bg-violet-500/20 dark:text-violet-400"
                  : "text-gray-700 dark:text-gray-200"
              }`}
            >
              <FiMoon size={16} />
              Dark
            </button>
          </div>
        </div>
      )}

      {/* Logout */}
      <button
        onClick={handleLogout}
        className="flex w-full items-center gap-3 border-t border-gray-600/50 px-4 py-3 text-left text-sm text-red-500 transition hover:bg-red-50 dark:border-gray-700 dark:hover:bg-red-500/10 rounded-b-lg"
      >
        <FiLogOut size={18} />
        <span>Logout</span>
      </button>
    </div>
  );
}

export default ProfileDropdown;