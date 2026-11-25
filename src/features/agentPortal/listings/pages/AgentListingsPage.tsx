import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, CalendarPlus, CalendarClock, ChevronDown, Clock3, Eye, EyeOff, Filter, ImagePlus, MapPin, MessageSquare, MoreHorizontal, MoreVertical, Pencil, Plus, Search, Star, X } from "lucide-react";
import { toast } from "sonner";
import CustomDropdown from "@/shared/components/CustomDropdown";
import { agentAPI, agentErrorMessage, type AgentAttention, type AgentProfile, type AgentProperty, type AgentPropertyCounts, type AgentPropertyType } from "@/features/agentPortal/common/services/agentAPI";
import { PAGE_SIZE, STATUS_FILTERS, PROPERTY_PURPOSES, compactMoney, money, statusLabel, periodLabel, periodShortLabel, purposeLabel } from "@/features/agentPortal/common/utils/agentListingUtils";
import type { ListingTab } from "@/features/agentPortal/common/utils/agentListingUtils";
import { Navigate, useNavigate } from "react-router";
import { Helmet } from "react-helmet-async";
import AgentPortalHeader from "@/features/agentPortal/common/components/AgentPortalHeader";
import { useAgentAuthStore } from "@/features/agentPortal/common/store/useAgentAuthStore";
import AgentListingEditor from "@/features/agentPortal/listings/components/AgentListingEditor";
import AgentListingEditorSkeleton from "@/features/agentPortal/listings/components/AgentListingEditorSkeleton";
import AgentPropertyOverview from "@/features/agentPortal/listings/components/AgentPropertyOverview";
import AgentAvailabilityEditor from "@/features/agentPortal/listings/components/AgentAvailabilityEditor";
import AgentBookVisitModal from "@/features/agentPortal/listings/components/AgentBookVisitModal";
import AgentWithdrawModal from "@/features/agentPortal/listings/components/AgentWithdrawModal";

/* ---------- Shared UI tokens ---------- */

const ui = {
  btn: "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 sm:h-10",
  btnPrimary: "bg-brand text-white shadow-sm hover:bg-brand/90",
  btnGhost: "bg-transparent text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-neutral-800",
  control: "h-11 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 dark:border-white/15 dark:bg-neutral-900 dark:text-white sm:h-10",
  card: "rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-neutral-900",
  muted: "text-gray-600 dark:text-gray-400",
  iconBtn: "grid h-9 w-9 shrink-0 place-items-center rounded-lg border-0 bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-neutral-800 dark:hover:text-white",
  th: "h-12 border-b border-gray-300 bg-gray-100 px-4 text-left text-xs font-semibold uppercase tracking-wide text-gray-600 dark:border-white/15 dark:bg-neutral-800 dark:text-gray-400",
  td: "h-[76px] border-b border-gray-200 px-4 py-3 align-middle text-sm text-gray-900 dark:border-white/10 dark:text-white",
};

const FILTER_DROPDOWN = {
  className: "w-full",
  buttonClassName: "h-10 w-full rounded-lg border border-gray-200 bg-white! px-3 text-left text-sm text-gray-900! hover:border-brand dark:border-white/10 dark:bg-neutral-900! dark:text-white!",
  menuClassName: "overflow-hidden rounded-xl border-gray-300! bg-white! text-gray-900! shadow-lg! dark:border-white/15! dark:bg-neutral-900! dark:text-white! [&>div]:max-h-60 [&>div]:overflow-x-hidden [&>div]:overflow-y-auto [&>div]:bg-white! dark:[&>div]:bg-neutral-900! [&>div]:[scrollbar-width:none] [&>div::-webkit-scrollbar]:hidden [&>div>button]:whitespace-normal",
  menuItemClassName: "block w-full bg-white! px-4 py-2.5 text-left text-sm whitespace-normal text-gray-900! transition hover:bg-gray-100! dark:bg-neutral-900! dark:text-white! dark:hover:bg-neutral-800!",
};

const STATUS_PILL_CLASSES: Record<string, string> = {
  published: "bg-green-100 text-green-800 dark:bg-green-500/15 dark:text-green-300",
  pending_approval: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  draft: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400",
  archived: "bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-400",
  sold: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  let: "bg-blue-100 text-blue-800 dark:bg-blue-500/15 dark:text-blue-300",
  reserved: "bg-violet-100 text-violet-800 dark:bg-violet-500/15 dark:text-violet-300",
};

const statusPillClass = (status: string) =>
  `inline-flex h-6 items-center rounded-full px-2.5 text-xs font-semibold whitespace-nowrap ${STATUS_PILL_CLASSES[status] ?? STATUS_PILL_CLASSES.draft}`;

/* ---------- Small components ---------- */

const Spinner = ({ size = 32, label = "Loading" }: { size?: number; label?: string }) => (
  <span role="status" className="inline-flex">
    <span
      className="animate-spin rounded-full border-[3px] border-gray-200 border-t-brand dark:border-white/10 dark:border-t-brand"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
    <span className="sr-only">{label}</span>
  </span>
);

const ActivityStats = ({ property }: { property: AgentProperty }) => {
  const items = [
    { label: "Views", Icon: Eye, value: property.views },
    { label: "Inquiries", Icon: MessageSquare, value: property.inquiryCount ?? 0 },
    { label: "Visits", Icon: CalendarClock, value: property.visitCount ?? 0 },
    { label: "Reviews", Icon: Star, value: property.rating.count },
  ];
  return (
    <ul className={`flex items-center gap-3 text-xs ${ui.muted}`}>
      {items.map(({ label, Icon, value }) => (
        <li key={label} title={label} className="inline-flex items-center gap-1 whitespace-nowrap">
          <Icon size={14} aria-hidden="true" className="text-gray-500 dark:text-gray-400" />
          <span className="sr-only">{label}:</span>
          {value}
        </li>
      ))}
    </ul>
  );
};

type ActionOption = { label: string; value: string; icon: ReactNode; danger?: boolean };

const RowActions = ({ title, options, onChange }: { title: string; options: ActionOption[]; onChange: (value: string) => void }) => (
  // Stops the click/keypress from also opening the row
  <div className="flex justify-end" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
    <CustomDropdown
      buttonClassName={`${ui.iconBtn} aria-expanded:bg-gray-100 aria-expanded:text-gray-900 dark:aria-expanded:bg-neutral-800 dark:aria-expanded:text-white max-sm:border max-sm:border-gray-200 dark:max-sm:border-white/10`}
      triggerContent={(
        <>
          <MoreVertical size={17} className="sm:hidden" />
          <MoreHorizontal size={19} className="max-sm:hidden" />
        </>
      )}
      ariaLabel={`Actions for ${title}`}
      placeholder=""
      value=""
      portal
      menuClassName="fixed z-40 grid max-h-[calc(100vh-16px)] w-[184px] overflow-y-auto rounded-lg border border-gray-200 bg-white p-1.5 text-left shadow-lg dark:border-white/10 dark:bg-neutral-900 [&>div]:grid [&_.is-danger]:text-red-700! [&_.is-danger:hover]:bg-red-50!"
      menuItemClassName="flex min-h-10 w-full items-center gap-2.5 rounded-md border-0 bg-transparent px-2.5 text-left text-sm text-gray-900! cursor-pointer hover:bg-gray-100! dark:text-white! dark:hover:bg-neutral-800! [&>svg]:shrink-0"
      menuWidth={184}
      options={options}
      onChange={onChange}
    />
  </div>
);

const roundButton =
  "cursor-pointer rounded-full border border-gray-300 bg-white p-2.5 text-gray-900 transition hover:border-[#703BF7] hover:text-[#703BF7] disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/20 dark:bg-[#101010] dark:text-white";

const FilterField = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="mb-4">
    <span className={`mb-1.5 block text-xs font-medium ${ui.muted}`}>{label}</span>
    {children}
  </div>
);

/* ---------- Page ---------- */

const AgentListingsPage = () => {
  const token = useAgentAuthStore((state) => state.token);
  const logout = useAgentAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [attention, setAttention] = useState<AgentAttention | null>(null);
  const [properties, setProperties] = useState<AgentProperty[]>([]);
  const [counts, setCounts] = useState<AgentPropertyCounts | null>(null);
  const [status, setStatus] = useState<ListingTab>("all");
  const [page, setPage] = useState(1);
  const pageSize = PAGE_SIZE;
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [purposeFilter, setPurposeFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [propertyTypes, setPropertyTypes] = useState<AgentPropertyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<AgentProperty | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [editLoading, setEditLoading] = useState(false);
  const [editLoadingTitle, setEditLoadingTitle] = useState("New Property");
  const [editingProperty, setEditingProperty] = useState<AgentProperty | null | undefined>(undefined);
  const [availabilityProperty, setAvailabilityProperty] = useState<AgentProperty | null>(null);
  const [bookVisitProperty, setBookVisitProperty] = useState<AgentProperty | null>(null);
  const [withdrawProperty, setWithdrawProperty] = useState<AgentProperty | null>(null);

  const loadProperties = useCallback(async () => {
    setLoading(true);
    setListError(false);
    try {
      const response = await agentAPI.getProperties({
        page,
        limit: pageSize,
        ...(status === "live" ? { status: "published" } :
          status === "pending_approval" || status === "draft" ? { status } : {}),
      });
      setProperties(response.data);
      setTotal(response.total);
    } catch (error) {
      setListError(true);
      toast.error(agentErrorMessage(error, "We couldn't load your listings. Please try again."));
      console.error("Agent listings failed to load:", error);
    } finally {
      setLoading(false);
    }
  }, [page, pageSize, status]);

  const loadCounts = useCallback(async () => {
    try {
      setCounts(await agentAPI.getPropertyCounts());
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't load your listing counts."));
      console.error("Agent listing counts failed to load:", error);
    }
  }, []);

  useEffect(() => {
    if (token) void loadProperties();
  }, [loadProperties, token]);

  useEffect(() => {
    if (!token) return;
    void loadCounts();
    void Promise.all([agentAPI.getMe(), agentAPI.getAttention(), agentAPI.getPropertyTypes()])
      .then(([profile, needsAttention, types]) => {
        setAgent(profile);
        setAttention(needsAttention);
        setPropertyTypes(types);
      })
      .catch((error: unknown) => {
        toast.error(agentErrorMessage(error, "We couldn't load your agent profile."));
        console.error("Agent profile failed to load:", error);
      });
  }, [loadCounts, token]);

  // Close the filter popover with Escape
  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setFiltersOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtersOpen]);

  const visibleProperties = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return properties.filter((property) => {
      if (status === "sold_let" && property.status !== "sold" && property.status !== "let") return false;
      if (typeFilter && property.typeId !== typeFilter) return false;
      if (purposeFilter && property.purpose !== purposeFilter) return false;
      if (!query) return true;
      return [
        property.title,
        property.sku,
        property.location.address,
        property.location.area,
        property.location.city,
        property.location.state,
      ].some((value) => value?.toLocaleLowerCase().includes(query));
    });
  }, [properties, purposeFilter, search, status, typeFilter]);

  if (!token) return <Navigate to="/agent/login" replace />;

  const handleLogout = () => {
    logout();
    navigate("/agent/login", { replace: true });
  };

  const openProperty = async (id: string) => {
    setDetailLoading(true);
    setSelectedProperty(null);
    try {
      setSelectedProperty(await agentAPI.getProperty(id));
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't open that listing. Please try again."));
      console.error("Agent listing detail failed to load:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const openPropertyForEdit = async (id: string, title = "New Property") => {
    setEditLoadingTitle(title);
    setEditLoading(true);
    try {
      setEditingProperty(await agentAPI.getProperty(id));
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't open that listing for editing. Please try again."));
      console.error("Agent listing edit failed to load:", error);
    } finally {
      setEditLoading(false);
    }
  };

  const refreshListings = () => {
    void loadProperties();
    void loadCounts();
  };

  const changeStatus = (nextStatus: ListingTab) => {
    setStatus(nextStatus);
    setPage(1);
  };

  const countForStatus = (filter: ListingTab) => {
    if (!counts) return "—";
    if (filter === "all") return counts.all;
    if (filter === "live") return counts.published;
    if (filter === "sold_let") return counts.sold + counts.let;
    return counts[filter];
  };

  const handleListingAction = (action: string, property: AgentProperty) => {
    if (action === "edit") void openPropertyForEdit(property.id, property.title);
    else if (action === "availability") setAvailabilityProperty(property);
    else if (action === "book") setBookVisitProperty(property);
    else if (action === "withdraw") setWithdrawProperty(property);
  };

  const actionOptions = (property: AgentProperty): ActionOption[] => [
    { label: "Edit", value: "edit", icon: <Pencil size={16} /> },
    { label: "Visiting hours", value: "availability", icon: <Clock3 size={16} /> },
    ...(property.status === "published" ? [
      { label: "Book a visit", value: "book", icon: <CalendarPlus size={16} /> },
      { label: "Take off the site", value: "withdraw", icon: <EyeOff size={16} />, danger: true },
    ] : []),
  ];

  const locationText = (property: AgentProperty) =>
    [property.location.area, property.location.city, property.location.state].filter(Boolean).join(", ") || "Location not added";

  const priceText = (property: AgentProperty) => periodShortLabel(property.pricePeriod) || periodLabel(property.pricePeriod);
  const typeName = (property: AgentProperty) => propertyTypes.find((type) => type.id === property.typeId)?.name ?? "Property";

  const activeFilterCount = Number(Boolean(typeFilter)) + Number(Boolean(purposeFilter));
  const isFiltering = Boolean(search || typeFilter || purposeFilter);
  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  const rowProps = (property: AgentProperty) => ({
    tabIndex: 0,
    "aria-label": `View details for ${property.title}`,
    onClick: () => void openProperty(property.id),
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        void openProperty(property.id);
      }
    },
  });

  const thumbnail = (property: AgentProperty, className: string, iconSize: number) => (
    <div className={`grid shrink-0 place-items-center overflow-hidden bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-gray-400 ${className}`}>
      {property.photos[0] ? <img className="h-full w-full object-cover" src={property.photos[0]} alt="" loading="lazy" /> : <ImagePlus size={iconSize} />}
    </div>
  );

  const emptyState = (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-5 py-10 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand/10 text-brand dark:bg-brand-light/15 dark:text-brand-light"><MapPin size={22} /></div>
      <h2 className="m-0 text-base font-semibold">
        {isFiltering ? "No matching properties" : status === "all" ? "No listings yet" : `No ${STATUS_FILTERS.find((item) => item.value === status)?.label.toLowerCase()} listings`}
      </h2>
      <p className={`mt-1.5 mb-5 text-sm ${ui.muted}`}>
        {isFiltering ? "Try changing your search or filters." : status === "all" ? "Add your first property to start managing it here." : "When you have listings in this category, they’ll appear here."}
      </p>
      {status === "all" && !isFiltering && (
        <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={() => setEditingProperty(null)}><Plus size={16} /> New listing</button>
      )}
    </div>
  );

  return (
    <div data-agent-scroll className="fixed inset-0 overflow-y-auto overscroll-contain bg-gray-300 font-sans text-gray-900 dark:bg-neutral-950 dark:text-white">
      <Helmet>
        <title>My listings | RewaCiti Agent Portal</title>
        <meta name="description" content="View and manage your RewaCiti property listings." />
      </Helmet>
      <AgentPortalHeader
        name={agent?.name ?? "Agent"}
        email={agent?.email}
        payoutCount={attention?.payouts}
        visitCount={attention?.bookings}
        activePage="listings"
        onViewProfile={() => navigate("/agent/profile")}
        onLogout={handleLogout}
      />

      {/* `isolate` keeps every z-index inside <main> contained so it can't climb over the header or modals */}
      <main className="isolate mx-auto min-h-[calc(100vh-64px)] w-full max-w-[1440px] px-4 pt-5 pb-24 sm:px-6 sm:pb-16 lg:px-10">
        {/* Page title */}
        <div className="mb-5 flex items-center justify-between gap-3 sm:items-start">
          <div className="min-w-0">
            <h1 className="m-0 text-xl font-bold tracking-tight sm:text-2xl">My listings</h1>
            <p className={`mt-1 text-sm ${ui.muted}`}>New listings are checked by RewaCiti before they go live.</p>
          </div>
          <button type="button" aria-label="New listing" className={`${ui.btn} ${ui.btnPrimary} max-sm:w-11 max-sm:px-0`} onClick={() => setEditingProperty(null)}>
            <Plus size={20} strokeWidth={2.4} /> <span className="max-sm:sr-only">New listing</span>
          </button>
        </div>

        {/* Status tabs */}
        <nav className="-mx-4 mb-4 overflow-x-auto border-b border-gray-400/60 px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 dark:border-white/15 [&::-webkit-scrollbar]:hidden" aria-label="Filter listings by status">
          <div className="flex min-w-max gap-1">
            {STATUS_FILTERS.map((filter) => {
              const active = status === filter.value;
              return (
                <button
                  type="button"
                  key={filter.value}
                  aria-current={active ? "page" : undefined}
                  onClick={() => changeStatus(filter.value)}
                  className={`-mb-px inline-flex h-11 items-center gap-2 border-b-2 px-3 text-sm whitespace-nowrap transition-colors ${active
                    ? "border-brand font-semibold text-gray-900 dark:border-brand-light dark:text-white"
                    : "border-transparent text-gray-700 hover:border-gray-400 hover:text-gray-900 dark:text-gray-400 dark:hover:border-white/30 dark:hover:text-white"}`}
                >
                  {filter.label}
                  <span className={`inline-grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-xs font-semibold ${active ? "bg-brand/10 text-brand dark:bg-brand-light/15 dark:text-brand-light" : "bg-gray-200 text-gray-700 dark:bg-neutral-800 dark:text-gray-400"}`}>
                    {countForStatus(filter.value)}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Search + filters */}
        <div className="mb-5 flex items-center gap-2 sm:gap-3">
          <label className={`${ui.control} flex min-w-0 flex-1 items-center gap-2 px-3 text-gray-500 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15 sm:max-w-md dark:text-gray-400`}>
            <Search size={17} aria-hidden="true" className="shrink-0" />
            <input
              type="search"
              aria-label="Search listings"
              placeholder="Search your listings..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full min-w-0 border-0 bg-transparent text-sm text-gray-900 outline-0 placeholder:text-gray-500 dark:text-white dark:placeholder:text-gray-400"
            />
            {search && (
              <button type="button" aria-label="Clear search" onClick={() => setSearch("")} className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800"><X size={15} /></button>
            )}
          </label>

          <div className="relative shrink-0">
            <button
              type="button"
              aria-expanded={filtersOpen}
              onClick={() => setFiltersOpen((open) => !open)}
              className={`${ui.control} inline-flex items-center gap-2 px-3.5 hover:border-brand max-sm:min-w-11 max-sm:justify-center max-sm:px-3 ${filtersOpen ? "border-brand" : ""}`}
            >
              <Filter size={16} />
              <span className="max-sm:sr-only">Filters</span>
              {activeFilterCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-xs font-semibold text-white">{activeFilterCount}</span>}
              <ChevronDown size={15} className={`transition-transform duration-200 max-sm:hidden ${filtersOpen ? "rotate-180" : ""}`} />
            </button>

            {filtersOpen && (
              <div className={`${ui.card} absolute top-[calc(100%+8px)] right-0 z-30 w-[min(20rem,calc(100vw-2rem))] p-4 shadow-xl`}>
                <div className="mb-4 flex items-center justify-between">
                  <strong className="text-sm">Filter listings</strong>
                  <button type="button" aria-label="Close filters" onClick={() => setFiltersOpen(false)} className={ui.iconBtn}><X size={16} /></button>
                </div>
                <FilterField label="Property type">
                  <CustomDropdown
                    {...FILTER_DROPDOWN}
                    placeholder="All types"
                    value={typeFilter}
                    options={[{ label: "All types", value: "" }, ...propertyTypes.map((type) => ({ label: type.name, value: type.id }))]}
                    onChange={setTypeFilter}
                  />
                </FilterField>
                <FilterField label="Purpose">
                  <CustomDropdown
                    {...FILTER_DROPDOWN}
                    placeholder="All purposes"
                    value={purposeFilter}
                    options={[{ label: "All purposes", value: "" }, ...PROPERTY_PURPOSES.map(([value, label]) => ({ label, value }))]}
                    onChange={setPurposeFilter}
                  />
                </FilterField>
                <div className="mt-5 flex items-center justify-between gap-2">
                  <button type="button" className={`${ui.btn} ${ui.btnGhost} h-10 px-3 font-medium`} onClick={() => { setTypeFilter(""); setPurposeFilter(""); }}>Clear all</button>
                  <button type="button" className={`${ui.btn} ${ui.btnPrimary} h-10 px-3`} onClick={() => setFiltersOpen(false)}>Show results</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {
          listError ? (
            <section className={`${ui.card} flex min-h-[300px] flex-col items-center justify-center border-dashed p-8 text-center`}>
              <h2 className="m-0 text-xl font-semibold">Listings couldn’t load</h2>
              <p className={`mt-2 mb-5 text-sm ${ui.muted}`}>Check your connection and try again.</p>
              <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={() => void loadProperties()}>Try again</button>
            </section>
          ) : (
            <section aria-label="Property listings">
              {loading ? (
                <div className={`${ui.card} flex items-center justify-center py-20`}><Spinner size={36} label="Loading listings" /></div>
              ) : !visibleProperties.length ? (
                <div className={ui.card}>{emptyState}</div>
              ) : (
                <>
                  {/* Desktop table */}
                  <div className={`${ui.card} hidden overflow-x-auto rounded-lg lg:block`}>
                    <table className="w-full min-w-[880px] border-collapse text-left [&>tbody>tr:last-child>td]:border-b-0">
                      <thead>
                        <tr>
                          <th className={`${ui.th} pl-5`}>Property</th>
                          <th className={ui.th}>Type</th>
                          <th className={ui.th}>Price</th>
                          <th className={ui.th}>Status</th>
                          <th className={ui.th}>Activity</th>
                          <th className={`${ui.th} w-20`}><span className="sr-only">Actions</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {visibleProperties.map((property) => (
                          <tr
                            key={property.id}
                            {...rowProps(property)}
                            className="cursor-pointer transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand dark:hover:bg-neutral-800/60"
                          >
                            <td className={`${ui.td} pl-5`}>
                              <div className="flex min-w-64 items-center gap-3">
                                {thumbnail(property, "h-11 w-12 rounded-md", 19)}
                                <div className="min-w-0">
                                  <p className="m-0 max-w-72 truncate text-sm font-semibold">{property.title}</p>
                                  <p className={`m-0 mt-1 truncate text-xs ${ui.muted}`}>{locationText(property)}</p>
                                </div>
                              </div>
                            </td>
                            <td className={ui.td}>
                              <span className="font-medium">{typeName(property)}</span>
                              <small className={`mt-1 block text-xs ${ui.muted}`}>{purposeLabel(property.purpose)}</small>
                            </td>
                            <td className={ui.td}>
                              <strong className="whitespace-nowrap">{money(property.price, property.currency)}</strong>
                              <small className={`ml-1 text-xs ${ui.muted}`}>{priceText(property)}</small>
                            </td>
                            <td className={ui.td}><span className={statusPillClass(property.status)}>{statusLabel(property.status)}</span></td>
                            <td className={ui.td}><ActivityStats property={property} /></td>
                            <td className={`${ui.td} w-20`}>
                              <RowActions title={property.title} options={actionOptions(property)} onChange={(action) => handleListingAction(action, property)} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile / tablet cards */}
                  <ul className="grid gap-3 md:grid-cols-2 lg:hidden">
                    {visibleProperties.map((property) => (
                      <li
                        key={property.id}
                        {...rowProps(property)}
                        className={`${ui.card} cursor-pointer p-3 transition-colors hover:border-gray-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:hover:border-white/20`}
                      >
                        <div className="flex items-start gap-3">
                          {thumbnail(property, "h-12 w-12 rounded-md sm:h-20 sm:w-20 sm:rounded-lg", 18)}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-start justify-between gap-2">
                              <div className="min-w-0 flex-1">
                                <h3 className="m-0 line-clamp-1 text-[0.95rem] leading-snug font-semibold sm:line-clamp-2">{property.title}</h3>
                                <p className={`m-0 mt-0.5 truncate text-xs ${ui.muted}`}>{locationText(property)}</p>
                              </div>
                              <RowActions title={property.title} options={actionOptions(property)} onChange={(action) => handleListingAction(action, property)} />
                            </div>
                            <p className={`m-0 mt-0.5 truncate text-xs max-sm:hidden ${ui.muted}`}>{typeName(property)} · {purposeLabel(property.purpose)}</p>
                            <p className="m-0 mt-1.5 text-sm max-sm:hidden">
                              <strong>{money(property.price, property.currency)}</strong>
                              <small className={`ml-1 ${ui.muted}`}>{priceText(property)}</small>
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 flex items-center justify-between gap-2 sm:hidden">
                          <strong className="text-sm whitespace-nowrap">
                            {compactMoney(property.price, property.currency)}{priceText(property)}
                          </strong>
                          <span className={statusPillClass(property.status)}>{statusLabel(property.status)}</span>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}

              {/* Pagination */}
              <div className="mt-5 flex items-center justify-between gap-4 border-t border-gray-400 pt-3 dark:border-white/10">
                <p className="text-sm text-gray-800 dark:text-gray-300">
                  Page {page} of {pageCount}
                </p>

                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    className={roundButton}
                    disabled={page <= 1}
                    aria-label="Previous page"
                  >
                    <ArrowLeft size={18} />
                  </button>

                  <button
                    type="button"
                    onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
                    className={roundButton}
                    disabled={page >= pageCount}
                    aria-label="Next page"
                  >
                    <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            </section>
          )
        }
      </main>

      {editingProperty !== undefined && (
        <AgentListingEditor
          property={editingProperty}
          onClose={() => setEditingProperty(undefined)}
          onSaved={() => {
            setEditingProperty(undefined);
            refreshListings();
            if (selectedProperty) {
              void agentAPI.getProperty(selectedProperty.id)
                .then(setSelectedProperty)
                .catch((error) => {
                  toast.error(agentErrorMessage(error, "We couldn't refresh the listing details."));
                  console.error("Agent listing detail refresh failed:", error);
                });
            }
          }}
        />
      )}

      {editLoading && <AgentListingEditorSkeleton title={editLoadingTitle} />}

      {detailLoading && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-5 backdrop-blur-sm">
          <div className={`${ui.card} grid h-20 w-20 place-items-center rounded-2xl shadow-2xl`}>
            <Spinner size={34} label="Loading listing" />
          </div>
        </div>
      )}

      {selectedProperty && (
        <AgentPropertyOverview
          property={selectedProperty}
          typeName={typeName(selectedProperty)}
          initialAction="details"
          onClose={() => setSelectedProperty(null)}
          onEdit={() => setEditingProperty(selectedProperty)}
          onViewWebsite={() => navigate(`/properties/${selectedProperty.slug}`)}
          onChanged={(updatedProperty) => {
            setSelectedProperty(updatedProperty);
            setProperties((current) => current.map((property) => property.id === updatedProperty.id ? updatedProperty : property));
            refreshListings();
          }}
        />
      )}

      {availabilityProperty && (
        <AgentAvailabilityEditor
          property={availabilityProperty}
          onClose={() => setAvailabilityProperty(null)}
        />
      )}

      {bookVisitProperty && (
        <AgentBookVisitModal
          property={bookVisitProperty}
          open
          onOpenChange={(open) => {
            if (!open) setBookVisitProperty(null);
          }}
        />
      )}

      {withdrawProperty && (
        <AgentWithdrawModal
          property={withdrawProperty}
          open
          onOpenChange={(open) => {
            if (!open) setWithdrawProperty(null);
          }}
          onWithdrawn={(updatedProperty) => {
            setProperties((current) => current.map((property) => property.id === updatedProperty.id ? updatedProperty : property));
            refreshListings();
          }}
        />
      )}

    </div>
  );
};

export default AgentListingsPage;