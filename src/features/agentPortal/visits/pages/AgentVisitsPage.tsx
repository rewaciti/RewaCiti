import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  CalendarDays,
  CalendarPlus,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Filter,
  List as ListIcon,
  Mail,
  Phone,
  Plus,
  Search,
  X,
} from "lucide-react";
import { Navigate, useNavigate } from "react-router";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import CustomDropdown from "@/shared/components/CustomDropdown";
import AgentBookPropertyVisitModal from "@/features/agentPortal/visits/components/AgentBookPropertyVisitModal";
import AgentPortalHeader from "@/features/agentPortal/common/components/AgentPortalHeader";
import AgentVisitDetailView from "@/features/agentPortal/visits/components/AgentVisitDetailView";
import {
  agentAPI,
  agentErrorMessage,
  type AgentAttention,
  type AgentBooking,
  type AgentProfile,
} from "@/features/agentPortal/common/services/agentAPI";
import { useAgentAuthStore } from "@/features/agentPortal/common/store/useAgentAuthStore";
import { money } from "@/features/agentPortal/common/utils/agentListingUtils";
import {
  VISIT_STATUS_FILTERS,
  VISITS_PAGE_SIZE,
  formatVisitDate,
  formatVisitTime,
  visitStatusLabel,
  visitStatusPillClass,
  type VisitTab,
} from "@/features/agentPortal/common/utils/agentVisitUtils";

const ui = {
  btn: "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 sm:h-10",
  btnPrimary: "bg-brand text-white shadow-sm hover:bg-brand/90",
  btnGhost: "bg-transparent text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-neutral-800",
  control: "h-11 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 dark:border-white/15 dark:bg-neutral-900 dark:text-white sm:h-10",
  card: "rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-neutral-900",
  muted: "text-gray-600 dark:text-gray-400",
  iconBtn: "grid h-9 w-9 shrink-0 place-items-center rounded-lg border-0 bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-neutral-800 dark:hover:text-white",
  th: "h-14 border-b border-gray-200 bg-gray-50 px-4 text-left text-sm font-semibold text-gray-800 dark:border-white/10 dark:bg-neutral-800 dark:text-gray-200",
  td: "h-[76px] border-b border-gray-200 px-4 py-3 align-middle text-sm text-gray-900 dark:border-white/10 dark:text-white",
};

const FILTER_DROPDOWN = {
  className: "w-full",
  buttonClassName: "h-10 w-full rounded-lg border border-gray-200 bg-white! px-3 text-left text-sm text-gray-900! hover:border-brand dark:border-white/10 dark:bg-neutral-900! dark:text-white!",
  menuClassName: "overflow-hidden rounded-xl border-gray-300! bg-white! text-gray-900! shadow-lg! dark:border-white/15! dark:bg-neutral-900! dark:text-white! [&>div]:max-h-60 [&>div]:overflow-x-hidden [&>div]:overflow-y-auto [&>div]:bg-white! dark:[&>div]:bg-neutral-900! [&>div]:[scrollbar-width:none] [&>div::-webkit-scrollbar]:hidden [&>div>button]:whitespace-normal",
  menuItemClassName: "block w-full bg-white! px-4 py-2.5 text-left text-sm whitespace-normal text-gray-900! transition hover:bg-gray-100! dark:bg-neutral-900! dark:text-white! dark:hover:bg-neutral-800!",
};

const roundButton =
  "cursor-pointer rounded-full border border-gray-300 bg-white p-2.5 text-gray-900 transition hover:border-[#703BF7] hover:text-[#703BF7] disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/20 dark:bg-[#101010] dark:text-white";

const STATUS_OPTIONS = VISIT_STATUS_FILTERS.map((filter) => ({ label: filter.label, value: filter.value }));
const WEEK_LIMIT = 100;

type ViewMode = "list" | "week";

const toISODate = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;

const weekStartFor = (offset: number) => {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  const mondayIndex = (date.getDay() + 6) % 7;
  date.setDate(date.getDate() - mondayIndex + offset * 7);
  return date;
};

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

const FilterField = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="mb-4">
    <span className={`mb-1.5 block text-xs font-medium ${ui.muted}`}>{label}</span>
    {children}
  </div>
);

const AgentVisitsPage = () => {
  const token = useAgentAuthStore((state) => state.token);
  const logout = useAgentAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [attention, setAttention] = useState<AgentAttention | null>(null);
  const [bookings, setBookings] = useState<AgentBooking[]>([]);
  const [view, setView] = useState<ViewMode>("list");
  const [weekOffset, setWeekOffset] = useState(0);
  const [status, setStatus] = useState<VisitTab>("upcoming");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [propertyFilter, setPropertyFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [modeFilter, setModeFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState<AgentBooking | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [bookVisitOpen, setBookVisitOpen] = useState(false);

  const loadBookings = useCallback(async () => {
    setLoading(true);
    setListError(false);
    try {
      // Week view needs every visit, so it ignores the status tab and pagination.
      const response = await agentAPI.getBookings(
        view === "week"
          ? { page: 1, limit: WEEK_LIMIT }
          : {
            page,
            limit: VISITS_PAGE_SIZE,
            ...(status !== "all" ? { status } : {}),
          },
      );
      setBookings(response.data);
      setTotal(response.total);
    } catch (error) {
      setListError(true);
      toast.error(agentErrorMessage(error, "We couldn't load your visits. Please try again."));
      console.error("Agent bookings failed to load:", error);
    } finally {
      setLoading(false);
    }
  }, [page, status, view]);

  useEffect(() => {
    if (token) void loadBookings();
  }, [loadBookings, token]);

  useEffect(() => {
    if (!token) return;
    void Promise.all([agentAPI.getMe(), agentAPI.getAttention(), agentAPI.getBookingFilters()])
      .then(([profile, needsAttention]) => {
        setAgent(profile);
        setAttention(needsAttention);
      })
      .catch((error: unknown) => {
        toast.error(agentErrorMessage(error, "We couldn't load your agent profile."));
        console.error("Agent profile/booking filters failed to load:", error);
      });
  }, [token]);

  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setFiltersOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtersOpen]);

  const propertyOptions = useMemo(() => {
    const map = new Map<string, string>();
    for (const booking of bookings) {
      if (booking.property?.id && booking.property?.title) {
        map.set(booking.property.id, booking.property.title);
      }
    }
    return Array.from(map.entries()).map(([value, label]) => ({ label, value }));
  }, [bookings]);

  const visibleBookings = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return bookings.filter((booking) => {
      if (propertyFilter && booking.propertyId !== propertyFilter) return false;
      if (paymentFilter && booking.paymentStatus !== paymentFilter) return false;
      if (modeFilter && booking.mode !== modeFilter) return false;
      if (!query) return true;
      return [
        booking.reference,
        booking.contact?.name,
        booking.contact?.email,
        booking.contact?.phone,
        booking.customer?.name,
        booking.property?.title,
        booking.property?.sku,
        booking.address,
        booking.notes,
      ].some((value) => value?.toLocaleLowerCase().includes(query));
    });
  }, [bookings, modeFilter, paymentFilter, propertyFilter, search]);

  const weekDays = useMemo(() => {
    const start = weekStartFor(weekOffset);
    return Array.from({ length: 7 }, (_, index) => {
      const date = new Date(start);
      date.setDate(start.getDate() + index);
      return date;
    });
  }, [weekOffset]);

  const weekBookingsByDay = useMemo(() => {
    const grouped = new Map<string, AgentBooking[]>();
    for (const day of weekDays) grouped.set(toISODate(day), []);
    for (const booking of visibleBookings) {
      grouped.get(booking.date)?.push(booking);
    }
    for (const list of grouped.values()) list.sort((a, b) => a.start.localeCompare(b.start));
    return grouped;
  }, [visibleBookings, weekDays]);

  if (!token) return <Navigate to="/agent/login" replace />;

  const handleLogout = () => {
    logout();
    navigate("/agent/login", { replace: true });
  };

  const openBooking = async (id: string) => {
    setDetailLoading(true);
    setSelectedBooking(null);
    try {
      setSelectedBooking(await agentAPI.getBooking(id));
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't open that visit. Please try again."));
      console.error("Agent booking detail failed to load:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const changeStatus = (nextStatus: VisitTab) => {
    setStatus(nextStatus);
    setPage(1);
  };

  const changeView = (next: ViewMode) => {
    setView(next);
    setPage(1);
  };

  const activeFilterCount =
    Number(Boolean(propertyFilter)) +
    Number(Boolean(paymentFilter)) +
    Number(Boolean(modeFilter)) +
    Number(view === "list" && status !== "upcoming");
  const isFiltering = Boolean(search || propertyFilter || paymentFilter || modeFilter);
  const filterDisabled = total < 5 && !isFiltering;
  const pageCount = Math.max(1, Math.ceil(total / VISITS_PAGE_SIZE));

  const visitorName = (booking: AgentBooking) => booking.contact?.name || booking.customer?.name || "Visitor";
  const visitorCount = (booking: AgentBooking) => `${booking.visitors} ${booking.visitors === 1 ? "visitor" : "visitors"}`;

  const rowProps = (booking: AgentBooking) => ({
    tabIndex: 0,
    "aria-label": `View visit ${visitorName(booking)}`,
    onClick: () => void openBooking(booking.id),
    onKeyDown: (event: React.KeyboardEvent) => {
      if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
        event.preventDefault();
        void openBooking(booking.id);
      }
    },
  });

  const clearFilters = () => {
    setPropertyFilter("");
    setPaymentFilter("");
    setModeFilter("");
    if (status !== "upcoming") changeStatus("upcoming");
  };

  const emptyState = (
    <div className="flex min-h-[300px] flex-col items-center justify-center px-5 py-10 text-center">
      <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand/10 text-brand dark:bg-brand-light/15 dark:text-brand-light">
        <CalendarClock size={22} />
      </div>
      <h2 className="m-0 text-base font-semibold">
        {isFiltering
          ? "No matching visits"
          : status === "all"
            ? "No visits yet"
            : `No ${VISIT_STATUS_FILTERS.find((item) => item.value === status)?.label.toLowerCase()} visits`}
      </h2>
      <p className={`mt-1.5 mb-5 text-sm ${ui.muted}`}>
        {isFiltering
          ? "Try changing your search or filters."
          : "Scheduled property viewings appear here, or you can book one for a client."}
      </p>
      {!isFiltering && (
        <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={() => setBookVisitOpen(true)}>
          <Plus size={18} /> Book a visit
        </button>
      )}
    </div>
  );

  const weekRangeLabel = `${weekDays[0].toLocaleDateString("en-GB", { day: "numeric", month: "short" })} – ${weekDays[6].toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}`;
  const todayISO = toISODate(new Date());

  return (
    <div data-agent-scroll className="fixed inset-0 overflow-y-auto overscroll-contain bg-gray-300 font-sans text-gray-900 dark:bg-neutral-950 dark:text-white">
      <Helmet>
        <title>Visits | RewaCiti Agent Portal</title>
        <meta name="description" content="Manage scheduled property visits, payments, reschedules, and outcomes." />
      </Helmet>

      <AgentPortalHeader
        name={agent?.name ?? "Agent"}
        email={agent?.email}
        payoutCount={attention?.payouts}
        visitCount={attention?.bookings}
        activePage="visits"
        onViewProfile={() => navigate("/agent/profile")}
        onLogout={handleLogout}
      />

      <main className="isolate mx-auto min-h-[calc(100vh-64px)] w-full max-w-[1440px] px-4 pt-5 pb-24 sm:px-6 sm:pb-16 lg:px-10">
        {/* Page title */}
        <div className="mb-5 flex items-center justify-between gap-3 sm:items-start">
          <div className="min-w-0">
            <h1 className="m-0 text-xl font-bold tracking-tight sm:text-2xl">My visits</h1>
            <p className={`mt-1 text-sm ${ui.muted}`}>Mark visits completed or no-show after they happen.</p>
          </div>
          <button
            type="button"
            aria-label="Book a visit"
            className={`${ui.btn} ${ui.btnPrimary} max-sm:w-11 max-sm:px-0`}
            onClick={() => setBookVisitOpen(true)}
          >
            <CalendarPlus size={18} /> <span className="max-sm:sr-only">Book a visit</span>
          </button>
        </div>

        {/* View toggle + quick tabs */}
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2" role="group" aria-label="Visits view">
            {([
              { value: "list", label: "List", icon: <ListIcon size={16} /> },
              { value: "week", label: "Week", icon: <CalendarDays size={16} /> },
            ] as const).map((item) => {
              const active = view === item.value;
              return (
                <button
                  key={item.value}
                  type="button"
                  aria-pressed={active}
                  onClick={() => changeView(item.value)}
                  className={`inline-flex h-10 items-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors ${active
                    ? "border-brand bg-brand text-white"
                    : "border-gray-300 bg-white text-gray-900 hover:border-brand hover:text-brand dark:border-white/15 dark:bg-neutral-900 dark:text-white"}`}
                >
                  {item.icon} {item.label}
                </button>
              );
            })}
          </div>

        </div>

        {/* Search + filters */}
        <div className="mb-5 flex items-center gap-2 sm:gap-3">
          <label className={`${ui.control} flex min-w-0 flex-1 items-center gap-2 px-3 text-gray-500 focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15 sm:max-w-md dark:text-gray-400`}>
            <Search size={17} aria-hidden="true" className="shrink-0" />
            <input
              type="search"
              aria-label="Search visits"
              placeholder="Search visits..."
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

          <div className="relative ml-auto shrink-0">
            <button
              type="button"
              disabled={filterDisabled}
              aria-expanded={filtersOpen && !filterDisabled}
              onClick={() => setFiltersOpen((open) => !open)}
              className={`${ui.control} inline-flex items-center gap-2 px-3.5 max-sm:min-w-11 max-sm:justify-center max-sm:px-3 ${filterDisabled ? "cursor-not-allowed opacity-50" : "hover:border-brand"} ${filtersOpen ? "border-brand" : ""}`}
            >
              <Filter size={16} />
              <span className="max-sm:sr-only">Filters</span>
              {activeFilterCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand px-1.5 text-xs font-semibold text-white">{activeFilterCount}</span>}
              <ChevronDown size={15} className={`transition-transform duration-200 max-sm:hidden ${filtersOpen ? "rotate-180" : ""}`} />
            </button>

            {filtersOpen && !filterDisabled && (
              <div className={`${ui.card} absolute top-[calc(100%+8px)] right-0 z-30 w-[min(20rem,calc(100vw-2rem))] p-4 shadow-xl`}>
                <div className="mb-4 flex items-center justify-between">
                  <strong className="text-sm">Filter visits</strong>
                  <button type="button" aria-label="Close filters" onClick={() => setFiltersOpen(false)} className={ui.iconBtn}>
                    <X size={16} />
                  </button>
                </div>
                {view === "list" && (
                  <FilterField label="Status">
                    <CustomDropdown
                      {...FILTER_DROPDOWN}
                      placeholder="Upcoming"
                      value={status}
                      options={STATUS_OPTIONS}
                      onChange={(value) => changeStatus(value as VisitTab)}
                    />
                  </FilterField>
                )}
                <FilterField label="Property">
                  <CustomDropdown
                    {...FILTER_DROPDOWN}
                    placeholder="All properties"
                    value={propertyFilter}
                    options={[{ label: "All properties", value: "" }, ...propertyOptions]}
                    onChange={setPropertyFilter}
                  />
                </FilterField>
                <FilterField label="Payment">
                  <CustomDropdown
                    {...FILTER_DROPDOWN}
                    placeholder="All payments"
                    value={paymentFilter}
                    options={[
                      { label: "All payments", value: "" },
                      { label: "Paid", value: "paid" },
                      { label: "Unpaid", value: "unpaid" },
                      { label: "Void", value: "void" },
                    ]}
                    onChange={setPaymentFilter}
                  />
                </FilterField>
                <FilterField label="Mode">
                  <CustomDropdown
                    {...FILTER_DROPDOWN}
                    placeholder="All modes"
                    value={modeFilter}
                    options={[
                      { label: "All modes", value: "" },
                      { label: "In person", value: "in_person" },
                      { label: "Virtual", value: "virtual" },
                    ]}
                    onChange={setModeFilter}
                  />
                </FilterField>
                <div className="mt-5 flex items-center justify-between gap-2">
                  <button type="button" className={`${ui.btn} ${ui.btnGhost} h-10 px-3 font-medium`} onClick={clearFilters}>
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
            <h2 className="m-0 text-xl font-semibold">Visits couldn’t load</h2>
            <p className={`mt-2 mb-5 text-sm ${ui.muted}`}>Check your connection and try again.</p>
            <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={() => void loadBookings()}>
              Try again
            </button>
          </section>
        ) : (
          <section aria-label="Property visits">
            {loading ? (
              <div className={`${ui.card} flex items-center justify-center py-20`}>
                <Spinner size={36} label="Loading visits" />
              </div>
            ) : view === "week" ? (
              /* Week view */
              <div>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button type="button" aria-label="Previous week" onClick={() => setWeekOffset((value) => value - 1)} className={roundButton}>
                      <ChevronLeft size={18} />
                    </button>
                    <button type="button" aria-label="Next week" onClick={() => setWeekOffset((value) => value + 1)} className={roundButton}>
                      <ChevronRight size={18} />
                    </button>
                    <strong className="ml-1 text-sm sm:text-base">{weekRangeLabel}</strong>
                  </div>
                  {weekOffset !== 0 && (
                    <button type="button" onClick={() => setWeekOffset(0)} className={`${ui.btn} ${ui.btnGhost} h-9 px-3`}>
                      This week
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
                  {weekDays.map((day) => {
                    const iso = toISODate(day);
                    const dayBookings = weekBookingsByDay.get(iso) ?? [];
                    const isToday = iso === todayISO;
                    return (
                      <section key={iso} className={`${ui.card} flex min-h-[140px] flex-col p-2.5 ${isToday ? "border-brand dark:border-brand-light" : ""}`}>
                        <header className="mb-2 flex items-baseline justify-between gap-2 border-b border-gray-200 pb-2 dark:border-white/10">
                          <span className="text-xs font-semibold uppercase">
                            {day.toLocaleDateString("en-GB", { weekday: "short" })}
                          </span>
                          <span className={`text-sm font-bold ${isToday ? "text-brand dark:text-brand-light" : ""}`}>{day.getDate()}</span>
                        </header>
                        {dayBookings.length === 0 ? (
                          <p className={`m-0 text-xs ${ui.muted}`}>No visits</p>
                        ) : (
                          <ul className="m-0 grid list-none gap-2 p-0">
                            {dayBookings.map((booking) => (
                              <li key={booking.id}>
                                <button
                                  type="button"
                                  onClick={() => void openBooking(booking.id)}
                                  className="w-full rounded-md border border-gray-200 bg-gray-50 p-2 text-left transition-colors hover:border-brand dark:border-white/10 dark:bg-neutral-800"
                                >
                                  <span className="block text-xs font-semibold">{formatVisitTime(booking.start)}</span>
                                  <span className="mt-0.5 block truncate text-xs">{visitorName(booking)}</span>
                                  <span className={`block truncate text-[11px] ${ui.muted}`}>{booking.property?.title || booking.reference}</span>
                                  <span className={`${visitStatusPillClass(booking.status)} mt-1.5`}>{visitStatusLabel(booking.status)}</span>
                                </button>
                              </li>
                            ))}
                          </ul>
                        )}
                      </section>
                    );
                  })}
                </div>
              </div>
            ) : !visibleBookings.length ? (
              <div className={ui.card}>{emptyState}</div>
            ) : (
              <>
                {/* Desktop table */}
                <div className={`${ui.card} hidden overflow-x-auto rounded-lg lg:block`}>
                  <table className="w-full min-w-[760px] border-collapse text-left [&>tbody>tr:last-child>td]:border-b-0">
                    <thead>
                      <tr>
                        <th className={`${ui.th} pl-5`}>When</th>
                        <th className={ui.th}>Visitor</th>
                        <th className={ui.th}>Property</th>
                        <th className={ui.th}>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {visibleBookings.map((booking) => (
                        <tr
                          key={booking.id}
                          {...rowProps(booking)}
                          className="cursor-pointer transition-colors hover:bg-gray-50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-brand dark:hover:bg-neutral-800/60"
                        >
                          <td className={`${ui.td} pl-5`}>
                            <p className="m-0 font-semibold whitespace-nowrap">{formatVisitDate(booking.date)}</p>
                            <p className={`m-0 mt-1 text-xs whitespace-nowrap ${ui.muted}`}>
                              {formatVisitTime(booking.start)} · {visitorCount(booking)}
                            </p>
                          </td>
                          <td className={ui.td}>
                            <p className="m-0 font-medium">{visitorName(booking)}</p>
                            <p className={`m-0 mt-1 text-xs uppercase ${ui.muted}`}>{booking.reference}</p>
                          </td>
                          <td className={ui.td}>
                            <p className="m-0 max-w-72 truncate">{booking.property?.title || "Property"}</p>
                          </td>
                          <td className={ui.td}>
                            <span className={visitStatusPillClass(booking.status)}>{visitStatusLabel(booking.status)}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Mobile / tablet cards */}
                <ul className="m-0 grid list-none gap-3 p-0 md:grid-cols-2 lg:hidden">
                  {visibleBookings.map((booking) => (
                    <li
                      key={booking.id}
                      {...rowProps(booking)}
                      className={`${ui.card} cursor-pointer p-3.5 transition-colors hover:border-gray-300 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand dark:hover:border-white/20`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="m-0 font-semibold">{formatVisitDate(booking.date)}</p>
                          <p className={`m-0 mt-0.5 text-xs ${ui.muted}`}>
                            {formatVisitTime(booking.start)} · {visitorCount(booking)}
                          </p>
                        </div>
                        <span className={visitStatusPillClass(booking.status)}>{visitStatusLabel(booking.status)}</span>
                      </div>
                      <div className="mt-3 border-t border-gray-200 pt-3 dark:border-white/10">
                        <p className="m-0 text-sm font-medium">{visitorName(booking)}</p>
                        <p className={`m-0 mt-0.5 truncate text-xs ${ui.muted}`}>
                          {booking.property?.title || "Property"} · {booking.reference}
                        </p>
                      </div>
                      <div className="mt-3 flex items-center justify-between gap-2">
                        <strong className="text-sm whitespace-nowrap">{money(booking.fee)}</strong>
                        <div className="flex items-center gap-2">
                          {booking.contact?.phone && (
                            <a
                              href={`tel:${booking.contact.phone}`}
                              onClick={(event) => event.stopPropagation()}
                              aria-label={`Call ${visitorName(booking)}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-700 hover:border-brand hover:text-brand dark:border-white/10 dark:text-gray-300"
                            >
                              <Phone size={14} />
                            </a>
                          )}
                          {booking.contact?.email && (
                            <a
                              href={`mailto:${booking.contact.email}`}
                              onClick={(event) => event.stopPropagation()}
                              aria-label={`Email ${visitorName(booking)}`}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-gray-200 text-gray-700 hover:border-brand hover:text-brand dark:border-white/10 dark:text-gray-300"
                            >
                              <Mail size={14} />
                            </a>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}

            {/* Pagination (list view only) */}
            {view === "list" && !loading && (
              <div className="mt-8 flex items-center justify-between gap-4 border-t border-gray-400 pt-6 dark:border-white/10">
                <p className="m-0 text-sm text-gray-800 dark:text-gray-300">
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
            )}
          </section>
        )}
      </main>

      <AgentBookPropertyVisitModal
        open={bookVisitOpen}
        onOpenChange={setBookVisitOpen}
        onBooked={() => {
          setPage(1);
          void loadBookings();
        }}
      />

      {detailLoading && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/45 p-5 backdrop-blur-sm">
          <div className={`${ui.card} grid h-20 w-20 place-items-center rounded-2xl shadow-2xl`}>
            <Spinner size={34} label="Loading visit" />
          </div>
        </div>
      )}

      {selectedBooking && (
        <AgentVisitDetailView
          booking={selectedBooking}
          agentName={agent?.name}
          onClose={() => setSelectedBooking(null)}
          onUpdated={(updated) => {
            setSelectedBooking(updated);
            setBookings((current) => current.map((item) => item.id === updated.id ? updated : item));
            void loadBookings();
          }}
        />
      )}

    </div>
  );
};

export default AgentVisitsPage;