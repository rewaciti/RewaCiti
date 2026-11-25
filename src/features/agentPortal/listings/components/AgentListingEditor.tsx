import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight, CalendarClock, Check, ChevronDown, CircleDollarSign, FileText, ImagePlus, Info, ListChecks, MapPin, Plus, Star, Trash2, Upload, Users, X } from "lucide-react";
import { toast } from "sonner";
import CustomDropdown from "@/shared/components/CustomDropdown";
import { agentAPI, agentErrorMessage, type AgentProperty, type AgentPropertyCharge, type AgentPropertyPayload, type AgentPropertyType } from "@/features/agentPortal/common/services/agentAPI";
import { EDITOR_TABS, PROPERTY_PURPOSES, PRICE_PERIODS, CURRENCY_OPTIONS, RENTAL_TERM_UNITS, isRentalTermUnit, CHARGE_RECIPIENT_OPTIONS, DEFAULT_CHARGE_OPTIONS, LAND_TITLE_OPTIONS, DEFAULT_AMENITY_OPTIONS, DEFAULT_RULE_OPTIONS, DEFAULT_BILL_OPTIONS, currencySymbol, money, serviceChargeFor, statusLabel, splitLines, readFileAsDataUrl, sanitizeDescriptionHtml, descriptionText } from "@/features/agentPortal/common/utils/agentListingUtils";
import type { EditorTab } from "@/features/agentPortal/common/utils/agentListingUtils";
import AgentDescriptionEditor from "./AgentDescriptionEditor";
import AgentListingEditorSkeleton from "./AgentListingEditorSkeleton";
import { blankDraft, draftFromProperty } from "@/features/agentPortal/listings/utils/agentListingDraft";
import type { ListingDraft } from "@/features/agentPortal/listings/utils/agentListingDraft";

const inputBaseClass = "w-full border border-[#e5e7eb] bg-white text-xs text-[#111827] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[#9ca3af] focus:border-[#b79bff] focus:ring-2 focus:ring-[#b79bff]/10 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white dark:placeholder:text-[#6b7280] dark:focus:ring-[#b79bff]/15";
const fieldInputClass = `${inputBaseClass} min-h-[42px] rounded-[6px] px-3 py-2.5`;
const cardInputClass = `${inputBaseClass} min-h-[43px] rounded-[5px] px-3 py-2.5`;
const rentalInputClass = `${inputBaseClass} min-h-[38px] rounded-[5px] px-2.5 py-0`;
const customChargeInputClass = `${inputBaseClass} w-[min(100%,300px)] min-h-[39px] rounded-[5px] px-[11px] py-0 max-[700px]:w-full`;

const fieldClass = "block min-w-0 mb-[18px] [&>span]:mb-[7px] [&>span]:block [&>span]:text-xs [&>span]:font-semibold [&>span]:text-[#111827] dark:[&>span]:text-white [&>span_b]:text-[#c24e42]";
const cardFieldClass = "block min-w-0 mb-[5px] [&>span]:mb-1.5 [&>span]:block [&>span]:text-xs [&>span]:font-medium [&>span]:text-[#111827] dark:[&>span]:text-white [&>span_b]:text-[#c24e42]";
const cardFieldNoMarginClass = "block min-w-0 [&>span]:mb-1.5 [&>span]:block [&>span]:text-xs [&>span]:font-medium [&>span]:text-[#111827] dark:[&>span]:text-white [&>span_b]:text-[#c24e42]";

const detailCardClass = "m-0 rounded-[3px] border border-[#e5e7eb] bg-white p-[21px_26px] text-[#111827] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white max-[700px]:p-[17px_14px]";
const cardTitleClass = "mb-4 flex items-center gap-[9px] text-[#b79bff] dark:text-[#b79bff] [&>h3]:m-0 [&>h3]:text-[15px] [&>h3]:font-bold [&>h3]:text-[#111827] dark:[&>h3]:text-white";
const explainerClass = "-mt-1 mb-[17px] text-xs leading-[1.6] text-[#4b5563] dark:text-[#9ca3af]";

const dropdownWrapClass = "w-full max-w-[545px] mb-[23px]";
const dropdownWrapFlushClass = "w-full mb-[18px]";
const dropdownWrapPriceClass = "w-full mb-0";
const dropdownTriggerClass = "w-full min-h-[43px] rounded-[5px] border border-[#e5e7eb] bg-white px-[13px] text-left text-xs text-[#111827] outline-none transition-[border-color,box-shadow] duration-150 hover:border-[#b79bff] focus:border-[#b79bff] focus:outline-none focus:ring-2 focus:ring-[#b79bff]/10 focus-visible:border-[#b79bff] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#b79bff]/10 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white dark:focus:ring-[#b79bff]/15 dark:focus-visible:ring-[#b79bff]/15";
const rentalTriggerClass = "w-full min-h-[38px] rounded-[5px] border border-[#e5e7eb] bg-white px-2.5 text-left text-xs text-[#111827] outline-none hover:border-[#b79bff] focus:border-[#b79bff] focus:outline-none focus-visible:border-[#b79bff] focus-visible:outline-none dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white";
const chargeRecipientTriggerClass = "w-full min-h-9 rounded-[6px] border border-[#e5e7eb] bg-white px-2 text-left text-[11px] text-[#111827] outline-none hover:border-[#b79bff] focus:border-[#b79bff] focus:outline-none focus-visible:border-[#b79bff] focus-visible:outline-none dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white";
const dropdownMenuClass = "!border-[#e5e7eb] !bg-white !text-[#111827] dark:!border-white/10 dark:!bg-[#1a1a1a] dark:!text-white";
const dropdownMenuItemClass = "block w-full px-4 py-3 text-left text-sm whitespace-nowrap transition hover:!bg-[#b79bff] hover:!text-white dark:hover:!bg-[#b79bff] dark:hover:!text-white";

const statusPillClasses: Record<string, string> = {
  published: "bg-[#dcfce7] text-[#166534]",
  pending_approval: "bg-[#fef3c7] text-[#92400e]",
  draft: "bg-[#f3f4f6] text-[#4b5563] dark:bg-[#232323] dark:text-[#9ca3af]",
  archived: "bg-[#f3f4f6] text-[#4b5563] dark:bg-[#232323] dark:text-[#9ca3af]",
  reserved: "bg-[#ede9fe] text-[#5b21b6]",
  sold: "bg-[#dbeafe] text-[#1e40af]",
  let: "bg-[#dbeafe] text-[#1e40af]",
};

const AgentListingEditor = ({
  property,
  onClose,
  onSaved,
}: {
  property: AgentProperty | null;
  onClose: () => void;
  onSaved: () => void;
}) => {
  const [draft, setDraft] = useState<ListingDraft>(() => property ? draftFromProperty(property) : blankDraft());
  const [types, setTypes] = useState<AgentPropertyType[]>([]);
  const [amenityOptions, setAmenityOptions] = useState<string[]>([]);
  const [ruleOptions, setRuleOptions] = useState<string[]>([]);
  const [billOptions, setBillOptions] = useState<string[]>([]);
  const [chargeOptions, setChargeOptions] = useState<AgentPropertyCharge[]>([]);
  const [defaultVisitFee, setDefaultVisitFee] = useState<number | null>(null);
  const [loadingOptions, setLoadingOptions] = useState(true);
  const [optionsError, setOptionsError] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<EditorTab>("general");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoDropActive, setPhotoDropActive] = useState(false);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [documentLabels, setDocumentLabels] = useState<Record<string, string>>({});
  const [documentUploading, setDocumentUploading] = useState(false);
  const [documentDropActive, setDocumentDropActive] = useState(false);
  const documentInputRef = useRef<HTMLInputElement>(null);
  const [activePhotoActions, setActivePhotoActions] = useState<number | null>(null);
  const photoLongPressTimer = useRef<number | null>(null);
  const [customChargeName, setCustomChargeName] = useState("");
  const [customChargeOpen, setCustomChargeOpen] = useState(false);
  const [amenityEntry, setAmenityEntry] = useState("");
  const [ruleEntry, setRuleEntry] = useState("");
  const [billEntry, setBillEntry] = useState("");
  const [specialNoteEntry, setSpecialNoteEntry] = useState("");
  const [mobileProgressOpen, setMobileProgressOpen] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const selectTab = (tab: EditorTab) => {
    setActiveTab(tab);
    setMobileProgressOpen(false);
    scrollContainerRef.current?.scrollTo({ top: 0 });
  };

  useEffect(() => () => {
    if (photoLongPressTimer.current !== null) window.clearTimeout(photoLongPressTimer.current);
  }, []);

  const loadOptions = useCallback(async () => {
    setLoadingOptions(true);
    setOptionsError(false);
    try {
      const [propertyTypes, settings] = await Promise.all([
        agentAPI.getPropertyTypes(),
        agentAPI.getSettings(),
      ]);
      setTypes(propertyTypes);
      const readStrings = (key: string) => {
        const value = settings[key];
        return Array.isArray(value) ? value.filter((option): option is string => typeof option === "string") : [];
      };
      const amenities = readStrings("amenityOptions");
      const rules = readStrings("ruleOptions");
      const bills = readStrings("billOptions");
      setAmenityOptions(amenities.length ? amenities : DEFAULT_AMENITY_OPTIONS);
      setRuleOptions(rules.length ? rules : DEFAULT_RULE_OPTIONS);
      setBillOptions(bills.length ? bills : DEFAULT_BILL_OPTIONS);
      setDefaultVisitFee(typeof settings.defaultVisitFee === "number" ? settings.defaultVisitFee : null);
      const rawChargeOptions = settings.chargeOptions;
      const parsedChargeOptions = Array.isArray(rawChargeOptions) ? rawChargeOptions.flatMap((item) => {
        if (typeof item !== "object" || item === null || !("name" in item) || typeof item.name !== "string") return [];
        return [{
          name: item.name,
          refundable: "refundable" in item && typeof item.refundable === "boolean" ? item.refundable : undefined,
          keptBy: "keptBy" in item && typeof item.keptBy === "string" ? item.keptBy : undefined,
        }];
      }) : [];
      setChargeOptions(parsedChargeOptions.length ? parsedChargeOptions : DEFAULT_CHARGE_OPTIONS);
    } catch (error) {
      setOptionsError(true);
      toast.error(agentErrorMessage(error, "We couldn't load the listing options."));
      console.error("Agent listing form options failed to load:", error);
    } finally {
      setLoadingOptions(false);
    }
  }, []);

  useEffect(() => {
    void loadOptions();
  }, [loadOptions]);

  const update = <K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) =>
    setDraft((current) => ({ ...current, [key]: value }));

  const currentAmenities = splitLines(draft.amenities);
  const currentRules = splitLines(draft.rules);
  const currentBills = splitLines(draft.bills);
  const customAmenities = currentAmenities.filter((item) => !amenityOptions.includes(item));
  const customRules = currentRules.filter((item) => !ruleOptions.includes(item));
  const customBills = currentBills.filter((item) => !billOptions.includes(item));
  const specialNotes = splitLines(draft.specialNotes);
  const chargeTotal = draft.charges.reduce((total, charge) => total + (Number(charge.amount) || 0), 0);
  const propertyCost = Number(draft.price) || 0;
  const serviceCharge = serviceChargeFor(propertyCost);
  const isRentalListing = ["rent", "short_let", "lease"].includes(draft.purpose);
  const landTitleOptions = draft.landTitle && !LAND_TITLE_OPTIONS.some((option) => option.value === draft.landTitle)
    ? [{ label: draft.landTitle, value: draft.landTitle }, ...LAND_TITLE_OPTIONS]
    : LAND_TITLE_OPTIONS;
  const toggleLineValue = (key: "amenities" | "rules" | "bills", value: string) => {
    const values = splitLines(draft[key]);
    update(key, (values.includes(value) ? values.filter((item) => item !== value) : [...values, value]).join("\n"));
  };
  const addListEntry = (key: "amenities" | "rules" | "bills", value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;
    const values = splitLines(draft[key]);
    if (!values.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      update(key, [...values, trimmed].join("\n"));
    }
    if (key === "amenities") setAmenityEntry("");
    if (key === "rules") setRuleEntry("");
    if (key === "bills") setBillEntry("");
  };
  const addSpecialNote = () => {
    const note = specialNoteEntry.trim();
    if (!note) return;
    if (!specialNotes.some((item) => item.toLowerCase() === note.toLowerCase())) {
      update("specialNotes", [...specialNotes, note].join("\n"));
    }
    setSpecialNoteEntry("");
  };
  const removeSpecialNote = (note: string) =>
    update("specialNotes", specialNotes.filter((item) => item !== note).join("\n"));
  const photos = splitLines(draft.photos);
  const documents = splitLines(draft.documents);
  const completionItems = [
    { label: "Property title", complete: Boolean(draft.title.trim()), tab: "general" as EditorTab },
    { label: "Property type", complete: Boolean(draft.typeId), tab: "general" as EditorTab },
    { label: "Description", complete: Boolean(descriptionText(draft.description)), tab: "general" as EditorTab },
    { label: "Price", complete: Number(draft.price) > 0, tab: "price" as EditorTab },
    { label: "Location", complete: Boolean(draft.state && draft.city && draft.area && draft.address), tab: "location" as EditorTab },
    { label: "At least one photo", complete: photos.length > 0, tab: "media" as EditorTab },
  ];
  const completionCount = completionItems.filter((item) => item.complete).length;
  const completionPercent = Math.round((completionCount / completionItems.length) * 100);
  const activeTabIndex = EDITOR_TABS.findIndex((tab) => tab.value === activeTab);
  const previousTab = activeTabIndex > 0 ? EDITOR_TABS[activeTabIndex - 1] : null;
  const nextTab = activeTabIndex < EDITOR_TABS.length - 1 ? EDITOR_TABS[activeTabIndex + 1] : null;

  const addPhotoFiles = async (files: FileList | File[]) => {
    const selectedFiles = Array.from(files);
    if (!selectedFiles.length) return;
    const remainingSlots = Math.max(0, 20 - photos.length);
    if (selectedFiles.length > remainingSlots) {
      toast.error("You can add up to 20 photos.");
    }
    const filesWithinLimit = selectedFiles.slice(0, remainingSlots);
    const imageFiles = filesWithinLimit.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length !== filesWithinLimit.length) {
      toast.error("Choose image files only.");
    }
    const sizeValidFiles = imageFiles.filter((file) => file.size <= 25 * 1024 * 1024);
    if (sizeValidFiles.length !== imageFiles.length) {
      toast.error("Each photo must be 25MB or smaller.");
    }
    if (!sizeValidFiles.length) return;

    setPhotoUploading(true);
    try {
      const dataUrls = await Promise.all(sizeValidFiles.map(readFileAsDataUrl));
      setDraft((current) => ({
        ...current,
        photos: [...splitLines(current.photos), ...dataUrls].join("\n"),
      }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't read the selected photos.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const setPrimaryPhoto = (index: number) => {
    if (index > 0) {
      update("photos", [photos[index], ...photos.filter((_, photoIndex) => photoIndex !== index)].join("\n"));
    }
    setActivePhotoActions(null);
  };

  const startPhotoLongPress = (index: number) => {
    if (photoLongPressTimer.current !== null) window.clearTimeout(photoLongPressTimer.current);
    photoLongPressTimer.current = window.setTimeout(() => {
      setActivePhotoActions(index);
      photoLongPressTimer.current = null;
    }, 500);
  };

  const cancelPhotoLongPress = () => {
    if (photoLongPressTimer.current !== null) {
      window.clearTimeout(photoLongPressTimer.current);
      photoLongPressTimer.current = null;
    }
  };

  const addDocumentFile = async (file?: File) => {
    if (!file) return;
    const extension = file.name.split(".").pop()?.toLowerCase();
    if (!extension || !["pdf", "doc", "docx"].includes(extension)) {
      toast.error("Choose a PDF, DOC or DOCX file.");
      return;
    }
    if (file.size > 25 * 1024 * 1024) {
      toast.error("Documents must be 25MB or smaller.");
      return;
    }

    setDocumentUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      setDraft((current) => ({
        ...current,
        documents: [dataUrl, ...splitLines(current.documents)].join("\n"),
      }));
      setDocumentLabels((current) => ({ ...current, [dataUrl]: file.name }));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't read that document.");
    } finally {
      setDocumentUploading(false);
    }
  };

  const removeAsset = (kind: "photo" | "document", index: number) => {
    const values = kind === "photo" ? photos : documents;
    const removed = values[index];
    const next = values.filter((_, itemIndex) => itemIndex !== index);
    update(kind === "photo" ? "photos" : "documents", next.join("\n"));
    if (kind === "photo") setActivePhotoActions(null);
    if (kind === "document" && removed) {
      setDocumentLabels((current) => {
        const { [removed]: _removed, ...remaining } = current;
        return remaining;
      });
    }
  };

  const addCharge = (option: AgentPropertyCharge) => {
    if (draft.charges.some((charge) => charge.name.toLowerCase() === option.name.toLowerCase())) return;
    update("charges", [...draft.charges, { ...option, amount: option.amount ?? 0 }]);
  };

  const addCustomCharge = () => {
    const name = customChargeName.trim();
    if (!name) return;
    if (draft.charges.some((charge) => charge.name.toLowerCase() === name.toLowerCase())) {
      toast.error("That charge is already on this listing.");
      return;
    }
    update("charges", [...draft.charges, { name, amount: 0 }]);
    setCustomChargeName("");
    setCustomChargeOpen(false);
  };

  const save = async (targetStatus: "draft" | "published") => {
    if (targetStatus === "published") {
      const firstIncomplete = completionItems.find((item) => !item.complete && item.label !== "At least one photo");
      if (firstIncomplete) {
        selectTab(firstIncomplete.tab);
        toast.error(`Please complete ${firstIncomplete.label.toLowerCase()} before sending for approval.`);
        return;
      }
    }
    setSaving(true);
    const customFields = { ...(property?.customFields ?? {}) };
    if (draft.landTitle.trim()) customFields.landTitle = draft.landTitle;
    else delete customFields.landTitle;
    if (draft.specialNotes.trim()) customFields.specialNotes = draft.specialNotes.trim();
    else delete customFields.specialNotes;
    const payload: AgentPropertyPayload = {
      title: draft.title.trim(),
      description: sanitizeDescriptionHtml(draft.description),
      typeId: draft.typeId,
      purpose: draft.purpose,
      price: Number(draft.price) || 0,
      currency: draft.currency,
      pricePeriod: draft.pricePeriod,
      term: isRentalListing && draft.rentalTermValue && Number(draft.rentalTermValue) > 0
        ? { value: Number(draft.rentalTermValue), unit: draft.rentalTermUnit }
        : null,
      location: {
        state: draft.state.trim(),
        city: draft.city.trim(),
        area: draft.area.trim(),
        address: draft.address.trim(),
        nearby: draft.nearby.trim(),
        ...(draft.lat && draft.lng && Number.isFinite(Number(draft.lat)) && Number.isFinite(Number(draft.lng))
          ? { lat: Number(draft.lat), lng: Number(draft.lng) }
          : {}),
      },
      bedrooms: draft.bedrooms ? Number(draft.bedrooms) : null,
      bathrooms: draft.bathrooms ? Number(draft.bathrooms) : null,
      amenities: splitLines(draft.amenities),
      photos,
      documents,
      charges: draft.charges,
      rules: splitLines(draft.rules),
      bills: splitLines(draft.bills),
      sharing: draft.sharing,
      peoplePerRoom: draft.peoplePerRoom ? Number(draft.peoplePerRoom) || null : null,
      places: draft.units ? Number(draft.units) || 1 : 1,
      sizeSqm: draft.sizeSqm ? Number(draft.sizeSqm) : null,
      videoUrl: draft.videoUrl.trim() || null,
      customFields,
      status: targetStatus,
      ...(draft.visitFeeMode === "free"
        ? { visitFeeOverride: 0 }
        : draft.visitFeeMode === "custom" && draft.visitFeeOverride
          ? { visitFeeOverride: Number(draft.visitFeeOverride) }
          : {}),
    };

    try {
      const response = property
        ? await agentAPI.updateProperty(property.id, payload)
        : await agentAPI.createProperty(payload);
      toast.success(response.message);
      onSaved();
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't save this listing. Please try again."));
      console.error("Agent listing save failed:", error);
    } finally {
      setSaving(false);
    }
  };

  const locateMe = () => {
    if (!navigator.geolocation) {
      toast.error("Location services are not available in this browser.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        update("lat", String(coords.latitude));
        update("lng", String(coords.longitude));
        toast.success("Map pin added.");
      },
      () => toast.error("We couldn't get your location. Check your location permission and try again."),
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  if (loadingOptions) {
    return <AgentListingEditorSkeleton title={property?.title ?? "New Property"} />;
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#d1d5db] font-sans text-[#111827] dark:bg-[#121212] dark:text-white">
      <section className="flex h-full w-full flex-col overflow-hidden bg-[#d1d5db] text-[#111827] dark:bg-[#121212] dark:text-white" role="dialog" aria-modal="true" aria-labelledby="agent-listing-form-title">
        <header className="flex min-h-14 shrink-0 items-center justify-between gap-[13px] border-b border-[#e5e7eb] bg-white px-5 dark:border-white/10 dark:bg-[#1a1a1a] max-[700px]:px-3.5">
          <div className="flex min-w-0 flex-1 items-center gap-2.5">
            <h2 id="agent-listing-form-title" className="m-0 truncate text-lg font-bold text-[#111827] dark:text-white max-[700px]:text-base">{property ? property.title : "New Property"}</h2>
            <span className={`inline-flex min-h-6 shrink-0 items-center whitespace-nowrap rounded-full px-2.5 text-[11px] font-semibold ${statusPillClasses[draft.status] ?? statusPillClasses.draft}`}>
              {statusLabel(draft.status)}
            </span>
          </div>
          <button className="grid h-8 w-8 shrink-0 place-items-center bg-transparent text-[#4b5563] dark:text-[#9ca3af] disabled:cursor-not-allowed disabled:opacity-60" type="button" aria-label="Close form" onClick={onClose} disabled={saving}><X size={19} /></button>
        </header>

        <nav className="flex min-h-[41px] shrink-0 items-stretch justify-start gap-2 overflow-x-auto border-b border-[#e5e7eb] bg-white px-5 [scrollbar-width:none] dark:border-white/10 dark:bg-[#1a1a1a] max-[700px]:gap-1 max-[700px]:px-3 [&::-webkit-scrollbar]:hidden" aria-label="Property listing sections">
          {EDITOR_TABS.map(({ value, label, icon: Icon }) => (
            <button type="button" key={value} className={`relative flex min-h-10 min-w-max items-center gap-2 border px-[15px] text-sm [&>svg]:shrink-0 max-[700px]:gap-1.5 max-[700px]:px-[9px] max-[700px]:text-[11px] ${activeTab === value ? "border-[#e5e7eb] bg-white font-bold text-[#111827] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white" : "border-transparent bg-transparent text-[#4b5563] dark:text-[#9ca3af]"}`} onClick={() => selectTab(value)}>
              <Icon size={16} />
              <span>{label}</span>
              {value === "media" && photos.length > 0 && (
                <span className="inline-grid h-4 min-w-4 place-items-center rounded-full bg-[#b79bff]/12 px-1 text-[10px] font-semibold text-[#b79bff] dark:bg-[#b79bff]/15 dark:text-[#b79bff]">
                  {photos.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {!optionsError && (
          <div className="hidden shrink-0 border-b border-[#e5e7eb] bg-white px-3.5 py-2 dark:border-white/10 dark:bg-[#1a1a1a] max-[700px]:block">
            <button
              type="button"
              aria-expanded={mobileProgressOpen}
              onClick={() => setMobileProgressOpen((open) => !open)}
              className="flex w-full items-center gap-2.5 border-0 bg-transparent p-0 text-left"
            >
              <span className="text-[11px] font-semibold text-[#111827] dark:text-white whitespace-nowrap">
                {completionCount}/{completionItems.length} details
              </span>
              <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-[#f3f4f6] dark:bg-[#232323]">
                <span className="block h-full rounded-full bg-[#b79bff] transition-[width] duration-180" style={{ width: `${completionPercent}%` }} />
              </span>
              <span className="text-[11px] font-bold text-[#b79bff] dark:text-[#b79bff]">{completionPercent}%</span>
              <ChevronDown size={15} className={`shrink-0 text-[#4b5563] transition-transform duration-150 dark:text-[#9ca3af] ${mobileProgressOpen ? "rotate-180" : ""}`} />
            </button>
            {mobileProgressOpen && (
              <ul className="mt-2.5 grid list-none gap-2 border-t border-[#e5e7eb] pt-2.5 pl-0 dark:border-white/10">
                {completionItems.map((item) => (
                  <li key={item.label} className={`flex items-center gap-2 text-[11px] text-[#4b5563] dark:text-[#9ca3af] ${item.complete ? "[&>span]:border-[#b79bff] [&>span]:bg-[#b79bff] [&>span]:text-white" : ""}`}>
                    <span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-[#e5e7eb] dark:border-white/10">{item.complete ? <Check size={11} /> : null}</span>
                    <span>{item.label}</span>
                    <button type="button" className="ml-auto border-0 bg-transparent px-1 py-0.5 text-[11px] font-semibold text-[#b79bff] dark:text-[#b79bff]" onClick={() => selectTab(item.tab)}>
                      {item.complete ? "Edit" : "Add"}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {optionsError ? (
          <div className="grid flex-1 place-content-center gap-3 text-center text-sm text-[#4b5563] dark:text-[#9ca3af]">
            <p className="m-0">Listing options couldn’t be loaded.</p>
            <button type="button" className="inline-flex min-h-11 items-center justify-center gap-[7px] rounded-full border border-[#e5e7eb] bg-white px-4 text-[13px] font-semibold text-[#111827] transition-colors hover:border-[#b79bff] hover:text-[#b79bff] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white dark:hover:text-[#b79bff] disabled:cursor-wait disabled:opacity-60" onClick={() => void loadOptions()}>Try again</button>
          </div>
        ) : (
          <form ref={formRef} className="flex min-h-0 flex-1 flex-col" onSubmit={(event) => event.preventDefault()}>
            <div ref={scrollContainerRef} className="flex-1 overflow-y-auto pt-6 pb-8 max-[700px]:pt-3.5 max-[700px]:pb-5">
              <div className="mx-auto grid w-full max-w-[1440px] grid-cols-[minmax(0,1fr)_300px] items-start gap-[22px] px-4 sm:px-6 lg:px-10 max-[900px]:grid-cols-[minmax(0,1fr)_260px] max-[900px]:gap-3.5 max-[700px]:grid-cols-1">
                <div className={["general", "price", "details", "media"].includes(activeTab) ? "min-w-0" : "min-w-0 rounded-[10px] border border-[#e5e7eb] bg-white p-[25px_29px] dark:border-white/10 dark:bg-[#1a1a1a] max-[900px]:p-[21px] max-[700px]:p-[17px_14px]"}>
                  {activeTab === "general" && (
                    <div className="grid gap-3.5 p-0">
                      <section className={detailCardClass}>
                        <div className="mb-[7px] block text-xs font-semibold text-[#111827] dark:text-white [&_b]:text-[#c24e42]">Listed for <b>*</b></div>
                        <div className="mb-5 grid grid-cols-5 gap-2.5 max-[1000px]:grid-cols-3 max-[700px]:grid-cols-2 max-[700px]:gap-[7px]">
                          {PROPERTY_PURPOSES.map(([value, label]) => (
                            <label className={`flex min-h-12 items-center gap-[9px] rounded-[6px] border px-3 text-xs cursor-pointer [&>input]:m-0 [&>input]:accent-[#b79bff] max-[700px]:min-h-[41px] max-[700px]:gap-[7px] max-[700px]:px-[9px] max-[700px]:text-[10px] ${draft.purpose === value ? "border-[#b79bff] bg-[#b79bff]/10 text-[#b79bff] dark:bg-[#b79bff]/15 dark:text-[#b79bff]" : "border-[#e5e7eb] bg-white text-[#111827] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white"}`} key={value}>
                              <input type="radio" name="listing-purpose" value={value} checked={draft.purpose === value} onChange={() => update("purpose", value)} />
                              <span>{label}</span>
                            </label>
                          ))}
                        </div>
                        <label className={cardFieldClass}><span>Title <b>*</b></span>
                          <input className={cardInputClass} required maxLength={140} value={draft.title} onChange={(event) => update("title", event.target.value)} placeholder="e.g. 4 Bedroom Detached Duplex with BQ" />
                        </label>
                        <label className={cardFieldClass}><span>Property type <b>*</b></span>
                          <CustomDropdown
                            className={dropdownWrapFlushClass}
                            buttonClassName={dropdownTriggerClass}
                            menuClassName={dropdownMenuClass}
                            menuItemClassName={dropdownMenuItemClass}
                            placeholder="Select a type"
                            value={draft.typeId}
                            options={[{ label: "Select a type", value: "" }, ...types.map((type) => ({ label: type.name, value: type.id }))]}
                            onChange={(value) => update("typeId", value)}
                          />
                        </label>
                      </section>
                      <section className={detailCardClass}>
                        <div className={cardTitleClass}><FileText size={17} /><h3>Description</h3></div>
                        <AgentDescriptionEditor value={draft.description} onChange={(value) => update("description", value)} />
                        <small className="mt-1.5 block text-right text-[10px] text-[#6b7280] dark:text-[#9ca3af]">{descriptionText(draft.description).length} / 3,000 characters</small>
                      </section>
                    </div>
                  )}

                  {activeTab === "price" && (
                    <div className="grid gap-3.5 p-0">
                      <section className={detailCardClass}>
                        <div className={cardTitleClass}><CircleDollarSign size={17} /><h3>Price</h3></div>
                        <div className="grid grid-cols-[minmax(200px,1.4fr)_minmax(150px,0.8fr)_minmax(150px,0.8fr)] items-start gap-4 max-[1000px]:grid-cols-2 max-[1000px]:[&>label:first-child]:col-span-2 max-[700px]:grid-cols-1 max-[700px]:gap-0 max-[700px]:[&>label:first-child]:col-span-1">
                          <label className={cardFieldNoMarginClass}><span>Property cost <b>*</b></span>
                            <div className="flex min-h-[42px] items-center overflow-hidden rounded-[6px] border border-[#e5e7eb] bg-white dark:border-white/10 dark:bg-[#1a1a1a]"><span className="px-3 text-xs text-[#4b5563] dark:text-[#9ca3af]">{currencySymbol(draft.currency)}</span><input className="min-h-10 w-full min-w-0 flex-1 rounded-none border-0 border-l border-[#e5e7eb] bg-transparent px-3 py-0 text-xs text-[#111827] outline-none focus:border-[#b79bff] focus:ring-2 focus:ring-[#b79bff]/10 dark:border-white/10 dark:text-white dark:focus:ring-[#b79bff]/15" required type="number" min="1" step="1" value={draft.price} onChange={(event) => update("price", event.target.value)} placeholder="e.g. 85,000,000" /></div>
                          </label>
                          <label className={cardFieldNoMarginClass}><span>Currency</span>
                            <CustomDropdown
                              className={dropdownWrapPriceClass}
                              buttonClassName={dropdownTriggerClass}
                              menuClassName={dropdownMenuClass}
                              menuItemClassName={dropdownMenuItemClass}
                              placeholder="Naira (₦)"
                              value={draft.currency}
                              options={CURRENCY_OPTIONS}
                              onChange={(value) => update("currency", value)}
                            />
                          </label>
                          <label className={cardFieldNoMarginClass}><span>Price is</span>
                            <CustomDropdown
                              className={dropdownWrapPriceClass}
                              buttonClassName={dropdownTriggerClass}
                              menuClassName={dropdownMenuClass}
                              menuItemClassName={dropdownMenuItemClass}
                              placeholder="One-off"
                              value={draft.pricePeriod}
                              options={PRICE_PERIODS.map(([value, label]) => ({ label, value }))}
                              onChange={(value) => update("pricePeriod", value)}
                            />
                          </label>
                        </div>
                      </section>

                      {isRentalListing && (
                        <section className={detailCardClass}>
                          <div className={cardTitleClass}><CalendarClock size={17} /><h3>Rental term</h3></div>
                          <p className={explainerClass}>Set the length of the rental term for this property.</p>
                          <div className="overflow-visible rounded-[6px] border border-[#e5e7eb] dark:border-white/10">
                            <div className="grid min-h-[39px] grid-cols-[minmax(150px,1fr)_minmax(170px,0.75fr)] items-center gap-3 rounded-t-[5px] bg-[#f3f4f6] px-[13px] text-[10px] font-semibold text-[#4b5563] dark:bg-[#232323] dark:text-[#9ca3af] max-[700px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] max-[700px]:gap-2 max-[700px]:px-[9px]"><span>Rental term</span><span>Unit</span></div>
                            <div className="grid min-h-[60px] grid-cols-[minmax(150px,1fr)_minmax(170px,0.75fr)] items-center gap-3 border-t border-[#e5e7eb] px-[13px] py-[9px] dark:border-white/10 max-[700px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] max-[700px]:gap-2 max-[700px]:px-[9px]">
                              <label className="block"><span className="sr-only">Rental term length</span><input className={rentalInputClass} type="number" min="1" step="1" value={draft.rentalTermValue} onChange={(event) => update("rentalTermValue", event.target.value)} placeholder="Enter term" /></label>
                              <CustomDropdown
                                className="w-full"
                                buttonClassName={rentalTriggerClass}
                                menuClassName={dropdownMenuClass}
                                menuItemClassName={dropdownMenuItemClass}
                                placeholder="Years"
                                value={draft.rentalTermUnit}
                                options={RENTAL_TERM_UNITS.map((unit) => ({ label: unit.label, value: unit.value }))}
                                onChange={(value) => { if (isRentalTermUnit(value)) update("rentalTermUnit", value); }}
                              />
                            </div>
                          </div>
                        </section>
                      )}

                      <section className={detailCardClass}>
                        <div className={cardTitleClass}><CircleDollarSign size={17} /><h3>Charges</h3></div>
                        <p className={explainerClass}>Fees on top of the property price. The customer pays the total.</p>
                        <div className="overflow-visible rounded-[6px] border border-[#e5e7eb] dark:border-white/10">
                          <div className="grid min-h-[39px] grid-cols-[minmax(120px,1.15fr)_minmax(125px,0.85fr)_minmax(125px,0.85fr)_minmax(90px,0.55fr)_32px] items-center gap-3 bg-[#f3f4f6] px-[13px] text-[10px] font-semibold text-[#4b5563] dark:bg-[#232323] dark:text-[#9ca3af] max-[700px]:hidden"><span>Charge</span><span>Amount</span><span>Goes to</span><span>Refundable</span><span /></div>
                          {draft.charges.length ? draft.charges.map((charge, index) => (
                            <div className="grid min-h-[58px] grid-cols-[minmax(120px,1.15fr)_minmax(125px,0.85fr)_minmax(125px,0.85fr)_minmax(90px,0.55fr)_32px] items-center gap-3 border-t border-[#e5e7eb] px-[13px] py-2 focus-within:relative focus-within:z-20 dark:border-white/10 max-[700px]:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_32px] max-[700px]:gap-2 max-[700px]:p-2.5" key={`${charge.name}-${index}`}>
                              <strong className="min-w-0 text-[11px] font-semibold text-[#111827] dark:text-white max-[700px]:col-span-2">{charge.name}</strong>
                              <label className="flex min-h-9 min-w-0 items-center overflow-hidden rounded-[5px] border border-[#e5e7eb] bg-white pl-[9px] text-[11px] text-[#4b5563] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-[#9ca3af]"><span className="sr-only">{charge.name} amount</span><span>{currencySymbol(draft.currency)}</span><input className="w-full min-w-0 min-h-[34px] border-0 bg-transparent px-[7px] text-xs text-[#111827] outline-none dark:text-white" type="number" min="0" value={charge.amount ?? 0} onChange={(event) => update("charges", draft.charges.map((item, itemIndex) => itemIndex === index ? { ...item, amount: Number(event.target.value) } : item))} /></label>
                              <CustomDropdown
                                className="w-full max-[700px]:col-start-1"
                                buttonClassName={chargeRecipientTriggerClass}
                                menuClassName={dropdownMenuClass}
                                menuItemClassName={dropdownMenuItemClass}
                                placeholder="Choose..."
                                value={charge.keptBy ?? ""}
                                options={CHARGE_RECIPIENT_OPTIONS}
                                onChange={(value) => update("charges", draft.charges.map((item, itemIndex) => itemIndex === index ? { ...item, keptBy: value } : item))}
                              />
                              <label className="flex items-center gap-1.5 text-[11px] text-[#111827] dark:text-white [&>input]:accent-[#b79bff] max-[700px]:col-start-2"><input type="checkbox" checked={Boolean(charge.refundable)} onChange={(event) => update("charges", draft.charges.map((item, itemIndex) => itemIndex === index ? { ...item, refundable: event.target.checked } : item))} /><span>{charge.refundable ? "Yes" : "No"}</span></label>
                              <button type="button" className="grid h-[29px] w-[29px] place-items-center rounded-[5px] border-0 bg-transparent text-[#4b5563] cursor-pointer hover:bg-[#f3f4f6] hover:text-[#b34a42] dark:text-[#9ca3af] dark:hover:bg-[#232323] max-[700px]:col-start-3 max-[700px]:row-start-2" aria-label={`Remove ${charge.name}`} onClick={() => update("charges", draft.charges.filter((_, itemIndex) => itemIndex !== index))}><X size={15} /></button>
                            </div>
                          )) : <div className="border-t border-[#e5e7eb] p-[15px] text-[11px] text-[#4b5563] dark:border-white/10 dark:text-[#9ca3af]">No charges on this listing.</div>}
                          <div className="grid grid-cols-[1fr_auto] gap-x-[18px] gap-y-2 border-t border-[#e5e7eb] bg-[#f3f4f6] p-[13px] text-[11px] text-[#4b5563] dark:border-white/10 dark:bg-[#232323] dark:text-[#9ca3af] max-[700px]:gap-y-1"><span>Property cost</span><strong className="text-right text-xs text-[#111827] dark:text-white">{money(propertyCost, draft.currency)}</strong><span>Charges</span><strong className="text-right text-xs text-[#111827] dark:text-white">{money(chargeTotal, draft.currency)}</strong><span>Service charge (5%)</span><strong className="text-right text-xs text-[#111827] dark:text-white">{money(serviceCharge, draft.currency)}</strong><span className="border-t border-[#e5e7eb] pt-[7px] font-bold text-[#111827] dark:border-white/10 dark:text-white">Customer pays</span><strong className="border-t border-[#e5e7eb] pt-[7px] text-right text-xs font-bold text-[#111827] dark:border-white/10 dark:text-white">{money(propertyCost + chargeTotal + serviceCharge, draft.currency)}</strong></div>
                        </div>
                        <div className="mt-[13px] flex flex-wrap gap-2 max-[700px]:gap-1.5">
                          {chargeOptions.filter((option) => !draft.charges.some((charge) => charge.name.toLowerCase() === option.name.toLowerCase())).map((option) => <button type="button" key={option.name} className="inline-flex min-h-[33px] items-center gap-[5px] rounded-[5px] border border-[#e5e7eb] bg-white px-[11px] text-[10px] text-[#111827] cursor-pointer hover:border-[#b79bff] hover:text-[#b79bff] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white dark:hover:text-[#b79bff] max-[700px]:min-h-[31px] max-[700px]:px-2 max-[700px]:text-[9px]" onClick={() => addCharge(option)}><Plus size={14} /> {option.name}</button>)}
                          <button type="button" className="inline-flex min-h-[33px] items-center gap-[5px] rounded-[5px] border border-[#e5e7eb] bg-white px-[11px] text-[10px] text-[#111827] cursor-pointer hover:border-[#b79bff] hover:text-[#b79bff] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white dark:hover:text-[#b79bff] max-[700px]:min-h-[31px] max-[700px]:px-2 max-[700px]:text-[9px]" onClick={() => setCustomChargeOpen((open) => !open)}><Plus size={14} /> Another charge</button>
                        </div>
                        {customChargeOpen && <div className="mt-[11px] flex gap-2 max-[700px]:flex-col max-[700px]:items-stretch"><input aria-label="Custom charge name" className={customChargeInputClass} value={customChargeName} onChange={(event) => setCustomChargeName(event.target.value)} placeholder="e.g. Estate levy" /><button type="button" className="min-h-[39px] rounded-[5px] border-0 bg-[#b79bff] px-[13px] text-xs font-semibold text-white cursor-pointer hover:bg-[#b79bff] disabled:cursor-not-allowed disabled:opacity-55" onClick={addCustomCharge} disabled={!customChargeName.trim()}>Add charge</button></div>}
                        <p className="my-2 mb-[13px] text-[10px] leading-normal text-[#6b7280] dark:text-[#9ca3af]">Refundable charges are held for the customer and returned later, like a caution fee.</p>
                      </section>

                      <section className={detailCardClass}>
                        <div className={cardTitleClass}><CalendarClock size={17} /><h3>Visit fee</h3></div>
                        <p className={explainerClass}>Choose the fee a visitor pays to book a viewing. This stays separate from the property price.</p>
                        <div className="grid grid-cols-3 gap-2 max-[1000px]:grid-cols-1">
                          <label className={`flex min-h-[57px] items-center gap-2.5 rounded-[7px] border p-[10px_12px] cursor-pointer [&>input]:accent-[#b79bff] ${draft.visitFeeMode === "default" ? "border-[#b79bff] bg-[#b79bff]/10 dark:bg-[#b79bff]/15" : "border-[#e5e7eb] dark:border-white/10"}`}><input type="radio" name="visit-fee" checked={draft.visitFeeMode === "default"} onChange={() => update("visitFeeMode", "default")} /><span className="grid gap-1"><strong className="text-xs text-[#111827] dark:text-white">Use default visit fee</strong><small className="text-[10px] text-[#4b5563] dark:text-[#9ca3af]">{defaultVisitFee === null ? "Use the fee set in your agent settings" : money(defaultVisitFee)}</small></span></label>
                          <label className={`flex min-h-[57px] items-center gap-2.5 rounded-[7px] border p-[10px_12px] cursor-pointer [&>input]:accent-[#b79bff] ${draft.visitFeeMode === "free" ? "border-[#b79bff] bg-[#b79bff]/10 dark:bg-[#b79bff]/15" : "border-[#e5e7eb] dark:border-white/10"}`}><input type="radio" name="visit-fee" checked={draft.visitFeeMode === "free"} onChange={() => update("visitFeeMode", "free")} /><span className="grid gap-1"><strong className="text-xs text-[#111827] dark:text-white">No visit fee</strong><small className="text-[10px] text-[#4b5563] dark:text-[#9ca3af]">Make property visits free</small></span></label>
                          <label className={`flex min-h-[57px] items-center gap-2.5 rounded-[7px] border p-[10px_12px] cursor-pointer [&>input]:accent-[#b79bff] ${draft.visitFeeMode === "custom" ? "border-[#b79bff] bg-[#b79bff]/10 dark:bg-[#b79bff]/15" : "border-[#e5e7eb] dark:border-white/10"}`}><input type="radio" name="visit-fee" checked={draft.visitFeeMode === "custom"} onChange={() => update("visitFeeMode", "custom")} /><span className="grid gap-1"><strong className="text-xs text-[#111827] dark:text-white">Set a different fee</strong><small className="text-[10px] text-[#4b5563] dark:text-[#9ca3af]">Enter a fee for this property</small></span></label>
                        </div>
                        {draft.visitFeeMode === "custom" && <label className={`${cardFieldClass} mt-3.5 max-w-[250px]`}><span>Visit fee amount</span><div className="flex min-h-[42px] items-center overflow-hidden rounded-[6px] border border-[#e5e7eb] bg-white dark:border-white/10 dark:bg-[#1a1a1a]"><span className="px-3 text-xs text-[#4b5563] dark:text-[#9ca3af]">{currencySymbol(draft.currency)}</span><input className="min-h-10 w-full min-w-0 flex-1 rounded-none border-0 border-l border-[#e5e7eb] bg-transparent px-3 py-0 text-xs text-[#111827] outline-none focus:border-[#b79bff] focus:ring-2 focus:ring-[#b79bff]/10 dark:border-white/10 dark:text-white dark:focus:ring-[#b79bff]/15" type="number" min="0" value={draft.visitFeeOverride} onChange={(event) => update("visitFeeOverride", event.target.value)} placeholder="e.g. 5,000" /></div></label>}
                      </section>
                    </div>
                  )}

                  {activeTab === "location" && (
                    <section>
                      <div className="mb-[23px] flex items-start justify-between gap-[15px]">
                        <div>
                          <h3 className="m-0 text-lg font-bold tracking-[-0.02em] text-[#111827] dark:text-white max-[700px]:text-base">Property location</h3>
                          <p className="mt-[5px] text-xs text-[#4b5563] dark:text-[#9ca3af] max-[700px]:max-w-[270px] max-[700px]:text-[10px] max-[700px]:leading-[1.45]">Where can people find this property?</p>
                        </div>
                        <span className="shrink-0 rounded-[5px] bg-[#f3f4f6] px-2 py-[5px] text-[10px] text-[#4b5563] dark:bg-[#232323] dark:text-[#9ca3af] max-[700px]:hidden">03 / 05</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-[15px] max-[700px]:grid-cols-1">
                        <label className={fieldClass}><span>State <b>*</b></span><input className={fieldInputClass} required value={draft.state} onChange={(event) => update("state", event.target.value)} placeholder="e.g. Lagos" /></label>
                        <label className={fieldClass}><span>City <b>*</b></span><input className={fieldInputClass} required value={draft.city} onChange={(event) => update("city", event.target.value)} placeholder="e.g. Lekki" /></label>
                        <label className={fieldClass}><span>Area <b>*</b></span><input className={fieldInputClass} required value={draft.area} onChange={(event) => update("area", event.target.value)} placeholder="e.g. Ikota" /></label>
                        <label className={fieldClass}><span>Nearby landmark</span><input className={fieldInputClass} value={draft.nearby} onChange={(event) => update("nearby", event.target.value)} placeholder="e.g. Mega Chicken" /></label>
                      </div>
                      <label className={fieldClass}><span>Street address <b>*</b></span><input className={fieldInputClass} required value={draft.address} onChange={(event) => update("address", event.target.value)} placeholder="e.g. 14 Admiral Close, Ikota" /></label>
                      <div className="mt-[17px] block rounded-[3px] border border-[#e5e7eb] bg-white p-[24px_27px_26px] dark:border-white/10 dark:bg-[#1a1a1a] max-[700px]:p-[18px_14px]">
                        <div className="flex items-center gap-2.5 text-[#111827] dark:text-white [&>svg]:text-[#4b5563] dark:[&>svg]:text-[#9ca3af]"><MapPin size={17} /><strong className="text-sm font-bold">Map pin</strong></div>
                        <p className="mt-[11px] mb-[19px] text-xs leading-normal text-[#4b5563] dark:text-[#9ca3af]">Stand at the property and use your location to mark it on a map.</p>
                        <button type="button" className="flex w-full min-h-[41px] items-center justify-center gap-2.5 rounded-[5px] border border-[#e5e7eb] bg-white px-3 text-xs font-semibold text-[#111827] cursor-pointer transition-[border-color,background-color] duration-150 hover:border-[#b79bff] hover:bg-[#b79bff]/10 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white dark:hover:bg-[#b79bff]/15" onClick={locateMe}><MapPin size={17} /> Use My Location</button>
                        {draft.lat && draft.lng && <small className="mt-2.5 block text-[10px] text-[#4b5563] dark:text-[#9ca3af]">Location pinned: {Number(draft.lat).toFixed(5)}, {Number(draft.lng).toFixed(5)}</small>}
                      </div>
                    </section>
                  )}

                  {activeTab === "details" && (
                    <div className="grid gap-3.5 p-0">
                      <section className={detailCardClass}>
                        <div className={cardTitleClass}><ListChecks size={17} /><h3>Rooms &amp; size</h3></div>
                        <div className="grid grid-cols-3 gap-x-[15px] max-[700px]:grid-cols-1">
                          <label className={cardFieldClass}><span>Bedrooms</span><input className={cardInputClass} type="number" min="0" step="1" value={draft.bedrooms} onChange={(event) => update("bedrooms", event.target.value)} placeholder="e.g. 4" /></label>
                          <label className={cardFieldClass}><span>Bathrooms</span><input className={cardInputClass} type="number" min="0" step="1" value={draft.bathrooms} onChange={(event) => update("bathrooms", event.target.value)} placeholder="e.g. 3" /></label>
                          <label className={cardFieldClass}><span>Size (sqm)</span><input className={cardInputClass} type="number" min="0" step="any" value={draft.sizeSqm} onChange={(event) => update("sizeSqm", event.target.value)} placeholder="e.g. 250" /></label>
                        </div>
                      </section>

                      <section className={detailCardClass}>
                        <div className={cardTitleClass}><Users size={17} /><h3>Sharing and units</h3></div>
                        <p className={explainerClass}>Set the number of people or separately available spaces on this listing. For shared rooms, enter how many people can occupy each room.</p>
                        <div className="grid grid-cols-3 gap-3 max-[700px]:grid-cols-1 max-[700px]:gap-2">
                          {[
                            { value: "whole", title: "Whole place", description: "One tenant or buyer takes all of it" },
                            { value: "shared_room", title: "Shared room", description: "People share a room, priced per person" },
                            { value: "shared_apartment", title: "Shared apartment", description: "People have a room each and share the rest" },
                          ].map((option) => (
                            <label className={`flex min-h-[70px] items-center gap-[9px] rounded-[7px] border p-[11px_12px] bg-white cursor-pointer transition-[border-color,background-color] duration-150 hover:border-[#b79bff] hover:bg-[#b79bff]/10 dark:bg-[#1a1a1a] dark:hover:bg-[#b79bff]/15 max-[700px]:min-h-[58px] ${draft.sharing === option.value ? "border-[#b79bff] bg-[#b79bff]/10 dark:bg-[#b79bff]/15" : "border-[#e5e7eb] dark:border-white/10"}`} key={option.value}>
                              <input className="m-0 h-[18px] w-[18px] shrink-0 accent-[#b79bff]" type="radio" name="property-sharing" value={option.value} checked={draft.sharing === option.value} onChange={() => update("sharing", option.value)} />
                              <span className="grid gap-[3px]"><strong className="text-xs font-semibold text-[#111827] dark:text-white">{option.title}</strong><small className="text-[10px] leading-[1.4] text-[#4b5563] dark:text-[#9ca3af]">{option.description}</small></span>
                            </label>
                          ))}
                        </div>
                        <div className="mt-[18px] grid grid-cols-2 gap-x-[15px] max-[700px]:grid-cols-1 [&>label]:max-w-[245px]">
                          <label className={cardFieldClass}><span>Units</span><input className={cardInputClass} type="number" min="1" value={draft.units} onChange={(event) => update("units", event.target.value)} /></label>
                          {draft.sharing === "shared_room" && <label className={cardFieldClass}><span>People per room</span><input className={cardInputClass} type="number" min="1" value={draft.peoplePerRoom} onChange={(event) => update("peoplePerRoom", event.target.value)} placeholder="e.g. 2" /></label>}
                        </div>
                      </section>

                      <section className={detailCardClass}>
                        <div className={cardTitleClass}><ListChecks size={17} /><h3>Amenities</h3></div>
                        <div className="mb-2.5 flex flex-wrap gap-2 max-[700px]:gap-1.5">
                          {amenityOptions.map((amenity) => {
                            const selected = currentAmenities.includes(amenity);
                            return <button type="button" key={amenity} aria-pressed={selected} className={`inline-flex min-h-[33px] items-center gap-[5px] rounded-full border px-3 text-xs text-[#111827] cursor-pointer transition-[border-color,background-color,color] duration-150 hover:border-[#b79bff] hover:text-[#b79bff] dark:text-white dark:hover:text-[#b79bff] max-[700px]:min-h-[30px] max-[700px]:px-[9px] max-[700px]:text-[10px] ${selected ? "border-[#b79bff] bg-[#b79bff] text-white hover:text-white dark:bg-[#b79bff] dark:text-white dark:hover:text-white" : "border-[#e5e7eb] bg-white dark:border-white/10 dark:bg-[#1a1a1a]"}`} onClick={() => toggleLineValue("amenities", amenity)}>{selected && <Check size={12} />}<span>{amenity}</span></button>;
                          })}
                        </div>
                        <div className="flex min-h-[72px] flex-wrap items-center gap-[7px] rounded-[5px] border border-[#e5e7eb] bg-white p-[10px_12px] dark:border-white/10 dark:bg-[#1a1a1a] max-[700px]:gap-1.5 max-[700px]:p-[9px]">
                          {customAmenities.map((amenity) => <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-[#f3f4f6] py-0 pr-2 pl-2.5 text-xs whitespace-nowrap text-[#111827] dark:bg-[#232323] dark:text-white max-[700px]:text-[10px]" key={amenity}>{amenity}<button type="button" aria-label={`Remove ${amenity}`} className="grid h-4 w-4 place-items-center rounded-full bg-transparent p-0 text-[#4b5563] cursor-pointer hover:bg-[#e5e7eb] hover:text-[#111827] dark:text-[#9ca3af] dark:hover:bg-white/10 dark:hover:text-white" onClick={() => toggleLineValue("amenities", amenity)}><X size={12} /></button></span>)}
                          <input className="w-auto min-w-[min(180px,100%)] min-h-8 flex-1 basis-[180px] border-0 bg-transparent px-1 text-xs text-[#111827] outline-none placeholder:text-[#4b5563] placeholder:opacity-100 dark:text-white dark:placeholder:text-[#9ca3af]" value={amenityEntry} onChange={(event) => setAmenityEntry(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); addListEntry("amenities", amenityEntry); } }} placeholder="Add others and press Enter" aria-label="Add other amenities" />
                        </div>
                      </section>

                      <section className={detailCardClass}>
                        <div className={cardTitleClass}><ListChecks size={17} /><h3>House rules</h3></div>
                        <div className="mb-2.5 flex flex-wrap gap-2 max-[700px]:gap-1.5">
                          {ruleOptions.map((rule) => {
                            const selected = currentRules.includes(rule);
                            return <button type="button" key={rule} aria-pressed={selected} className={`inline-flex min-h-[33px] items-center gap-[5px] rounded-full border px-3 text-xs text-[#111827] cursor-pointer transition-[border-color,background-color,color] duration-150 hover:border-[#b79bff] hover:text-[#b79bff] dark:text-white dark:hover:text-[#b79bff] max-[700px]:min-h-[30px] max-[700px]:px-[9px] max-[700px]:text-[10px] ${selected ? "border-[#b79bff] bg-[#b79bff] text-white hover:text-white dark:bg-[#b79bff] dark:text-white dark:hover:text-white" : "border-[#e5e7eb] bg-white dark:border-white/10 dark:bg-[#1a1a1a]"}`} onClick={() => toggleLineValue("rules", rule)}>{selected && <Check size={12} />}<span>{rule}</span></button>;
                          })}
                        </div>
                        <div className="flex min-h-[72px] flex-wrap items-center gap-[7px] rounded-[5px] border border-[#e5e7eb] bg-white p-[10px_12px] dark:border-white/10 dark:bg-[#1a1a1a] max-[700px]:gap-1.5 max-[700px]:p-[9px]">
                          {customRules.map((rule) => <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-[#f3f4f6] py-0 pr-2 pl-2.5 text-xs whitespace-nowrap text-[#111827] dark:bg-[#232323] dark:text-white max-[700px]:text-[10px]" key={rule}>{rule}<button type="button" aria-label={`Remove ${rule}`} className="grid h-4 w-4 place-items-center rounded-full bg-transparent p-0 text-[#4b5563] cursor-pointer hover:bg-[#e5e7eb] hover:text-[#111827] dark:text-[#9ca3af] dark:hover:bg-white/10 dark:hover:text-white" onClick={() => toggleLineValue("rules", rule)}><X size={12} /></button></span>)}
                          <input className="w-auto min-w-[min(180px,100%)] min-h-8 flex-1 basis-[180px] border-0 bg-transparent px-1 text-xs text-[#111827] outline-none placeholder:text-[#4b5563] placeholder:opacity-100 dark:text-white dark:placeholder:text-[#9ca3af]" value={ruleEntry} onChange={(event) => setRuleEntry(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); addListEntry("rules", ruleEntry); } }} placeholder="Add others and press Enter" aria-label="Add other house rules" />
                        </div>
                      </section>

                      <section className={detailCardClass}>
                        <div className={cardTitleClass}><ListChecks size={17} /><h3>Bills the tenant pays</h3></div>
                        <div className="mb-2.5 flex flex-wrap gap-2 max-[700px]:gap-1.5">
                          {billOptions.map((bill) => {
                            const selected = currentBills.includes(bill);
                            return <button type="button" key={bill} aria-pressed={selected} className={`inline-flex min-h-[33px] items-center gap-[5px] rounded-full border px-3 text-xs text-[#111827] cursor-pointer transition-[border-color,background-color,color] duration-150 hover:border-[#b79bff] hover:text-[#b79bff] dark:text-white dark:hover:text-[#b79bff] max-[700px]:min-h-[30px] max-[700px]:px-[9px] max-[700px]:text-[10px] ${selected ? "border-[#b79bff] bg-[#b79bff] text-white hover:text-white dark:bg-[#b79bff] dark:text-white dark:hover:text-white" : "border-[#e5e7eb] bg-white dark:border-white/10 dark:bg-[#1a1a1a]"}`} onClick={() => toggleLineValue("bills", bill)}>{selected && <Check size={12} />}<span>{bill}</span></button>;
                          })}
                        </div>
                        <div className="flex min-h-[72px] flex-wrap items-center gap-[7px] rounded-[5px] border border-[#e5e7eb] bg-white p-[10px_12px] dark:border-white/10 dark:bg-[#1a1a1a] max-[700px]:gap-1.5 max-[700px]:p-[9px]">
                          {customBills.map((bill) => <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-[#f3f4f6] py-0 pr-2 pl-2.5 text-xs whitespace-nowrap text-[#111827] dark:bg-[#232323] dark:text-white max-[700px]:text-[10px]" key={bill}>{bill}<button type="button" aria-label={`Remove ${bill}`} className="grid h-4 w-4 place-items-center rounded-full bg-transparent p-0 text-[#4b5563] cursor-pointer hover:bg-[#e5e7eb] hover:text-[#111827] dark:text-[#9ca3af] dark:hover:bg-white/10 dark:hover:text-white" onClick={() => toggleLineValue("bills", bill)}><X size={12} /></button></span>)}
                          <input className="w-auto min-w-[min(180px,100%)] min-h-8 flex-1 basis-[180px] border-0 bg-transparent px-1 text-xs text-[#111827] outline-none placeholder:text-[#4b5563] placeholder:opacity-100 dark:text-white dark:placeholder:text-[#9ca3af]" value={billEntry} onChange={(event) => setBillEntry(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); addListEntry("bills", billEntry); } }} placeholder="Add others and press Enter" aria-label="Add other bills" />
                        </div>
                      </section>

                      <section className={detailCardClass}>
                        <div className={cardTitleClass}><ListChecks size={17} /><h3>More details</h3></div>
                        <div className="mt-[3px] mb-[9px] [&>h4]:m-[0_0_9px] [&>h4]:text-[13px] [&>h4]:font-bold [&>h4]:text-[#111827] dark:[&>h4]:text-white [&>p]:m-[0_0_7px] [&>p]:text-xs [&>p]:text-[#111827] dark:[&>p]:text-white"><h4>Documents</h4><p>Land title</p></div>
                        <CustomDropdown
                          className={dropdownWrapClass}
                          buttonClassName={dropdownTriggerClass}
                          menuClassName={dropdownMenuClass}
                          menuItemClassName={dropdownMenuItemClass}
                          placeholder="Select..."
                          value={draft.landTitle}
                          options={landTitleOptions}
                          onChange={(value) => update("landTitle", value)}
                        />
                        <div className="mt-[5px] mb-[9px] [&>h4]:m-[0_0_9px] [&>h4]:text-[13px] [&>h4]:font-bold [&>h4]:text-[#111827] dark:[&>h4]:text-white [&>p]:m-[0_0_7px] [&>p]:text-xs [&>p]:text-[#111827] dark:[&>p]:text-white"><h4>Good to know</h4><p>Special notes</p></div>
                        <div className="flex min-h-[72px] flex-wrap items-center gap-[7px] rounded-[5px] border border-[#e5e7eb] bg-white p-[10px_12px] dark:border-white/10 dark:bg-[#1a1a1a] max-[700px]:gap-1.5 max-[700px]:p-[9px]">
                          {specialNotes.map((note) => <span className="inline-flex min-h-7 items-center gap-1.5 rounded-full bg-[#f3f4f6] py-0 pr-2 pl-2.5 text-xs whitespace-nowrap text-[#111827] dark:bg-[#232323] dark:text-white max-[700px]:text-[10px]" key={note}>{note}<button type="button" aria-label={`Remove ${note}`} className="grid h-4 w-4 place-items-center rounded-full bg-transparent p-0 text-[#4b5563] cursor-pointer hover:bg-[#e5e7eb] hover:text-[#111827] dark:text-[#9ca3af] dark:hover:bg-white/10 dark:hover:text-white" onClick={() => removeSpecialNote(note)}><X size={12} /></button></span>)}
                          <input className="w-auto min-w-[min(180px,100%)] min-h-8 flex-1 basis-[180px] border-0 bg-transparent px-1 text-xs text-[#111827] outline-none placeholder:text-[#4b5563] placeholder:opacity-100 dark:text-white dark:placeholder:text-[#9ca3af]" value={specialNoteEntry} onChange={(event) => setSpecialNoteEntry(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); addSpecialNote(); } }} placeholder="Type an item and press Enter" aria-label="Special notes" />
                        </div>
                      </section>
                    </div>
                  )}

                  {activeTab === "media" && (
                    <div className="grid gap-3.5 p-0">
                      <section className={detailCardClass}>
                        <div className="mb-3 flex items-start justify-between gap-3">
                          <div className={`${cardTitleClass} mb-0`}><ImagePlus size={17} /><h3>Property photos</h3></div>
                          <span className="rounded-full bg-[#f3f4f6] px-2.5 py-0.5 text-[11px] font-semibold text-[#111827] dark:bg-[#232323] dark:text-white">{photos.length}/20</span>
                        </div>
                        <p className={explainerClass}>Add up to 20 photos. The first photo appears as the primary cover image on listings.</p>
                        <input
                          ref={photoInputRef}
                          className="hidden"
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={(event) => {
                            void addPhotoFiles(event.target.files ?? []);
                            event.target.value = "";
                          }}
                        />
                        <div className="grid grid-cols-4 gap-2.5 max-[1000px]:grid-cols-3 max-[520px]:grid-cols-2">
                          {photos.map((url, index) => (
                            <div
                              className="group relative flex aspect-4/3 touch-pan-y flex-col items-center justify-center gap-[3px] overflow-hidden rounded-[6px] border border-solid border-[#e5e7eb] text-[#4b5563] cursor-pointer dark:border-white/10 dark:text-[#9ca3af]"
                              key={`${url}-${index}`}
                              data-actions-open={activePhotoActions === index ? "true" : undefined}
                              onTouchStart={() => startPhotoLongPress(index)}
                              onTouchEnd={cancelPhotoLongPress}
                              onTouchCancel={cancelPhotoLongPress}
                              onTouchMove={cancelPhotoLongPress}
                              onContextMenu={(event) => event.preventDefault()}
                            >
                              <img className="absolute inset-0 h-full w-full object-cover" src={url} alt={`Property photo ${index + 1}`} draggable={false} />
                              {index === 0 && <span className="absolute top-2 left-2 z-1 inline-flex min-h-6 items-center gap-1 rounded-full bg-[#22251e] px-2 text-[9px] font-semibold text-white"><Star size={12} fill="currentColor" />Primary</span>}
                              <div className="pointer-events-none absolute inset-0 z-2 flex flex-col items-center justify-center gap-[7px] bg-[rgb(255_255_255/68%)] p-2 opacity-0 transition-opacity duration-150 group-hover:pointer-events-auto group-hover:opacity-100 group-focus-within:pointer-events-auto group-focus-within:opacity-100 group-data-[actions-open=true]:pointer-events-auto group-data-[actions-open=true]:opacity-100 dark:bg-[rgb(18_18_18/68%)]">
                                {index > 0 && <button type="button" className="inline-flex w-[min(100%,135px)] min-h-8 items-center justify-center gap-[7px] rounded-[5px] border-0 bg-[#f3efdf] px-2 text-[10px] font-semibold text-[#25271f] cursor-pointer" onClick={() => setPrimaryPhoto(index)}><Star size={15} fill="currentColor" />Set Primary</button>}
                                <button type="button" className="inline-flex w-[min(100%,135px)] min-h-8 items-center justify-center gap-[7px] rounded-[5px] border-0 bg-[#b34a42] px-2 text-[10px] font-semibold text-white cursor-pointer" onClick={() => removeAsset("photo", index)}><X size={15} />Remove</button>
                              </div>
                            </div>
                          ))}
                          {photos.length < 20 && (
                            <button
                              type="button"
                              className={`relative flex aspect-4/3 w-full flex-col items-center justify-center gap-1 overflow-hidden rounded-[6px] border border-dashed border-[#e5e7eb] bg-white p-2 text-[#4b5563] cursor-pointer transition-[border-color,background-color] duration-150 hover:border-[#b79bff] hover:bg-[#b79bff]/10 disabled:cursor-wait dark:border-white/10 dark:bg-[#1a1a1a] dark:text-[#9ca3af] dark:hover:bg-[#b79bff]/15 ${photoDropActive ? "border-[#b79bff] bg-[#b79bff]/10 dark:border-[#b79bff] dark:bg-[#b79bff]/15" : ""}`}
                              disabled={photoUploading}
                              onClick={() => photoInputRef.current?.click()}
                              onDragEnter={(event) => { event.preventDefault(); setPhotoDropActive(true); }}
                              onDragOver={(event) => event.preventDefault()}
                              onDragLeave={(event) => {
                                if (event.currentTarget === event.target) setPhotoDropActive(false);
                              }}
                              onDrop={(event) => {
                                event.preventDefault();
                                setPhotoDropActive(false);
                                void addPhotoFiles(event.dataTransfer.files);
                              }}
                            >
                              <Upload className="text-[#b79bff] dark:text-[#b79bff]" size={22} />
                              <span className="text-[11px] font-semibold text-[#111827] dark:text-white">{photoUploading ? "Adding photos..." : photos.length ? "Add more" : "Add photos"}</span>
                              <span className="text-[10px] text-[#6b7280] dark:text-[#9ca3af]">Up to 25MB each</span>
                            </button>
                          )}
                        </div>
                      </section>

                      <section className={detailCardClass}>
                        <div className={cardTitleClass}><FileText size={17} /><h3>Video walkthrough</h3></div>
                        <label className={`${fieldClass} mb-0`}><span>Video link</span><input className={fieldInputClass} type="url" value={draft.videoUrl} onChange={(event) => update("videoUrl", event.target.value)} placeholder="https://youtube.com/watch?v=..." /><small className="mt-1.5 block text-[10px] text-[#6b7280] dark:text-[#9ca3af]">Add a public YouTube, Vimeo or property video URL.</small></label>
                      </section>

                      <section className={detailCardClass}>
                        <div className={cardTitleClass}><FileText size={17} /><h3>Documents</h3></div>
                        <p className={explainerClass}>Survey plan, title documents, floor plan... Only you and RewaCiti can see these.</p>
                        {documents.map((url, index) => {
                          let label: string | undefined = documentLabels[url];
                          if (!label && !url.startsWith("data:")) {
                            try {
                              label = decodeURIComponent(new URL(url).pathname.split("/").pop() || "");
                            } catch {
                              label = undefined;
                            }
                          }
                          label ||= `Document ${index + 1}`;
                          return (
                            <div className="mt-[7px] flex min-h-10 items-center gap-2 rounded-[6px] border border-[#e5e7eb] px-[7px] py-1 text-[#4b5563] dark:border-white/10 dark:text-[#9ca3af]" key={`${url.slice(0, 80)}-${index}`}>
                              <FileText size={17} />
                              <span className="min-w-0 flex-1 truncate text-[10px]" title={label}>{label}</span>
                              <button type="button" aria-label={`Remove ${label}`} className="grid h-[29px] w-[29px] place-items-center rounded-[5px] border-0 bg-transparent text-[#4b5563] cursor-pointer hover:bg-[#f3f4f6] hover:text-[#b34a42] dark:text-[#9ca3af] dark:hover:bg-[#232323]" onClick={() => removeAsset("document", index)}><Trash2 size={15} /></button>
                            </div>
                          );
                        })}
                        <input
                          ref={documentInputRef}
                          className="hidden"
                          type="file"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={(event) => {
                            void addDocumentFile(event.target.files?.[0]);
                            event.target.value = "";
                          }}
                        />
                        <button
                          type="button"
                          className={`mt-3 flex w-full min-h-40 flex-col items-center justify-center gap-2 rounded-[6px] border border-dashed border-[#e5e7eb] bg-white p-5 text-[#4b5563] cursor-pointer transition-[border-color,background-color] duration-150 hover:border-[#b79bff] hover:bg-[#b79bff]/10 disabled:cursor-wait dark:border-white/10 dark:bg-[#1a1a1a] dark:text-[#9ca3af] dark:hover:bg-[#b79bff]/15 ${documentDropActive ? "border-[#b79bff] bg-[#b79bff]/10 dark:border-[#b79bff] dark:bg-[#b79bff]/15" : ""}`}
                          disabled={documentUploading}
                          onClick={() => documentInputRef.current?.click()}
                          onDragEnter={(event) => { event.preventDefault(); setDocumentDropActive(true); }}
                          onDragOver={(event) => event.preventDefault()}
                          onDragLeave={(event) => {
                            if (event.currentTarget === event.target) setDocumentDropActive(false);
                          }}
                          onDrop={(event) => {
                            event.preventDefault();
                            setDocumentDropActive(false);
                            void addDocumentFile(event.dataTransfer.files[0]);
                          }}
                        >
                          <span className="mb-1 grid h-12 w-12 place-items-center rounded-full bg-[#b79bff]/10 text-[#b79bff] dark:bg-[#b79bff]/15 dark:text-[#b79bff]"><FileText size={22} /></span>
                          <strong className="text-[13px] font-semibold text-[#111827] dark:text-white">{documentUploading ? "Preparing document..." : "Add a document"}</strong>
                          <span className="text-[11px]">Click to upload or drag and drop</span>
                          <small className="text-[10px]">PDF, DOC, DOCX up to 25MB</small>
                        </button>
                      </section>
                    </div>
                  )}
                </div>

                <aside className="sticky top-0 grid gap-[13px] max-[700px]:hidden">
                  <section className="rounded-[9px] border border-[#e5e7eb] bg-white p-[17px] dark:border-white/10 dark:bg-[#1a1a1a]">
                    <div className="flex items-start justify-between gap-2.5 [&>div>h3]:m-0 [&>div>h3]:text-[13px] [&>div>h3]:font-bold [&>div>h3]:text-[#111827] dark:[&>div>h3]:text-white [&>div>p]:mt-1 [&>div>p]:text-[10px] [&>div>p]:text-[#4b5563] dark:[&>div>p]:text-[#9ca3af] [&>strong]:text-xs [&>strong]:text-[#111827] dark:[&>strong]:text-white"><div><h3>Completeness</h3><p>{completionCount} of {completionItems.length} details added</p></div><strong>{completionPercent}%</strong></div>
                    <div className="my-[15px] mb-[13px] h-[5px] overflow-hidden rounded-full bg-[#f3f4f6] dark:bg-[#232323]"><span className="block h-full rounded-full bg-[#b79bff] transition-[width] duration-180" style={{ width: `${completionPercent}%` }} /></div>
                    <ul className="m-0 grid list-none gap-[11px] p-0">{completionItems.map((item) => <li key={item.label} className={`flex items-center gap-[7px] text-[10px] text-[#4b5563] dark:text-[#9ca3af] ${item.complete ? "[&>span]:border-[#b79bff] [&>span]:bg-[#b79bff] [&>span]:text-white" : ""}`}><span className="grid h-4 w-4 shrink-0 place-items-center rounded-full border border-[#e5e7eb] dark:border-white/10">{item.complete ? <Check size={12} /> : null}</span>{item.label}<button type="button" className="ml-auto cursor-pointer border-0 bg-transparent px-1 py-0.5 text-[10px] font-semibold text-[#111827] hover:text-[#b79bff] dark:text-white dark:hover:text-[#b79bff]" onClick={() => selectTab(item.tab)}>{item.complete ? "Edit" : "Add"}</button></li>)}</ul>
                  </section>

                  <section className="rounded-[9px] border border-[#e5e7eb] bg-white p-[17px] dark:border-white/10 dark:bg-[#1a1a1a]">
                    <div className="flex items-center gap-3">
                      <div className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-[6px] bg-[#f3f4f6] text-[#4b5563] dark:bg-[#232323] dark:text-[#9ca3af]">
                        {photos[0] ? <img src={photos[0]} alt="" className="h-full w-full object-cover" /> : <ImagePlus size={18} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="m-0 text-[13px] font-bold text-[#111827] dark:text-white">Property photos</h3>
                        <p className="m-0 mt-0.5 text-[11px] text-[#4b5563] dark:text-[#9ca3af]">{photos.length} of 20 added</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => selectTab("media")}
                        className="shrink-0 cursor-pointer rounded-[6px] border border-[#e5e7eb] bg-white px-2.5 py-1.5 text-[11px] font-semibold text-[#111827] transition-colors hover:border-[#b79bff] hover:text-[#b79bff] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white dark:hover:text-[#b79bff]"
                      >
                        {photos.length ? "Manage" : "Add"}
                      </button>
                    </div>
                  </section>

                  <section className="flex items-start gap-[9px] rounded-md border border-[#b79bff]/10 bg-[#b79bff]/10 p-3 text-[#b79bff] dark:border-white/10 dark:bg-[#232323] dark:text-[#b79bff]"><Info className="shrink-0" size={17} /><p className="m-0 text-[10px] leading-normal">New listings are reviewed by RewaCiti before they appear on the website.</p></section>
                </aside>
              </div>

              {(previousTab || nextTab) && (
                <div className="mx-auto mt-5 flex w-full max-w-[1440px] items-center justify-between gap-3 px-4 sm:px-6 lg:px-10">
                  {previousTab ? (
                    <button
                      type="button"
                      onClick={() => selectTab(previousTab.value)}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-xs font-semibold text-[#111827] transition-colors hover:border-[#b79bff] hover:text-[#b79bff] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white dark:hover:text-[#b79bff]"
                    >
                      <ArrowLeft size={14} /> {previousTab.label}
                    </button>
                  ) : <span />}
                  {nextTab && (
                    <button
                      type="button"
                      onClick={() => selectTab(nextTab.value)}
                      className="inline-flex min-h-9 items-center gap-1.5 rounded-[6px] border border-[#e5e7eb] bg-white px-3 text-xs font-semibold text-[#111827] transition-colors hover:border-[#b79bff] hover:text-[#b79bff] dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white dark:hover:text-[#b79bff]"
                    >
                      Next: {nextTab.label} <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              )}
            </div>
            <footer className="flex min-h-[72px] shrink-0 items-center justify-between gap-3.5 border-t border-[#e5e7eb] bg-white px-[clamp(18px,4vw,58px)] py-[11px] dark:border-white/10 dark:bg-[#1a1a1a] max-[700px]:min-h-16 max-[700px]:gap-[7px] max-[700px]:px-3 max-[700px]:py-2 max-[700px]:pb-[max(8px,env(safe-area-inset-bottom))]">
              <button type="button" className="inline-flex min-h-10 items-center justify-center border-0 bg-transparent pr-[15px] text-[11px] font-semibold text-[#4b5563] cursor-pointer disabled:cursor-wait disabled:opacity-65 dark:text-[#9ca3af] max-[700px]:pr-2" onClick={onClose} disabled={saving}>Cancel</button>
              <div className="flex items-center gap-[9px] max-[700px]:gap-1.5">
                <button type="button" className="inline-flex min-h-10 items-center justify-center rounded-[6px] border border-[#e5e7eb] bg-white px-[15px] text-[11px] font-semibold text-[#111827] cursor-pointer disabled:cursor-wait disabled:opacity-65 dark:border-white/10 dark:bg-[#1a1a1a] dark:text-white max-[700px]:min-h-[37px] max-[700px]:px-[9px] max-[700px]:text-[10px]" onClick={() => void save("draft")} disabled={saving}>{saving ? "Saving…" : "Save as Draft"}</button>
                <button type="button" className="inline-flex min-h-10 items-center justify-center gap-[7px] rounded-[6px] border border-[#b79bff] bg-[#b79bff] px-[15px] text-[11px] font-semibold text-white cursor-pointer hover:bg-[#b79bff] disabled:cursor-wait disabled:opacity-65 max-[700px]:min-h-[37px] max-[700px]:px-[9px] max-[700px]:text-[10px]" onClick={() => void save("published")} disabled={saving}>{saving ? "Sending…" : "Send for Approval"} <ArrowRight size={16} /></button>
              </div>
            </footer>
          </form>
        )}
      </section>
    </div>
  );
};


export default AgentListingEditor;