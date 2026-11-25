import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  Eye,
  Filter,
  ImagePlus,
  Mail,
  MessageSquareText,
  MoreHorizontal,
  MoreVertical,
  Phone,
  Plus,
  Search,
  X,
} from "lucide-react";
import { Navigate, useNavigate } from "react-router";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import CustomDropdown from "@/shared/components/CustomDropdown";
import AgentAddLeadModal from "@/features/agentPortal/leads/components/AgentAddLeadModal";
import AgentLeadDetailView from "@/features/agentPortal/leads/components/AgentLeadDetailView";
import AgentPortalHeader from "@/features/agentPortal/common/components/AgentPortalHeader";
import {
  agentAPI,
  agentErrorMessage,
  type AgentAttention,
  type AgentInquiry,
  type AgentInquiryCounts,
  type AgentInquiryStatus,
  type AgentProfile,
} from "@/features/agentPortal/common/services/agentAPI";
import { useAgentAuthStore } from "@/features/agentPortal/common/store/useAgentAuthStore";
import {
  LEAD_STATUS_FILTERS,
  LEAD_STATUS_OPTIONS,
  LEADS_PAGE_SIZE,
  formatLeadDate,
  leadStatusLabel,
  leadStatusPillClass,
  type LeadTab,
} from "@/features/agentPortal/leads/utils/agentLeadUtils";

const ui = {
  btn: "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 sm:h-10",
  btnPrimary: "bg-highlight text-white shadow-sm hover:bg-highlight/90",
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
  buttonClassName: "h-10 w-full rounded-lg border border-gray-200 bg-white! px-3 text-left text-sm text-gray-900! hover:border-highlight dark:border-white/10 dark:bg-neutral-900! dark:text-white!",
  menuClassName: "overflow-hidden rounded-xl border-gray-300! bg-white! text-gray-900! shadow-lg! dark:border-white/15! dark:bg-neutral-900! dark:text-white! [&>div]:max-h-60 [&>div]:overflow-x-hidden [&>div]:overflow-y-auto [&>div]:bg-white! dark:[&>div]:bg-neutral-900! [&>div]:[scrollbar-width:none] [&>div::-webkit-scrollbar]:hidden [&>div>button]:whitespace-normal",
  menuItemClassName: "block w-full bg-white! px-4 py-2.5 text-left text-sm whitespace-normal text-gray-900! transition hover:bg-gray-100! dark:bg-neutral-900! dark:text-white! dark:hover:bg-neutral-800!",
};

const roundButton =
  "cursor-pointer rounded-full border border-gray-300 bg-white p-2.5 text-gray-900 transition hover:border-[#b79bff] hover:text-[#b79bff] disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/20 dark:bg-[#101010] dark:text-white";

const Spinner = ({ size = 32, label = "Loading" }: { size?: number; label?: string }) => (
  <span role="status" className="inline-flex">
    <span
      className="animate-spin rounded-full border-[3px] border-gray-200 border-t-highlight dark:border-white/10 dark:border-t-highlight"
      style={{ width: size, height: size }}
      aria-hidden="true"
    />
    <span className="sr-only">{label}</span>
  </span>
);

type ActionOption = { label: string; value: string; icon: ReactNode; danger?: boolean };

const RowActions = ({ title, options, onChange }: { title: string; options: ActionOption[]; onChange: (value: string) => void }) => (
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
      menuClassName="fixed z-40 grid max-h-[calc(100vh-16px)] w-[196px] overflow-y-auto rounded-lg border border-gray-200 bg-white p-1.5 text-left shadow-lg dark:border-white/10 dark:bg-neutral-900 [&>div]:grid [&_.is-danger]:text-red-700! [&_.is-danger:hover]:bg-red-50!"
      menuItemClassName="flex min-h-10 w-full items-center gap-2.5 rounded-md border-0 bg-transparent px-2.5 text-left text-sm text-gray-900! cursor-pointer hover:bg-gray-100! dark:text-white! dark:hover:bg-neutral-800! [&>svg]:shrink-0"
      menuWidth={196}
      options={options}
      onChange={onChange}
    />
  </div>
);

const FilterField = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="mb-4">
    <span className={`mb-1.5 block text-xs font-medium ${ui.muted}`}>{label}</span>
    {children}
  </div>
);

const AgentLeadsPage = () => {
  const token = useAgentAuthStore((state) => state.token);
  const logout = useAgentAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [attention, setAttention] = useState<AgentAttention | null>(null);
  const [inquiries, setInquiries] = useState<AgentInquiry[]>([]);
  const [counts, setCounts] = useState<AgentInquiryCounts | null>(null);
  const [status, setStatus] = useState<LeadTab>("all");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [propertyFilter, setPropertyFilter] = useState("");
  const [sourceFilter, setSourceFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(false);
  const [selectedInquiry, setSelectedInquiry] = useState<AgentInquiry | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [addLeadOpen, setAddLeadOpen] = useState(false);

  const loadInquiries = useCallback(async () => {
    setLoading(true);
    setListError(false);
    try {
      const response = await agentAPI.getInquiries({
        page,
        limit: LEADS_PAGE_SIZE,
        ...(status !== "all" ? { status } : {}),
      });
      setInquiries(response.data);
      setTotal(response.total);
    } catch (error) {
      setListError(true);
      toast.error(agentErrorMessage(error, "We couldn't load your leads. Please try again."));
      console.error("Agent inquiries failed to load:", error);
    } finally {
      setLoading(false);
    }
  }, [page, status]);

  const loadCounts = useCallback(async () => {
    try {
      setCounts(await agentAPI.getInquiryCounts());
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't load your lead counts."));
      console.error("Agent inquiry counts failed to load:", error);
    }
  }, []);

  useEffect(() => {
    if (token) void loadInquiries();
  }, [loadInquiries, token]);

  useEffect(() => {
    if (!token) return;
    void loadCounts();
    void Promise.all([agentAPI.getMe(), agentAPI.getAttention(), agentAPI.getInquiryFilters()])
      .then(([profile, needsAttention]) => {
        setAgent(profile);
        setAttention(needsAttention);
      })
      .catch((error: unknown) => {
        toast.error(agentErrorMessage(error, "We couldn't load your agent profile."));
        console.error("Agent profile/filters failed to load:", error);
      });
  }, [loadCounts, token]);

  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setFiltersOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtersOpen]);

  const propertyOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const inquiry of inquiries) {
      if (inquiry.property?.id && inquiry.property?.title) {
        map.set(inquiry.property.id, inquiry.property.title);
      }
    }
    return Array.from(map.entries()).map(([value, label]) => ({ label, value }));
  }, [inquiries]);

  const sourceOptions = useMemo(() => {
    const sources = new Set(inquiries.map((inquiry) => inquiry.source).filter(Boolean));
    return Array.from(sources).map((value) => ({
      value,
      label: value.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()),
    }));
  }, [inquiries]);

  const visibleInquiries = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return inquiries.filter((inquiry) => {
      if (propertyFilter && inquiry.propertyId !== propertyFilter) return false;
      if (sourceFilter && inquiry.source !== sourceFilter) return false;
      if (!query) return true;
      return [
        inquiry.reference,
        inquiry.contact?.name,
        inquiry.contact?.email,
        inquiry.contact?.phone,
        inquiry.customer?.name,
        inquiry.property?.title,
        inquiry.property?.sku,
        inquiry.message,
      ].some((value) => value?.toLocaleLowerCase().includes(query));
    });
  }, [inquiries, propertyFilter, search, sourceFilter]);

  if (!token) return <Navigate to="/agent/login" replace />;

  const handleLogout = () => {
    logout();
    navigate("/agent/login", { replace: true });
  };

  const refreshLeads = () => {
    void loadInquiries();
    void loadCounts();
  };

  const openInquiry = async (id: string) => {
    setDetailLoading(true);
    setSelectedInquiry(null);
    try {
      setSelectedInquiry(await agentAPI.getInquiry(id));
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't open that lead. Please try again."));
      console.error("Agent inquiry detail failed to load:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const quickMoveStatus = async (inquiry: AgentInquiry, nextStatus: AgentInquiryStatus) => {
    try {
      const response = await agentAPI.updateInquiryStatus(inquiry.id, { status: nextStatus });
      toast.success(response.message);
      setInquiries((current) => current.map((item) => item.id === response.data.id ? response.data : item));
      if (selectedInquiry?.id === response.data.id) setSelectedInquiry(response.data);
      refreshLeads();
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't update that lead's status."));
      console.error("Agent quick status update failed:", error);
    }
  };

  const changeStatus = (nextStatus: LeadTab) => {
    setStatus(nextStatus);
    setPage(1);
  };

  const countForStatus = (filter: LeadTab) => {
    if (!counts) return "—";
    return counts[filter];
  };

  const actionOptions = (inquiry: AgentInquiry): ActionOption[] => [
    { label: "View lead", value: "view", icon: <Eye size={16} /> },
    ...LEAD_STATUS_OPTIONS
      .filter((option) => option.value !== inquiry.status)
      .map((option) => ({
        label: `Mark ${option.label}`,
        value: `status:${option.value}`,
        icon: <CheckCircle2 size={16} />,
      })),
  ];

  const handleLeadAction = (action: string, inquiry: AgentInquiry) => {
    if (action === "view") {
      void openInquiry(inquiry.id);
    } else if (action.startsWith("status:")) {
      const nextStatus = action.slice("status:".length) as AgentInquiryStatus;
      void quickMoveStatus(inquiry, nextStatus);
    }
  };

  const activeFilterCount = Number(Boolean(propertyFilter)) + Number(Boolean(sourceFilter));
  const isFiltering = Boolean(search || propertyFilter || sourceFilter);
  const filterDisabled = total < 5 && !isFiltering;
  const pageCount = Math.max(1, Math.ceil(total / LEADS_PAGE_SIZE));

  const rowProps = (inquiry: AgentInquiry) => ({
    tabIndex: 0,
    "aria-label": `View lead ${inquiry.contact?.name || inquiry.reference}`,
    onClick: () => void openInquiry(inquiry.id),
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        void openInquiry(inquiry.id);
      }
    },
  });

  const contactName = (inquiry: AgentInquiry) => inquiry.contact?.name || inquiry.customer?.name || "Prospect";
  const openTasksCount = (inquiry: AgentInquiry) =>
    inquiry.activities.filter((activity) => activity.type === "task" && !activity.done).length;

  const emptyState = (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-5 py-10 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-highlight/10 text-highlight dark:bg-highlight/15 dark:text-highlight">
        <MessageSquareText size={22} />
      </div>
      <h2 className="m-0 text-base font-semibold">
        {isFiltering
          ? "No matching leads"
          : status === "all"
            ? "No leads yet"
            : `No ${leadStatusLabel(status).toLowerCase()} leads`}
      </h2>
      <p className={`mt-1.5 mb-5 text-sm ${ui.muted}`}>
        {isFiltering
          ? "Try changing your search or filters."
          : status === "all"
            ? "Prospects who inquire about your properties will appear here, or you can log one yourself."
            : "When leads reach this stage, they’ll appear here."}
      </p>
      {status === "all" && !isFiltering && (
        <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={() => setAddLeadOpen(true)}>
          <Plus size={18} /> Add lead
        </button>
      )}
    </div>
  );

  return (
    <div data-agent-scroll className="fixed inset-0 overflow-y-auto overscroll-contain bg-gray-300 font-sans text-gray-900 dark:bg-neutral-950 dark:text-white">
      <Helmet>
        <title>Leads | RewaCiti Agent Portal</title>
        <meta name="description" content="Track and manage your RewaCiti property leads and inquiries." />
      </Helmet>

      <AgentPortalHeader
        name={agent?.name ?? "Agent"}
        email={agent?.email}
        payoutCount={attention?.payouts}
        visitCount={attention?.bookings}
        activePage="leads"
        onViewProfile={() => navigate("/agent/profile")}
        onLogout={handleLogout}
      />

      <main className="isolate mx-auto min-h-[calc(100vh-64px)] w-full max-w-[1440px] px-4 pt-5 pb-24 sm:px-6 sm:pb-16 lg:px-10">
        {/* Page title */}
        <div className="mb-5 flex items-center justify-between gap-3 sm:items-start">
          <div className="min-w-0">
            <h1 className="m-0 text-xl font-bold tracking-tight sm:text-2xl">Leads</h1>
            <p className={`mt-1 text-sm ${ui.muted}`}>Follow up with inquiries, log notes or tasks, and move deals forward.</p>
          </div>
          <button
            type="button"
            aria-label="Add lead"
            className={`${ui.btn} ${ui.btnPrimary} max-sm:w-11 max-sm:px-0`}
            onClick={() => setAddLeadOpen(true)}
          >
            <Plus size={20} strokeWidth={2.4} /> <span className="max-sm:sr-only">Add lead</span>
          </button>
        </div>

        {/* Status tabs */}
        <nav className="-mx-4 mb-4 overflow-x-auto border-b border-gray-400/60 px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 dark:border-white/15 [&::-webkit-scrollbar]:hidden" aria-label="Filter leads by status">
          <div className="flex min-w-max gap-1">
            {LEAD_STATUS_FILTERS.map((filter) => {
              const active = status === filter.value;
              return (
                <button
                  type="button"
                  key={filter.value}
                  aria-current={active ? "page" : undefined}
                  onClick={() => changeStatus(filter.value)}
                  className={`-mb-px inline-flex h-11 items-center gap-2 border-b-2 px-3 text-sm whitespace-nowrap transition-colors ${active
                    ? "border-highlight font-semibold text-gray-900 dark:border-highlight dark:text-white"
                    : "border-transparent text-gray-700 hover:border-gray-400 hover:text-gray-900 dark:text-gray-400 dark:hover:border-white/30 dark:hover:text-white"}`}
                >
                  {filter.label}
                  <span className={`inline-grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-xs font-semibold ${active ? "bg-highlight/10 text-highlight dark:bg-highlight/15 dark:text-highlight" : "bg-gray-200 text-gray-700 dark:bg-neutral-800 dark:text-gray-400"}`}>
                    {countForStatus(filter.value)}
                  </span>
                </button>
              );
            })}
          </div>
        </nav>

        {/* Search + filters */}
        <div className="mb-5 flex items-center gap-2 sm:gap-3">
          <label className={`${ui.control} flex min-w-0 flex-1 items-center gap-2 px-3 text-gray-500 focus-within:border-highlight focus-within:ring-2 focus-within:ring-highlight/15 sm:max-w-md dark:text-gray-400`}>
            <Search size={17} aria-hidden="true" className="shrink-0" />
            <input
              type="search"
              aria-label="Search leads"
              placeholder="Search leads, properties, or reference..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              className="w-full min-w-0 border-0 bg-transparent text-sm text-gray-900 outline-0 placeholder:text-gray-500 dark:text-white dark:placeholder:text-gray-400"
            />
            {search && (
              <button type="button" aria-label="Clear search" onClick={() => setSearch("")} className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800">
                <X size={15} />
              </button>
            )}
          </label>

          <div className="relative shrink-0">
            <button
              type="button"
              disabled={filterDisabled}
              aria-expanded={filtersOpen && !filterDisabled}
              onClick={() => setFiltersOpen((open) => !open)}
              className={`${ui.control} inline-flex items-center gap-2 px-3.5 max-sm:min-w-11 max-sm:justify-center max-sm:px-3 ${filterDisabled ? "cursor-not-allowed opacity-50" : "hover:border-highlight"} ${filtersOpen ? "border-highlight" : ""}`}
            >
              <Filter size={16} />
              <span className="max-sm:sr-only">Filters</span>
              {activeFilterCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-highlight px-1.5 text-xs font-semibold text-white">{activeFilterCount}</span>}
              <ChevronDown size={15} className={`transition-transform duration-200 max-sm:hidden ${filtersOpen ? "rotate-180" : ""}`} />
            </button>

            {filtersOpen && !filterDisabled && (
              <div className={`${ui.card} absolute top-[calc(100%+8px)] right-0 z-30 w-[min(20rem,calc(100vw-2rem))] p-4 shadow-xl`}>
                <div className="mb-4 flex items-center justify-between">
                  <strong className="text-sm">Filter leads</strong>
                  <button type="button" aria-label="Close filters" onClick={() => setFiltersOpen(false)} className={ui.iconBtn}>
                    <X size={16} />
                  </button>
                </div>
                <FilterField label="Property">
                  <CustomDropdown
                    {...FILTER_DROPDOWN}
                    placeholder="All properties"
                    value={propertyFilter}
                    options={[{ label: "All properties", value: "" }, ...propertyOptions]}
                    onChange={setPropertyFilter}
                  />
                </FilterField>
                <FilterField label="Source">
                  <CustomDropdown
                    {...FILTER_DROPDOWN}
                    placeholder="All sources"
                    value={sourceFilter}
                    options={[{ label: "All sources", value: "" }, ...sourceOptions]}
                    onChange={setSourceFilter}
                  />
                </FilterField>
                <div className="mt-5 flex items-center justify-between gap-2">
                  <button type="button" className={`${ui.btn} ${ui.btnGhost} h-10 px-3 font-medium`} onClick={() => { setPropertyFilter(""); setSourceFilter(""); }}>
                    Clear all
                  </button>
                  <button type="button" className={`${ui.btn} ${ui.btnPrimary} h-10 px-3`} onClick={() => setFiltersOpen(false)}>
                    Show results
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {listError ? (
          <section className={`${ui.card} flex min-h-[300px] flex-col items-center justify-center border-dashed p-8 text-center`}>
            <h2 className="m-0 text-xl font-semibold">Leads couldn’t load</h2>
            <p className={`mt-2 mb-5 text-sm ${ui.muted}`}>Check your connection and try again.</p>
            <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={() => void loadInquiries()}>
              Try again
            </button>
          </section>
        ) : (
          <section aria-label="Leads list">
            {loading ? (
              <div className={`${ui.card} flex items-center justify-center py-20`}>
                <Spinner size={36} label="Loading leads" />
              </div>
            ) : !visibleInquiries.length ? (
              <div className={ui.card}>{emptyState}</div>
            ) : (
              <>
                {/* Desktop table */}
                <div className={`${ui.card} hidden overflow-x-auto rounded-lg lg:block`}>
                  <table className="w-full min-w-[920px] border-collapse text-left [&>tbody>tr:last-child>td]:border-b-0">
                    <thead>
                      <tr>
                        <th className={`${ui.th} pl-5`}>Lead</th>
                        <th className={ui.th}>Property</th>
                        <th className={ui.th}>Inquiry</th>
                        <th className={ui.th}>Status</th>
                        <th className={ui.th}>Received</th>
                        <th className={`${ui.th} w-20`}><span className="sr-only">Actions</span></th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleInquiries.map((inquiry) => {
                        const tasksLeft = openTasksCount(inquiry);
                        return (
                          <tr
                            key={inquiry.id}
                            {...rowProps(inquiry)}
                            className="cursor-pointer transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-highlight dark:hover:bg-neutral-800/60"
                          >
                            <td className={`${ui.td} pl-5`}>
                              <div className="min-w-48">
                                <div className="flex items-center gap-2">
                                  <p className="m-0 font-semibold">{contactName(inquiry)}</p>
                                  <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[11px] font-medium text-gray-600 dark:bg-neutral-800 dark:text-gray-400">
                                    {inquiry.reference}
                                  </span>
                                </div>
                                <p className={`m-0 mt-1 flex items-center gap-2 text-xs ${ui.muted}`}>
                                  {inquiry.contact?.phone && <span>{inquiry.contact.phone}</span>}
                                  {inquiry.contact?.phone && inquiry.contact?.email && <span>·</span>}
                                  {inquiry.contact?.email && <span className="max-w-44 truncate">{inquiry.contact.email}</span>}
                                </p>
                              </div>
                            </td>
                            <td className={ui.td}>
                              <div className="flex min-w-56 items-center gap-3">
                                <div className="grid h-11 w-12 shrink-0 place-items-center overflow-hidden rounded-md bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-gray-400">
                                  {inquiry.property?.photo ? (
                                    <img className="h-full w-full object-cover" src={inquiry.property.photo} alt="" loading="lazy" />
                                  ) : (
                                    <ImagePlus size={18} />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <p className="m-0 max-w-60 truncate font-medium">{inquiry.property?.title || "Property"}</p>
                                  <p className={`m-0 mt-1 truncate text-xs ${ui.muted}`}>{inquiry.property?.sku || "—"}</p>
                                </div>
                              </div>
                            </td>
                            <td className={ui.td}>
                              <p className={`m-0 line-clamp-2 max-w-72 text-xs leading-relaxed ${ui.muted}`}>
                                {inquiry.message}
                              </p>
                            </td>
                            <td className={ui.td}>
                              <div className="flex flex-col items-start gap-1">
                                <span className={leadStatusPillClass(inquiry.status)}>{leadStatusLabel(inquiry.status)}</span>
                                {tasksLeft > 0 && (
                                  <span className={`text-[11px] ${ui.muted}`}>
                                    {tasksLeft} open {tasksLeft === 1 ? "task" : "tasks"}
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className={ui.td}>
                              <span className={`text-xs whitespace-nowrap ${ui.muted}`}>{formatLeadDate(inquiry.createdAt)}</span>
                            </td>
                            <td className={`${ui.td} w-20`}>
                              <RowActions
                                title={contactName(inquiry)}
                                options={actionOptions(inquiry)}
                                onChange={(action) => handleLeadAction(action, inquiry)}
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Mobile / tablet cards */}
                <ul className="grid gap-3 md:grid-cols-2 lg:hidden">
                  {visibleInquiries.map((inquiry) => (
                    <li
                      key={inquiry.id}
                      {...rowProps(inquiry)}
                      className={`${ui.card} cursor-pointer p-3 transition-colors hover:border-gray-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-highlight dark:hover:border-white/20`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-md bg-gray-100 text-gray-500 dark:bg-neutral-800 dark:text-gray-400">
                          {inquiry.property?.photo ? (
                            <img className="h-full w-full object-cover" src={inquiry.property.photo} alt="" loading="lazy" />
                          ) : (
                            <ImagePlus size={18} />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <h3 className="m-0 truncate text-[0.95rem] leading-snug font-semibold">{contactName(inquiry)}</h3>
                              <p className={`m-0 mt-0.5 truncate text-xs ${ui.muted}`}>{inquiry.property?.title || inquiry.reference}</p>
                            </div>
                            <RowActions
                              title={contactName(inquiry)}
                              options={actionOptions(inquiry)}
                              onChange={(action) => handleLeadAction(action, inquiry)}
                            />
                          </div>
                          <p className={`m-0 mt-1.5 line-clamp-2 text-xs leading-relaxed ${ui.muted}`}>{inquiry.message}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                          <span>{formatLeadDate(inquiry.createdAt)}</span>
                          {inquiry.contact?.phone && (
                            <a
                              href={`tel:${inquiry.contact.phone}`}
                              onClick={(event) => event.stopPropagation()}
                              aria-label={`Call ${contactName(inquiry)}`}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-700 hover:border-highlight hover:text-highlight dark:border-white/10 dark:text-gray-300"
                            >
                              <Phone size={13} />
                            </a>
                          )}
                          {inquiry.contact?.email && (
                            <a
                              href={`mailto:${inquiry.contact.email}`}
                              onClick={(event) => event.stopPropagation()}
                              aria-label={`Email ${contactName(inquiry)}`}
                              className="inline-flex h-7 w-7 items-center justify-center rounded-md border border-gray-200 text-gray-700 hover:border-highlight hover:text-highlight dark:border-white/10 dark:text-gray-300"
                            >
                              <Mail size={13} />
                            </a>
                          )}
                        </div>
                        <span className={leadStatusPillClass(inquiry.status)}>{leadStatusLabel(inquiry.status)}</span>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Pagination */}
            <div className="mt-8 flex items-center justify-between gap-4 border-t border-gray-400 pt-6 dark:border-white/10">
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
        )}
      </main>

      <AgentAddLeadModal
        open={addLeadOpen}
        onOpenChange={setAddLeadOpen}
        onCreated={() => {
          setPage(1);
          refreshLeads();
        }}
      />

      {detailLoading && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-5 backdrop-blur-sm">
          <div className={`${ui.card} grid h-20 w-20 place-items-center rounded-2xl shadow-2xl`}>
            <Spinner size={34} label="Loading lead" />
          </div>
        </div>
      )}

      {selectedInquiry && (
        <AgentLeadDetailView
          inquiry={selectedInquiry}
          onClose={() => setSelectedInquiry(null)}
          onUpdated={(updated) => {
            setSelectedInquiry(updated);
            setInquiries((current) => current.map((item) => item.id === updated.id ? updated : item));
            refreshLeads();
          }}
        />
      )}

    </div>
  );
};

export default AgentLeadsPage;
