import Navbar from "../../../shared/components/Layout/Navbar"
import Footer from "../../../shared/components/Layout/Footer";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { authAPI } from "../services/authAPI";
import type { ProfileResponse } from "../services/authAPI";
import { useAuthStore } from "../store/useAuthStore";
import { ProfileDropdownSkeleton } from "../../../shared/components/ui/Skeletons";
import { FiUser, FiLock, FiSave, FiPhone, FiCalendar } from "react-icons/fi";

const getErrorMessage = (error: unknown, fallback: string) => {
  if (typeof error === "object" && error !== null) {
    const errorWithMessage = error as {
      response?: { data?: { message?: string } };
      message?: string;
    };
    return (
      errorWithMessage.response?.data?.message ||
      errorWithMessage.message ||
      fallback
    );
  }
  return fallback;
};

const formatDateForInput = (dateStr?: string) => {
  if (!dateStr) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) return dateStr;
  if (/^\d{2}-\d{2}-\d{4}$/.test(dateStr)) {
    const parts = dateStr.split("-");
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    return d.toISOString().split('T')[0];
  } catch {
    return "";
  }
};

const formatDateForPayload = (dateStr: string) => {
  if (!dateStr) return "";
  const parts = dateStr.split("-");
  if (parts.length === 3) {
    return `${parts[2]}-${parts[1]}-${parts[0]}`;
  }
  return dateStr;
};

const Profile = () => {
  const {setCustomer, setCompanyId } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"info" | "security">("info");
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  // Profile Form States
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [profilePicture, setProfilePicture] = useState("");

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const inputStyle =
    "w-full px-3 py-1.5 border border-gray-600/30 rounded-lg bg-gray-100 dark:bg-gray-600/30 text-gray-700 dark:text-gray-300 focus:outline-none focus:border-[#703BF7] placeholder:text-[11px] dark:placeholder:text-gray-400 placeholder:text-gray-600 text-xs";

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const data = await authAPI.getProfile();
        setProfile(data);
        setFirstName(data.firstName || "");
        setLastName(data.lastName || "");
        setPhoneNumber(data.phoneNumber || "");
        setDateOfBirth(formatDateForInput(data.dateOfBirth));

        if (data.addresses && data.addresses.length > 0) {
          const defaultAddr = data.addresses.find((a) => a.isDefault) || data.addresses[0];
          setAddress(defaultAddr.street || "");
          setCity(defaultAddr.city || "");
          setState(defaultAddr.state || "");
          setCountry(defaultAddr.country || "");
          setPostalCode(defaultAddr.postalCode || "");
        } else {
          setAddress(data.address || "");
          setCity(data.city || "");
          setState(data.state || "");
          setCountry(data.country || "");
          setPostalCode(data.postalCode || "");
        }
        setProfilePicture(data.profilePicture || "");
      } catch (error) {
        console.error("Failed to load profile:", error);
        toast.error("Failed to load profile details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName || !lastName) {
      toast.error("First and Last name are required.");
      return;
    }

    setIsSavingProfile(true);
    try {
      const payload = {
        firstName,
        lastName,
        phoneNumber,
        address,
        city,
        state,
        country,
        postalCode,
        profilePicture,
        dateOfBirth: formatDateForPayload(dateOfBirth),
      };

      const response = await authAPI.updateProfile(payload);
      toast.success(response.message || "Profile updated successfully!");

      if (response.customer) {
        setProfile(response.customer);
        setCustomer({
          id: response.customer.id,
          email: response.customer.email,
          firstName: response.customer.firstName,
          lastName: response.customer.lastName,
          companyId: response.customer.companyId,
          enabledModules: response.customer.enabledModules,
          emailVerified: response.customer.emailVerified,
          status: response.customer.status,
        });
        setCompanyId(response.customer.companyId);
      }
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to update profile.");
      toast.error(errorMessage);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      toast.error("Please fill in all password fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New passwords do not match.");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long.");
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await authAPI.changePassword({ currentPassword, newPassword });
      toast.success(response.message || "Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to change password.");
      toast.error(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  return (
    <div>
      <Navbar />
      <div
        className = "bg-white dark:bg-[#1A1A1A] border border-gray-200 dark:border-gray-800 rounded-xl shadow-2xl z-100 p-4 max-h-[80vh] overflow-y-auto scrollbar-thin text-black dark:text-white"
      >
        {isLoading ? (
          <ProfileDropdownSkeleton />
        ) : (
          <div className="space-y-4">
            {/* Header */}
            <div className="flex items-center gap-3 pb-3 border-b border-gray-100 dark:border-gray-800">
              <div className="w-12 h-12 rounded-full bg-[#703BF7] text-white flex items-center justify-center text-lg font-bold shadow-inner animate-fade-in">
                {profilePicture ? (
                  <img src={profilePicture} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  `${firstName?.charAt(0) || ""}${lastName?.charAt(0) || ""}`.toUpperCase() || <FiUser />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                  {firstName} {lastName}
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{profile?.email}</p>
              </div>
            </div>
  
            {/* Tab buttons */}
            <div className="flex bg-gray-100 dark:bg-black/20 p-1 rounded-lg">
              <button
                onClick={() => setActiveTab("info")}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "info"
                    ? "bg-[#703BF7] text-white shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:text-[#703BF7]"
                  }`}
              >
                <FiUser size={14} />
                Details
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${activeTab === "security"
                    ? "bg-[#703BF7] text-white shadow-sm"
                    : "text-gray-700 dark:text-gray-300 hover:text-[#703BF7]"
                  }`}
              >
                <FiLock size={14} />
                Security
              </button>
            </div>
  
            {/* Tab content */}
            {activeTab === "info" ? (
              <form onSubmit={handleUpdateProfile} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1">First Name</label>
                    <input
                      type="text"
                      className={inputStyle}
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Last Name</label>
                    <input
                      type="text"
                      className={inputStyle}
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <FiPhone size={10} /> Phone
                    </label>
                    <input
                      type="tel"
                      className={inputStyle}
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
                      <FiCalendar size={10} /> DOB
                    </label>
                    <input
                      type="date"
                      className={inputStyle}
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                    />
                  </div>
                </div>
  
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Street Address</label>
                  <input
                    type="text"
                    className={inputStyle}
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="Street"
                  />
                </div>
  
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1">City</label>
                    <input
                      type="text"
                      className={inputStyle}
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1">State</label>
                    <input
                      type="text"
                      className={inputStyle}
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Zip Code</label>
                    <input
                      type="text"
                      className={inputStyle}
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                    />
                  </div>
                </div>
  
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Country</label>
                    <input
                      type="text"
                      className={inputStyle}
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Avatar URL</label>
                    <input
                      type="url"
                      className={inputStyle}
                      value={profilePicture}
                      onChange={(e) => setProfilePicture(e.target.value)}
                    />
                  </div>
                </div>
  
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="flex items-center justify-center gap-1.5 bg-[#703BF7] text-white hover:bg-[#5c2fe0] px-4 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                  >
                    <FiSave size={14} />
                    {isSavingProfile ? "Saving..." : "Save Details"}
                  </button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleChangePassword} className="space-y-3">
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Current Password</label>
                  <input
                    type="password"
                    className={inputStyle}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                </div>
  
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1">New Password</label>
                  <input
                    type="password"
                    className={inputStyle}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                  />
                  {newPassword && newPassword.length < 8 && (
                    <p className="text-red-500 text-[9px] mt-0.5">Min. 8 characters</p>
                  )}
                </div>
  
                <div>
                  <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1">Confirm Password</label>
                  <input
                    type="password"
                    className={inputStyle}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-red-500 text-[9px] mt-0.5">Passwords do not match</p>
                  )}
                </div>
  
                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    disabled={isChangingPassword || !currentPassword || !newPassword || newPassword !== confirmPassword || newPassword.length < 8}
                    className="flex items-center justify-center gap-1.5 bg-[#703BF7] text-white hover:bg-[#5c2fe0] px-4 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                  >
                    <FiLock size={14} />
                    {isChangingPassword ? "Updating..." : "Change Password"}
                  </button>
                </div>
              </form>
            )}
  
          </div>
        )}
      </div>
      <Footer/>
    </div>
  );
};

export default Profile;
