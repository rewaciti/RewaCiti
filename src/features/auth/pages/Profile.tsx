import Navbar from "../../../shared/components/Layout/Navbar";
import Footer from "../../../shared/components/Layout/Footer";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { authAPI } from "../services/authAPI";
import type { ProfileResponse } from "../services/authAPI";
import { useAuthStore } from "../store/useAuthStore";
import { ProfilePageSkeleton } from "../../../shared/components/ui/Skeletons";
import {FiUser, FiMapPin, FiEdit2, FiMail, FiSave, FiX, FiLock, FiCamera, FiPhone} from "react-icons/fi";

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
    return d.toISOString().split("T")[0];
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

const formatDateForDisplay = (dateStr?: string) => {
  if (!dateStr) return "";
  const iso = formatDateForInput(dateStr);
  if (!iso) return dateStr;
  const [y, m, d] = iso.split("-");
  return `${d}-${m}-${y}`;
};

type Section = "personal" | "address";

// ---------- Helper Components ----------

interface FieldProps {
  label: string;
  value?: string;
}

const Field = ({ label, value }: FieldProps) => (
  <div className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-800/60 last:border-0">
    <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
    {value ? (
      <span className="text-xs font-semibold text-gray-800 dark:text-gray-100">
        {value}
      </span>
    ) : (
      <span className="text-xs italic text-gray-400 dark:text-gray-600">
        Not set
      </span>
    )}
  </div>
);

interface SectionCardProps {
  icon: React.ReactNode;
  title: string;
  section: Section;
  editingSection: Section | null;
  isSaving: boolean;
  cancelEdit: () => void;
  setEditingSection: (section: Section | null) => void;
  onSubmit: () => void;
  children: React.ReactNode;
}

const SectionCard = ({
  icon,
  title,
  section,
  editingSection,
  isSaving,
  cancelEdit,
  setEditingSection,
  onSubmit,
  children,
}: SectionCardProps) => {
  const isEditing = editingSection === section;
  return (
    <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl p-4">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
          {icon}
          {title}
        </div>
        {isEditing ? (
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={cancelEdit}
              className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 cursor-pointer"
            >
              <FiX size={12} /> Cancel
            </button>
            <button
              type="button"
              disabled={isSaving}
              onClick={onSubmit}
              className="flex items-center gap-1 text-xs font-semibold text-[#703BF7] hover:text-[#5c2fe0] disabled:opacity-50 cursor-pointer"
            >
              <FiSave size={12} /> {isSaving ? "Saving..." : "Save"}
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setEditingSection(section)}
            className="flex items-center gap-1 text-xs font-semibold text-[#703BF7] hover:text-[#5c2fe0] cursor-pointer"
          >
            <FiEdit2 size={12} /> Edit
          </button>
        )}
      </div>
      {children}
    </div>
  );
};

interface LabeledInputProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
}

const LabeledInput = ({
  label,
  value,
  onChange,
  type = "text",
}: LabeledInputProps) => (
  <div>
    <label className="block text-[10px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
      {label}
    </label>
    <input
      type={type}
      className="w-full px-3 py-1.5 border border-gray-600/30 rounded-lg bg-gray-100 dark:bg-black/20 text-gray-700 dark:text-gray-200 focus:outline-none focus:border-[#703BF7] placeholder:text-[11px] dark:placeholder:text-gray-500 placeholder:text-gray-600 text-xs"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  </div>
);

const Profile = () => {
  const { setCustomer, setCompanyId } = useAuthStore();
  const [activeTab, setActiveTab] = useState<"info" | "security">("info");
  const [isLoading, setIsLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileResponse | null>(null);

  // Which section (if any) is currently in edit mode
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Personal Information fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");

  // Address fields
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [country, setCountry] = useState("");
  const [postalCode, setPostalCode] = useState("");

  const [profilePicture, setProfilePicture] = useState("");
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Password Form States
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const loadFromProfile = (data: ProfileResponse) => {
    setProfile(data);
    setFirstName(data.firstName || "");
    setLastName(data.lastName || "");
    setPhoneNumber(data.phoneNumber || "");
    setDateOfBirth(formatDateForInput(data.dateOfBirth));

    if (data.addresses && data.addresses.length > 0) {
      const defaultAddr =
        data.addresses.find((a) => a.isDefault) || data.addresses[0];
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
  };

  useEffect(() => {
    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        const data = await authAPI.getProfile();
        loadFromProfile(data);
      } catch (error) {
        console.error("Failed to load profile:", error);
        toast.error("Failed to load profile details.");
      } finally {
        setIsLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const cancelEdit = () => {
    if (profile) loadFromProfile(profile);
    setEditingSection(null);
  };

  const handleSaveSection = async (section: Section) => {
    if (section === "personal" && (!firstName || !lastName)) {
      toast.error("First and Last name are required.");
      return;
    }

    setIsSaving(true);
    try {
      const payload = {
        firstName,
        lastName,
        phoneNumber,
        dateOfBirth: formatDateForPayload(dateOfBirth),
        address,
        city,
        state,
        country,
        postalCode,
        profilePicture,
      };

      const response = await authAPI.updateProfile(payload);
      toast.success(response.message || "Profile updated successfully!");

      if (response.customer) {
        loadFromProfile(response.customer);
        setCustomer({
          id: response.customer.id,
          email: response.customer.email,
          firstName: response.customer.firstName,
          lastName: response.customer.lastName,
          companyId: response.customer.companyId,
          enabledModules: response.customer.enabledModules,
          emailVerified: response.customer.emailVerified,
          status: response.customer.status,
          phoneNumber: response.customer.phoneNumber,
        });
        setCompanyId(response.customer.companyId);
      }
      setEditingSection(null);
    } catch (error) {
      const errorMessage = getErrorMessage(error, "Failed to update profile.");
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
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
      const response = await authAPI.changePassword({
        currentPassword,
        newPassword,
      });
      toast.success(response.message || "Password changed successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      const errorMessage = getErrorMessage(
        error,
        "Failed to change password."
      );
      toast.error(errorMessage);
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handlePhotoSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file later
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be smaller than 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      const dataUrl = reader.result as string;
      setProfilePicture(dataUrl); // instant preview

      setIsUploadingPhoto(true);
      try {
        const response = await authAPI.updateProfile({
          firstName,
          lastName,
          phoneNumber,
          dateOfBirth: formatDateForPayload(dateOfBirth),
          address,
          city,
          state,
          country,
          postalCode,
          profilePicture: dataUrl,
        });
        toast.success("Profile photo updated!");
        if (response.customer) {
          loadFromProfile(response.customer);
        }
      } catch (error) {
        const errorMessage = getErrorMessage(
          error,
          "Failed to upload photo."
        );
        toast.error(errorMessage);
      } finally {
        setIsUploadingPhoto(false);
      }
    };
    reader.onerror = () => toast.error("Couldn't read that image.");
    reader.readAsDataURL(file);
  };

  return (
    <div>
      <Navbar />
      <div className="mx-auto p-4 bg-gray-300 dark:bg-[#1A1A1A]">
        {/* Tab buttons */}
        <div className="flex w-full max-w-xs bg-gray-100 dark:bg-black/20 p-1 rounded-lg mb-4">
          <button
            onClick={() => setActiveTab("info")}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              activeTab === "info"
                ? "bg-[#703BF7] text-white shadow-sm"
                : "text-gray-700 dark:text-gray-300 hover:text-[#703BF7]"
            }`}
          >
            <FiUser size={14} /> Profile
          </button>
          <button
            onClick={() => setActiveTab("security")}
            className={`flex-1 flex items-center justify-center gap-2 py-1.5 rounded-md text-xs font-semibold transition cursor-pointer ${
              activeTab === "security"
                ? "bg-[#703BF7] text-white shadow-sm"
                : "text-gray-700 dark:text-gray-300 hover:text-[#703BF7]"
            }`}
          >
            <FiLock size={14} /> Security
          </button>
        </div>

        {isLoading ? (
          <ProfilePageSkeleton />
        ) : activeTab === "security" ? (
          /* Security tab: no left column at all — password form centered, full width */
          <div className="flex justify-center">
            <div className="w-full max-w-md">
              <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <form onSubmit={handleChangePassword} className="space-y-3">
                  <LabeledInput
                    label="Current Password"
                    value={currentPassword}
                    onChange={setCurrentPassword}
                    type="password"
                  />
                  <LabeledInput
                    label="New Password"
                    value={newPassword}
                    onChange={setNewPassword}
                    type="password"
                  />
                  {newPassword && newPassword.length < 8 && (
                    <p className="text-red-500 text-[9px] mt-0.5">
                      Min. 8 characters
                    </p>
                  )}
                  <LabeledInput
                    label="Confirm Password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    type="password"
                  />
                  {confirmPassword && newPassword !== confirmPassword && (
                    <p className="text-red-500 text-[9px] mt-0.5">
                      Passwords do not match
                    </p>
                  )}
                  <div className="flex justify-end pt-2">
                    <button
                      type="submit"
                      disabled={
                        isChangingPassword ||
                        !currentPassword ||
                        !newPassword ||
                        newPassword !== confirmPassword ||
                        newPassword.length < 8
                      }
                      className="flex items-center justify-center gap-1.5 bg-[#703BF7] text-white hover:bg-[#5c2fe0] px-4 py-1.5 rounded-lg text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
                    >
                      <FiLock size={14} />
                      {isChangingPassword ? "Updating..." : "Change Password"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        ) : (
          /* Profile tab: left column (avatar + basic info) + right column */
          <div className="grid grid-cols-1 md:grid-cols-[280px_1fr] gap-4 justify-center items-start">
            {/* Left column — only rendered on the Profile tab */}
            <div className="space-y-4">
              <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl p-4 flex flex-col items-center text-center">
                <div className="relative w-16 h-16 mb-2">
                  <div className="w-16 h-16 rounded-full bg-[#703BF7]/10 border border-[#703BF7]/40 text-[#703BF7] dark:text-white flex items-center justify-center text-lg font-bold overflow-hidden">
                    {profilePicture ? (
                      <img
                        src={profilePicture}
                        alt="Avatar"
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : (
                      `${firstName?.charAt(0) || ""}${
                        lastName?.charAt(0) || ""
                      }`.toUpperCase() || <FiUser />
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto}
                    title="Upload photo"
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#703BF7] text-white flex items-center justify-center border-2 border-white dark:border-[#141414] hover:bg-[#5c2fe0] disabled:opacity-50 cursor-pointer"
                  >
                    <FiCamera size={11} />
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </div>
                {isUploadingPhoto && (
                  <p className="text-[10px] text-gray-400 mb-1">Uploading...</p>
                )}
                <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                  {firstName} {lastName}
                </h4>
              </div>

              <div className="bg-white dark:bg-[#141414] border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <p className="text-[10px] font-bold tracking-wide text-gray-500 dark:text-gray-400 mb-2 uppercase">
                  Basic Info
                </p>
                <div className="flex flex-col gap-2 text-xs text-gray-700 dark:text-gray-200">
                  <div className="flex items-center gap-2">
                    <FiMail size={12} className="text-gray-400 shrink-0" />
                    <span className="truncate">{profile?.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FiPhone size={12} className="text-gray-400 shrink-0" />
                    <span>{phoneNumber || "No phone number"}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column */}
            <div className="space-y-4">
              {/* Personal Information */}
              <SectionCard
                icon={<FiUser size={14} />}
                title="Personal Information"
                section="personal"
                editingSection={editingSection}
                isSaving={isSaving}
                cancelEdit={cancelEdit}
                setEditingSection={setEditingSection}
                onSubmit={() => handleSaveSection("personal")}
              >
                {editingSection === "personal" ? (
                  <div className="grid grid-cols-2 gap-3">
                    <LabeledInput
                      label="First Name"
                      value={firstName}
                      onChange={setFirstName}
                    />
                    <LabeledInput
                      label="Last Name"
                      value={lastName}
                      onChange={setLastName}
                    />
                    <LabeledInput
                      label="Phone"
                      value={phoneNumber}
                      onChange={setPhoneNumber}
                    />
                    <LabeledInput
                      label="Date of Birth"
                      value={dateOfBirth}
                      onChange={setDateOfBirth}
                      type="date"
                    />
                  </div>
                ) : (
                  <div>
                    <Field label="First Name" value={firstName} />
                    <Field label="Last Name" value={lastName} />
                    <Field label="Email" value={profile?.email} />
                    <Field label="Phone" value={phoneNumber} />
                    <Field
                      label="Date of Birth"
                      value={formatDateForDisplay(dateOfBirth)}
                    />
                  </div>
                )}
              </SectionCard>

              {/* Address */}
              <SectionCard
                icon={<FiMapPin size={14} />}
                title="Address"
                section="address"
                editingSection={editingSection}
                isSaving={isSaving}
                cancelEdit={cancelEdit}
                setEditingSection={setEditingSection}
                onSubmit={() => handleSaveSection("address")}
              >
                {editingSection === "address" ? (
                  <div className="space-y-3">
                    <LabeledInput
                      label="Street"
                      value={address}
                      onChange={setAddress}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <LabeledInput
                        label="City"
                        value={city}
                        onChange={setCity}
                      />
                      <LabeledInput
                        label="State"
                        value={state}
                        onChange={setState}
                      />
                      <LabeledInput
                        label="Postal Code"
                        value={postalCode}
                        onChange={setPostalCode}
                      />
                      <LabeledInput
                        label="Country"
                        value={country}
                        onChange={setCountry}
                      />
                    </div>
                  </div>
                ) : (
                  <div>
                    <Field label="Street" value={address} />
                    <Field label="City" value={city} />
                    <Field label="State" value={state} />
                    <Field label="Postal Code" value={postalCode} />
                    <Field label="Country" value={country} />
                  </div>
                )}
              </SectionCard>
            </div>
          </div>
        )}
      </div>
      <section className="bg-gray-300 dark:bg-black/30">
        <Footer/>
      </section> 
    </div>
  );
};

export default Profile;