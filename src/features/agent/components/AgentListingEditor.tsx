import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowRight, CalendarClock, Check, CircleDollarSign, FileText, Info, ListChecks, MapPin, Plus, Star, Trash2, Upload, Users, X } from "lucide-react";
import { toast } from "sonner";
import CustomDropdown from "../../properties/components/CustomDropdown";
import { agentAPI, agentErrorMessage, type AgentProperty, type AgentPropertyCharge, type AgentPropertyPayload, type AgentPropertyType } from "../services/agentAPI";
import { EDITOR_TABS, PROPERTY_PURPOSES, PRICE_PERIODS, CURRENCY_OPTIONS, RENTAL_TERM_UNITS, isRentalTermUnit, CHARGE_RECIPIENT_OPTIONS, DEFAULT_CHARGE_OPTIONS, LAND_TITLE_OPTIONS, DEFAULT_AMENITY_OPTIONS, DEFAULT_RULE_OPTIONS, DEFAULT_BILL_OPTIONS, currencySymbol, money, statusLabel, splitLines, readFileAsDataUrl, sanitizeDescriptionHtml, descriptionText } from "../utils/agentListingUtils";
import type { EditorTab } from "../utils/agentListingUtils";
import AgentDescriptionEditor from "./AgentDescriptionEditor";
import { blankDraft, draftFromProperty } from "../utils/agentListingDraft";
import type { ListingDraft } from "../utils/agentListingDraft";

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
  const formRef = useRef<HTMLFormElement>(null);

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
        setActiveTab(firstIncomplete.tab);
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

  return (
    <div className="fixed inset-0 z-50 bg-(--bg)">
      <section className="flex h-full w-full flex-col overflow-hidden bg-(--bg) text-(--text)" role="dialog" aria-modal="true" aria-labelledby="agent-listing-form-title">
        <header className="flex min-h-14 items-center justify-between gap-[13px] border-b border-border bg-(--surface) px-5 max-[700px]:px-3.5">
          <div className="min-w-0 flex-1">
            <h2 id="agent-listing-form-title" className="m-0 text-lg font-bold text-(--text) max-[700px]:text-base">{property ? property.title : "New Property"}</h2>
          </div>
          <button className="grid h-8 w-8 shrink-0 place-items-center bg-transparent text-muted disabled:cursor-not-allowed" type="button" aria-label="Close form" onClick={onClose} disabled={saving}><X size={19} /></button>
        </header>

        <nav className="flex min-h-[41px] shrink-0 items-stretch justify-start gap-2 overflow-x-auto border-b border-border bg-(--surface) px-5 max-[700px]:gap-1 max-[700px]:px-3" aria-label="Property listing sections">
          {EDITOR_TABS.map(({ value, label, icon: Icon }) => (
            <button type="button" key={value} className={`relative flex min-h-10 min-w-max items-center gap-2 border px-[15px] text-sm text-muted max-[700px]:gap-1.5 max-[700px]:px-[9px] max-[700px]:text-[11px] ${activeTab === value ? "border-border bg-(--surface) font-bold text-(--text)" : "border-transparent bg-transparent"}`} onClick={() => setActiveTab(value)}>
              <Icon size={16} /><span>{label}</span>
            </button>
          ))}
        </nav>

        {loadingOptions ? (
          <div className="agent-editor-message">Loading property types and listing options…</div>
        ) : optionsError ? (
          <div className="agent-editor-message agent-editor-message-error">
            <p>Listing options couldn’t be loaded.</p>
            <button type="button" className="agent-secondary-button" onClick={() => void loadOptions()}>Try again</button>
          </div>
        ) : (
          <form ref={formRef} className="agent-editor-form" onSubmit={(event) => event.preventDefault()}>
            <div className="agent-editor-scroll-area">
              <div className="agent-editor-columns">
                <div className={`agent-editor-content${["general", "price", "details"].includes(activeTab) ? " agent-editor-content-cards" : ""}`}>
                  {activeTab === "general" && (
                    <div className="agent-editor-details-content">
                      <section className="agent-editor-section agent-detail-card">
                        <div className="agent-editor-label">Listed for <b>*</b></div>
                        <div className="agent-purpose-radio-grid">
                          {PROPERTY_PURPOSES.map(([value, label]) => (
                            <label className={`agent-purpose-radio-card${draft.purpose === value ? " is-selected" : ""}`} key={value}>
                              <input type="radio" name="listing-purpose" value={value} checked={draft.purpose === value} onChange={() => update("purpose", value)} />
                              <span>{label}</span>
                            </label>
                          ))}
                        </div>
                        <label className="agent-editor-field"><span>Title <b>*</b></span>
                          <input required maxLength={140} value={draft.title} onChange={(event) => update("title", event.target.value)} placeholder="e.g. 4 Bedroom Detached Duplex with BQ" />
                        </label>
                        <label className="agent-editor-field"><span>Property type <b>*</b></span>
                          <CustomDropdown
                            className="agent-editor-custom-dropdown agent-editor-type-dropdown"
                            buttonClassName="agent-editor-custom-dropdown-trigger"
                            placeholder="Select a type"
                            value={draft.typeId}
                            options={[{ label: "Select a type", value: "" }, ...types.map((type) => ({ label: type.name, value: type.id }))]}
                            onChange={(value) => update("typeId", value)}
                          />
                        </label>
                      </section>
                      <section className="agent-editor-section agent-detail-card">
                        <div className="agent-detail-card-title"><FileText size={17} /><h3>Description</h3></div>
                        <AgentDescriptionEditor value={draft.description} onChange={(value) => update("description", value)} />
                        <small className="agent-editor-char-count">{descriptionText(draft.description).length} / 3,000 characters</small>
                      </section>
                    </div>
                  )}

                  {activeTab === "price" && (
                    <div className="agent-editor-details-content">
                      <section className="agent-editor-section agent-detail-card">
                        <div className="agent-detail-card-title"><CircleDollarSign size={17} /><h3>Price</h3></div>
                        <div className="agent-price-fields">
                          <label className="agent-editor-field"><span>Property cost <b>*</b></span>
                            <div className="agent-editor-input-prefix"><span>{currencySymbol(draft.currency)}</span><input required type="number" min="1" step="1" value={draft.price} onChange={(event) => update("price", event.target.value)} placeholder="e.g. 85,000,000" /></div>
                          </label>
                          <label className="agent-editor-field"><span>Currency</span>
                            <CustomDropdown
                              className="agent-editor-custom-dropdown"
                              buttonClassName="agent-editor-custom-dropdown-trigger"
                              placeholder="Naira (₦)"
                              value={draft.currency}
                              options={CURRENCY_OPTIONS}
                              onChange={(value) => update("currency", value)}
                            />
                          </label>
                          <label className="agent-editor-field"><span>Price is</span>
                            <CustomDropdown
                              className="agent-editor-custom-dropdown"
                              buttonClassName="agent-editor-custom-dropdown-trigger"
                              placeholder="One-off"
                              value={draft.pricePeriod}
                              options={PRICE_PERIODS.map(([value, label]) => ({ label, value }))}
                              onChange={(value) => update("pricePeriod", value)}
                            />
                          </label>
                        </div>
                      </section>

                      {isRentalListing && (
                        <section className="agent-editor-section agent-detail-card">
                          <div className="agent-detail-card-title"><CalendarClock size={17} /><h3>Rental term</h3></div>
                          <p className="agent-detail-explainer">Set the length of the rental term for this property.</p>
                          <div className="agent-rental-term-table">
                            <div className="agent-rental-term-header"><span>Rental term</span><span>Unit</span></div>
                            <div className="agent-rental-term-row">
                              <label className="agent-rental-term-value"><span className="agent-visually-hidden">Rental term length</span><input type="number" min="1" step="1" value={draft.rentalTermValue} onChange={(event) => update("rentalTermValue", event.target.value)} placeholder="Enter term" /></label>
                              <CustomDropdown
                                className="agent-rental-term-unit"
                                buttonClassName="agent-rental-term-unit-trigger"
                                placeholder="Years"
                                value={draft.rentalTermUnit}
                                options={RENTAL_TERM_UNITS.map((unit) => ({ label: unit.label, value: unit.value }))}
                                onChange={(value) => { if (isRentalTermUnit(value)) update("rentalTermUnit", value); }}
                              />
                            </div>
                          </div>
                        </section>
                      )}

                      <section className="agent-editor-section agent-detail-card">
                        <div className="agent-detail-card-title"><CircleDollarSign size={17} /><h3>Charges</h3></div>
                        <p className="agent-detail-explainer">Fees on top of the property price. The customer pays the total.</p>
                        <div className="agent-charges-table">
                          <div className="agent-charges-header"><span>Charge</span><span>Amount</span><span>Goes to</span><span>Refundable</span><span /></div>
                          {draft.charges.length ? draft.charges.map((charge, index) => (
                            <div className="agent-charges-row" key={`${charge.name}-${index}`}>
                              <strong>{charge.name}</strong>
                              <label className="agent-charge-amount"><span className="agent-visually-hidden">{charge.name} amount</span><span>{currencySymbol(draft.currency)}</span><input type="number" min="0" value={charge.amount ?? 0} onChange={(event) => update("charges", draft.charges.map((item, itemIndex) => itemIndex === index ? { ...item, amount: Number(event.target.value) } : item))} /></label>
                              <CustomDropdown
                                className="agent-charge-recipient"
                                buttonClassName="agent-charge-recipient-trigger"
                                placeholder="Choose..."
                                value={charge.keptBy ?? ""}
                                options={CHARGE_RECIPIENT_OPTIONS}
                                onChange={(value) => update("charges", draft.charges.map((item, itemIndex) => itemIndex === index ? { ...item, keptBy: value } : item))}
                              />
                              <label className="agent-charge-refundable"><input type="checkbox" checked={Boolean(charge.refundable)} onChange={(event) => update("charges", draft.charges.map((item, itemIndex) => itemIndex === index ? { ...item, refundable: event.target.checked } : item))} /><span>{charge.refundable ? "Yes" : "No"}</span></label>
                              <button type="button" aria-label={`Remove ${charge.name}`} onClick={() => update("charges", draft.charges.filter((_, itemIndex) => itemIndex !== index))}><X size={15} /></button>
                            </div>
                          )) : <div className="agent-charges-empty">No charges on this listing.</div>}
                          <div className="agent-charges-totals"><span>Property cost</span><strong>{money(propertyCost, draft.currency)}</strong><span>Customer pays</span><strong>{money(propertyCost + chargeTotal, draft.currency)}</strong></div>
                        </div>
                        <div className="agent-charge-shortcuts">
                          {chargeOptions.filter((option) => !draft.charges.some((charge) => charge.name.toLowerCase() === option.name.toLowerCase())).map((option) => <button type="button" key={option.name} onClick={() => addCharge(option)}><Plus size={14} /> {option.name}</button>)}
                          <button type="button" onClick={() => setCustomChargeOpen((open) => !open)}><Plus size={14} /> Another charge</button>
                        </div>
                        {customChargeOpen && <div className="agent-custom-charge-form"><input aria-label="Custom charge name" value={customChargeName} onChange={(event) => setCustomChargeName(event.target.value)} placeholder="e.g. Estate levy" /><button type="button" onClick={addCustomCharge} disabled={!customChargeName.trim()}>Add charge</button></div>}
                        <p className="agent-editor-hint">Refundable charges are held for the customer and returned later, like a caution fee.</p>
                      </section>

                      <section className="agent-editor-section agent-detail-card">
                        <div className="agent-detail-card-title"><CalendarClock size={17} /><h3>Visit fee</h3></div>
                        <p className="agent-detail-explainer">Choose the fee a visitor pays to book a viewing. This stays separate from the property price.</p>
                        <div className="agent-visit-fee-options">
                          <label className={draft.visitFeeMode === "default" ? "is-selected" : ""}><input type="radio" name="visit-fee" checked={draft.visitFeeMode === "default"} onChange={() => update("visitFeeMode", "default")} /><span><strong>Use default visit fee</strong><small>{defaultVisitFee === null ? "Use the fee set in your agent settings" : money(defaultVisitFee)}</small></span></label>
                          <label className={draft.visitFeeMode === "free" ? "is-selected" : ""}><input type="radio" name="visit-fee" checked={draft.visitFeeMode === "free"} onChange={() => update("visitFeeMode", "free")} /><span><strong>No visit fee</strong><small>Make property visits free</small></span></label>
                          <label className={draft.visitFeeMode === "custom" ? "is-selected" : ""}><input type="radio" name="visit-fee" checked={draft.visitFeeMode === "custom"} onChange={() => update("visitFeeMode", "custom")} /><span><strong>Set a different fee</strong><small>Enter a fee for this property</small></span></label>
                        </div>
                        {draft.visitFeeMode === "custom" && <label className="agent-editor-field agent-editor-visit-custom"><span>Visit fee amount</span><div className="agent-editor-input-prefix"><span>{currencySymbol(draft.currency)}</span><input type="number" min="0" value={draft.visitFeeOverride} onChange={(event) => update("visitFeeOverride", event.target.value)} placeholder="e.g. 5,000" /></div></label>}
                      </section>
                    </div>
                  )}

                  {activeTab === "location" && (
                    <section className="agent-editor-section">
                      <div className="agent-editor-section-heading"><div><h3>Property location</h3><p>Where can people find this property?</p></div><span>03 / 05</span></div>
                      <div className="agent-editor-field-grid">
                        <label className="agent-editor-field"><span>State <b>*</b></span><input required value={draft.state} onChange={(event) => update("state", event.target.value)} placeholder="e.g. Lagos" /></label>
                        <label className="agent-editor-field"><span>City <b>*</b></span><input required value={draft.city} onChange={(event) => update("city", event.target.value)} placeholder="e.g. Lekki" /></label>
                        <label className="agent-editor-field"><span>Area <b>*</b></span><input required value={draft.area} onChange={(event) => update("area", event.target.value)} placeholder="e.g. Ikota" /></label>
                        <label className="agent-editor-field"><span>Nearby landmark</span><input value={draft.nearby} onChange={(event) => update("nearby", event.target.value)} placeholder="e.g. Mega Chicken" /></label>
                      </div>
                      <label className="agent-editor-field"><span>Street address <b>*</b></span><input required value={draft.address} onChange={(event) => update("address", event.target.value)} placeholder="e.g. 14 Admiral Close, Ikota" /></label>
                      <div className="agent-editor-map-card">
                        <div className="agent-map-pin-heading"><MapPin size={17} /><strong>Map pin</strong></div>
                        <p>Stand at the property and use your location to mark it on a map.</p>
                        <button type="button" className="agent-map-pin-button" onClick={locateMe}><MapPin size={17} /> Use My Location</button>
                        {draft.lat && draft.lng && <small className="agent-map-pin-coordinates">Location pinned: {Number(draft.lat).toFixed(5)}, {Number(draft.lng).toFixed(5)}</small>}
                      </div>
                    </section>
                  )}

                  {activeTab === "details" && (
                    <div className="agent-editor-details-content">
                      <section className="agent-editor-section agent-detail-card">
                        <div className="agent-detail-card-title"><ListChecks size={17} /><h3>Rooms &amp; size</h3></div>
                        <div className="agent-editor-field-grid agent-editor-field-grid-3">
                          <label className="agent-editor-field"><span>Bedrooms</span><input type="number" min="0" step="1" value={draft.bedrooms} onChange={(event) => update("bedrooms", event.target.value)} placeholder="e.g. 4" /></label>
                          <label className="agent-editor-field"><span>Bathrooms</span><input type="number" min="0" step="1" value={draft.bathrooms} onChange={(event) => update("bathrooms", event.target.value)} placeholder="e.g. 3" /></label>
                          <label className="agent-editor-field"><span>Size (sqm)</span><input type="number" min="0" step="any" value={draft.sizeSqm} onChange={(event) => update("sizeSqm", event.target.value)} placeholder="e.g. 250" /></label>
                        </div>
                      </section>

                      <section className="agent-editor-section agent-detail-card">
                        <div className="agent-detail-card-title"><Users size={17} /><h3>Sharing and units</h3></div>
                        <p className="agent-detail-explainer">Set the number of people or separately available spaces on this listing. For shared rooms, enter how many people can occupy each room.</p>
                        <div className="agent-sharing-options">
                          {[
                            { value: "whole", title: "Whole place", description: "One tenant or buyer takes all of it" },
                            { value: "shared_room", title: "Shared room", description: "People share a room, priced per person" },
                            { value: "shared_apartment", title: "Shared apartment", description: "People have a room each and share the rest" },
                          ].map((option) => (
                            <label className={`agent-sharing-card${draft.sharing === option.value ? " is-selected" : ""}`} key={option.value}>
                              <input type="radio" name="property-sharing" value={option.value} checked={draft.sharing === option.value} onChange={() => update("sharing", option.value)} />
                              <span><strong>{option.title}</strong><small>{option.description}</small></span>
                            </label>
                          ))}
                        </div>
                        <div className="agent-editor-field-grid agent-sharing-number-fields">
                          <label className="agent-editor-field"><span>Units</span><input type="number" min="1" value={draft.units} onChange={(event) => update("units", event.target.value)} /></label>
                          {draft.sharing === "shared_room" && <label className="agent-editor-field"><span>People per room</span><input type="number" min="1" value={draft.peoplePerRoom} onChange={(event) => update("peoplePerRoom", event.target.value)} placeholder="e.g. 2" /></label>}
                        </div>
                      </section>

                      <section className="agent-editor-section agent-detail-card">
                        <div className="agent-detail-card-title"><ListChecks size={17} /><h3>Amenities</h3></div>
                        <div className="agent-detail-chip-list">
                          {amenityOptions.map((amenity) => {
                            const selected = currentAmenities.includes(amenity);
                            return <button type="button" key={amenity} aria-pressed={selected} className={selected ? "is-selected" : ""} onClick={() => toggleLineValue("amenities", amenity)}>{selected && <Check size={12} />}<span>{amenity}</span></button>;
                          })}
                        </div>
                        <div className="agent-detail-extra-list">
                          {customAmenities.map((amenity) => <span className="agent-detail-extra-chip" key={amenity}>{amenity}<button type="button" aria-label={`Remove ${amenity}`} onClick={() => toggleLineValue("amenities", amenity)}><X size={12} /></button></span>)}
                          <input value={amenityEntry} onChange={(event) => setAmenityEntry(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); addListEntry("amenities", amenityEntry); } }} placeholder="Add others and press Enter" aria-label="Add other amenities" />
                        </div>
                      </section>

                      <section className="agent-editor-section agent-detail-card">
                        <div className="agent-detail-card-title"><ListChecks size={17} /><h3>House rules</h3></div>
                        <div className="agent-detail-chip-list">
                          {ruleOptions.map((rule) => {
                            const selected = currentRules.includes(rule);
                            return <button type="button" key={rule} aria-pressed={selected} className={selected ? "is-selected" : ""} onClick={() => toggleLineValue("rules", rule)}>{selected && <Check size={12} />}<span>{rule}</span></button>;
                          })}
                        </div>
                        <div className="agent-detail-extra-list">
                          {customRules.map((rule) => <span className="agent-detail-extra-chip" key={rule}>{rule}<button type="button" aria-label={`Remove ${rule}`} onClick={() => toggleLineValue("rules", rule)}><X size={12} /></button></span>)}
                          <input value={ruleEntry} onChange={(event) => setRuleEntry(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); addListEntry("rules", ruleEntry); } }} placeholder="Add others and press Enter" aria-label="Add other house rules" />
                        </div>
                      </section>

                      <section className="agent-editor-section agent-detail-card">
                        <div className="agent-detail-card-title"><ListChecks size={17} /><h3>Bills the tenant pays</h3></div>
                        <div className="agent-detail-chip-list">
                          {billOptions.map((bill) => {
                            const selected = currentBills.includes(bill);
                            return <button type="button" key={bill} aria-pressed={selected} className={selected ? "is-selected" : ""} onClick={() => toggleLineValue("bills", bill)}>{selected && <Check size={12} />}<span>{bill}</span></button>;
                          })}
                        </div>
                        <div className="agent-detail-extra-list">
                          {customBills.map((bill) => <span className="agent-detail-extra-chip" key={bill}>{bill}<button type="button" aria-label={`Remove ${bill}`} onClick={() => toggleLineValue("bills", bill)}><X size={12} /></button></span>)}
                          <input value={billEntry} onChange={(event) => setBillEntry(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); addListEntry("bills", billEntry); } }} placeholder="Add others and press Enter" aria-label="Add other bills" />
                        </div>
                      </section>

                      <section className="agent-editor-section agent-detail-card">
                        <div className="agent-detail-card-title"><ListChecks size={17} /><h3>More details</h3></div>
                        <div className="agent-detail-subheading"><h4>Documents</h4><p>Land title</p></div>
                        <CustomDropdown
                          className="agent-editor-custom-dropdown"
                          buttonClassName="agent-editor-custom-dropdown-trigger"
                          placeholder="Select..."
                          value={draft.landTitle}
                          options={landTitleOptions}
                          onChange={(value) => update("landTitle", value)}
                        />
                        <div className="agent-detail-subheading agent-good-to-know"><h4>Good to know</h4><p>Special notes</p></div>
                        <div className="agent-detail-extra-list agent-good-to-know-entry">
                          {specialNotes.map((note) => <span className="agent-detail-extra-chip" key={note}>{note}<button type="button" aria-label={`Remove ${note}`} onClick={() => removeSpecialNote(note)}><X size={12} /></button></span>)}
                          <input value={specialNoteEntry} onChange={(event) => setSpecialNoteEntry(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); addSpecialNote(); } }} placeholder="Type an item and press Enter" aria-label="Special notes" />
                        </div>
                      </section>
                    </div>
                  )}

                  {activeTab === "media" && (
                    <section className="agent-editor-section">
                      <div className="agent-editor-section-heading"><div><h3>Video & documents</h3><p>Add a video walkthrough and relevant property documents.</p></div><span>05 / 05</span></div>
                      <label className="agent-editor-field"><span>Video link</span><input type="url" value={draft.videoUrl} onChange={(event) => update("videoUrl", event.target.value)} placeholder="https://youtube.com/watch?v=..." /><small>Add a public YouTube, Vimeo or property video URL.</small></label>
                      <div className="agent-editor-subsection">
                        <div className="agent-editor-subsection-heading"><div><h4>Documents</h4><p>Survey plan, title documents, floor plan... Only you and RewaCiti can see these.</p></div></div>
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
                            <div className="agent-editor-asset-row" key={`${url.slice(0, 80)}-${index}`}>
                              <FileText size={17} />
                              <span title={label}>{label}</span>
                              <button type="button" aria-label={`Remove ${label}`} onClick={() => removeAsset("document", index)}><Trash2 size={15} /></button>
                            </div>
                          );
                        })}
                        <input
                          ref={documentInputRef}
                          className="agent-document-file-input"
                          type="file"
                          accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                          onChange={(event) => {
                            addDocumentFile(event.target.files?.[0]);
                            event.target.value = "";
                          }}
                        />
                        <button
                          type="button"
                          className={`agent-document-dropzone${documentDropActive ? " is-active" : ""}`}
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
                            addDocumentFile(event.dataTransfer.files[0]);
                          }}
                        >
                          <span className="agent-document-dropzone-icon"><FileText size={24} /></span>
                          <strong>{documentUploading ? "Preparing document..." : "Add a document"}</strong>
                          <span>Click to upload or drag and drop</span>
                          <small>PDF, DOC, DOCX up to 25MB</small>
                        </button>
                      </div>
                    </section>
                  )}
                </div>

                <aside className="agent-editor-sidebar">
                  <section className="agent-editor-side-card">
                    <div className="agent-editor-side-heading"><div><h3>Completeness</h3><p>{completionCount} of {completionItems.length} details added</p></div><strong>{Math.round((completionCount / completionItems.length) * 100)}%</strong></div>
                    <div className="agent-editor-progress"><span style={{ width: `${(completionCount / completionItems.length) * 100}%` }} /></div>
                    <ul className="agent-editor-completeness-list">{completionItems.map((item) => <li key={item.label} className={item.complete ? "is-complete" : ""}><span>{item.complete ? <Check size={12} /> : null}</span>{item.label}<button type="button" onClick={() => setActiveTab(item.tab)}>{item.complete ? "Edit" : "Add"}</button></li>)}</ul>
                  </section>

                  <section className="agent-editor-side-card agent-editor-status-card">
                    <div className="agent-editor-side-heading">
                      <h3>Status</h3>
                      <span className={`agent-status-pill status-${draft.status}`}>{statusLabel(draft.status)}</span>
                    </div>
                  </section>

                  <section className="agent-editor-side-card agent-editor-photos-card">
                    <div className="agent-editor-side-heading"><div><h3>Property photos</h3><p>Add up to 20 property photos</p></div><strong>{photos.length}/20</strong></div>
                    <input
                      ref={photoInputRef}
                      className="agent-photo-file-input"
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={(event) => {
                        void addPhotoFiles(event.target.files ?? []);
                        event.target.value = "";
                      }}
                    />
                    <div className="agent-editor-photo-grid">
                      {photos.map((url, index) => (
                        <div
                          className={`agent-editor-photo-item${activePhotoActions === index ? " is-actions-open" : ""}`}
                          key={`${url}-${index}`}
                          onTouchStart={() => startPhotoLongPress(index)}
                          onTouchEnd={cancelPhotoLongPress}
                          onTouchCancel={cancelPhotoLongPress}
                          onTouchMove={cancelPhotoLongPress}
                          onContextMenu={(event) => event.preventDefault()}
                        >
                          <img src={url} alt={`Property photo ${index + 1}`} draggable={false} />
                          {index === 0 && <span className="agent-editor-photo-primary"><Star size={12} fill="currentColor" />Primary</span>}
                          <div className="agent-editor-photo-actions">
                            {index > 0 && <button type="button" className="agent-editor-photo-primary-action" onClick={() => setPrimaryPhoto(index)}><Star size={15} fill="currentColor" />Set Primary</button>}
                            <button type="button" className="agent-editor-photo-remove-action" onClick={() => removeAsset("photo", index)}><X size={15} />Remove</button>
                          </div>
                        </div>
                      ))}
                      {photos.length < 20 && (
                        <button
                          type="button"
                          className={`agent-editor-photo-add${photoDropActive ? " is-active" : ""}`}
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
                          <Upload size={22} />
                          <span>{photoUploading ? "Adding photos..." : "Add more"}</span>
                        </button>
                      )}
                    </div>
                  </section>
                  <section className="agent-editor-review-note"><Info size={17} /><p>New listings are reviewed by RewaCiti before they appear on the website.</p></section>
                </aside>
              </div>
            </div>
            <footer className="flex min-h-[72px] items-center justify-between gap-3.5 border-t border-border bg-(--surface) px-[clamp(18px,4vw,58px)] py-[11px] max-[700px]:min-h-16 max-[700px]:gap-[7px] max-[700px]:px-3 max-[700px]:py-2">
              <button type="button" className="inline-flex min-h-10 items-center justify-center gap-[7px] border-0 bg-transparent pr-[15px] text-[11px] font-semibold text-muted disabled:cursor-wait disabled:opacity-65" onClick={onClose} disabled={saving}>Cancel</button>
              <div className="flex items-center gap-[9px] max-[700px]:gap-1.5">
                <button type="button" className="inline-flex min-h-10 items-center justify-center gap-[7px] rounded-md border border-border bg-(--surface) px-[15px] text-[11px] font-semibold text-(--text) disabled:cursor-wait disabled:opacity-65 max-[700px]:min-h-[37px] max-[700px]:px-[9px] max-[700px]:text-[10px]" onClick={() => void save("draft")} disabled={saving}>{saving ? "Saving…" : "Save as Draft"}</button>
                <button type="button" className="inline-flex min-h-10 items-center justify-center gap-[7px] rounded-md border border-primary bg-primary px-[15px] text-[11px] font-semibold text-white disabled:cursor-wait disabled:opacity-65 max-[700px]:min-h-[37px] max-[700px]:px-[9px] max-[700px]:text-[10px]" onClick={() => void save("published")} disabled={saving}>{saving ? "Sending…" : property ? "Send for Approval" : "Send for Approval"} <ArrowRight size={16} /></button>
              </div>
            </footer>
          </form>
        )}
      </section>
    </div>
  );
};


export default AgentListingEditor;
