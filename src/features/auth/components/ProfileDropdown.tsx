import { Link } from "react-router";
import { FiUser, FiLogOut } from "react-icons/fi";
import { useAuthStore } from "../store/useAuthStore";
import { useNavigate } from "react-router";

interface ProfileDropdownProps {
  isOpen: boolean;
  onClose: () => void;
  isMobile?: boolean;
}

function ProfileDropdown({isOpen,onClose}: ProfileDropdownProps) {
  const { customer, logout } = useAuthStore();
  const navigate = useNavigate();

  if (!isOpen) return null;

  const firstName = customer?.firstName ?? "";
  const lastName = customer?.lastName ?? "";
  const email = customer?.email ?? "";

  const initials =
    `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase() || "U";

  const handleLogout = () => {
    logout();
    onClose();
       navigate("/");
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