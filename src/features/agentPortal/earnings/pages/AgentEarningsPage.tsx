import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  ArrowLeft,
  ArrowRight,
  ChevronDown,
  Filter,
  Search,
  Wallet,
  X,
} from "lucide-react";
import { Navigate, useNavigate } from "react-router";
import { Helmet } from "react-helmet-async";
import { toast } from "sonner";
import CustomDropdown from "@/shared/components/CustomDropdown";
import AgentDealDetailModal from "@/features/agentPortal/earnings/components/AgentDealDetailModal";
import AgentDealsTable from "@/features/agentPortal/earnings/components/AgentDealsTable";
import AgentEarningsCards from "@/features/agentPortal/earnings/components/AgentEarningsCards";
import AgentPayoutsTable from "@/features/agentPortal/earnings/components/AgentPayoutsTable";
import AgentPortalHeader from "@/features/agentPortal/common/components/AgentPortalHeader";
import AgentVisitFeesTable from "@/features/agentPortal/earnings/components/AgentVisitFeesTable";
import {
  agentAPI,
  agentErrorMessage,
  type AgentAttention,
  type AgentBooking,
  type AgentDeal,
  type AgentDealCounts,
  type AgentPayout,
  type AgentPayoutFilter,
  type AgentPayoutSummary,
  type AgentProfile,
  type AgentRatingSummary,
} from "@/features/agentPortal/common/services/agentAPI";
import { useAgentAuthStore } from "@/features/agentPortal/common/store/useAgentAuthStore";
import {
  DEALS_PAGE_SIZE,
  dealAmount,
  dealCustomerName,
  dealPropertyTitle,
  dealStatusLabel,
  DEAL_STATUS_OPTIONS,
  EARNINGS_TABS,
  formatDealDate,
  normalizeFilterOptions,
  PAYOUTS_PAGE_SIZE,
  PAYOUT_STATUS_OPTIONS,
  payoutAmount,
  payoutDescription,
  payoutPropertyTitle,
  payoutReference,
  payoutStatusLabel,
  type DealStatus,
  type EarningsTab,
  type NormalizedPayoutFilter,
  type PayoutStatus,
  VISIT_FEE_STATUS_OPTIONS,
} from "@/features/agentPortal/earnings/utils/agentEarningsUtils";
import { formatVisitDate, visitStatusLabel, VISITS_PAGE_SIZE } from "@/features/agentPortal/common/utils/agentVisitUtils";

const ui = {
  btn: "inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg px-4 text-sm font-semibold transition-colors disabled:cursor-wait disabled:opacity-60 sm:h-10",
  btnPrimary: "bg-highlight text-white shadow-sm hover:bg-highlight/90",
  btnGhost: "bg-transparent text-gray-900 hover:bg-gray-100 dark:text-white dark:hover:bg-neutral-800",
  control: "h-11 rounded-lg border border-gray-300 bg-white text-sm text-gray-900 dark:border-white/15 dark:bg-neutral-900 dark:text-white sm:h-10",
  card: "rounded-xl border border-gray-200 bg-white dark:border-white/10 dark:bg-neutral-900",
  muted: "text-gray-600 dark:text-gray-400",
  iconBtn: "grid h-9 w-9 shrink-0 place-items-center rounded-lg border-0 bg-transparent text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-neutral-800 dark:hover:text-white",
};

const FILTER_DROPDOWN = {
  className: "w-full",
  buttonClassName: "h-10 w-full rounded-lg border border-gray-200 bg-white! px-3 text-left text-sm text-gray-900! hover:border-highlight dark:border-white/10 dark:bg-neutral-900! dark:text-white!",
  menuClassName: "overflow-hidden rounded-xl border-gray-300! bg-white! text-gray-900! shadow-lg! dark:border-white/15! dark:bg-neutral-900! dark:text-white! [&>div]:max-h-60 [&>div]:overflow-x-hidden [&>div]:overflow-y-auto [&>div]:bg-white! dark:[&>div]:bg-neutral-900! [&>div]:[scrollbar-width:none] [&>div::-webkit-scrollbar]:hidden [&>div>button]:whitespace-normal",
  menuItemClassName: "block w-full bg-white! px-4 py-2.5 text-left text-sm whitespace-normal text-gray-900! transition hover:bg-gray-100! dark:bg-neutral-900! dark:text-white! dark:hover:bg-neutral-800!",
};

const roundButton =
  "cursor-pointer rounded-full border border-gray-300 bg-white p-2.5 text-gray-900 transition hover:border-highlight hover:text-highlight disabled:cursor-not-allowed disabled:opacity-30 dark:border-white/20 dark:bg-[#101010] dark:text-white";

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

const FilterField = ({ label, children }: { label: string; children: ReactNode }) => (
  <div className="mb-4">
    <span className={`mb-1.5 block text-xs font-medium ${ui.muted}`}>{label}</span>
    {children}
  </div>
);

const AgentEarningsPage = () => {
  const token = useAgentAuthStore((state) => state.token);
  const logout = useAgentAuthStore((state) => state.logout);
  const navigate = useNavigate();

  const [agent, setAgent] = useState<AgentProfile | null>(null);
  const [attention, setAttention] = useState<AgentAttention | null>(null);
  const [payouts, setPayouts] = useState<AgentPayout[]>([]);
  const [summary, setSummary] = useState<AgentPayoutSummary | null>(null);
  const [payoutFilters, setPayoutFilters] = useState<NormalizedPayoutFilter[]>([]);
  const [deals, setDeals] = useState<AgentDeal[]>([]);
  const [dealCounts, setDealCounts] = useState<AgentDealCounts | null>(null);
  const [dealFilters, setDealFilters] = useState<NormalizedPayoutFilter[]>([]);
  const [bookings, setBookings] = useState<AgentBooking[]>([]);
  const [visitFeeFilters, setVisitFeeFilters] = useState<NormalizedPayoutFilter[]>([]);
  const [rating, setRating] = useState<AgentRatingSummary | null>(null);
  const [tab, setTab] = useState<EarningsTab>("payout");
  const [status, setStatus] = useState<PayoutStatus>("");
  const [dealStatus, setDealStatus] = useState<DealStatus>("");
  const [visitStatus, setVisitStatus] = useState("");
  const [page, setPage] = useState(1);
  const [dealPage, setDealPage] = useState(1);
  const [visitPage, setVisitPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [dealTotal, setDealTotal] = useState(0);
  const [visitFeeTotal, setVisitFeeTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [dealSearch, setDealSearch] = useState("");
  const [visitSearch, setVisitSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filterValues, setFilterValues] = useState<Record<string, string>>({});
  const [dealFilterValues, setDealFilterValues] = useState<Record<string, string>>({});
  const [visitFilterValues, setVisitFilterValues] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(false);
  const [dealLoading, setDealLoading] = useState(true);
  const [dealListError, setDealListError] = useState(false);
  const [visitLoading, setVisitLoading] = useState(true);
  const [visitListError, setVisitListError] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState<AgentDeal | null>(null);

  const loadPayouts = useCallback(async () => {
    setLoading(true);
    setListError(false);
    try {
      const response = await agentAPI.getPayouts({
        page,
        limit: PAYOUTS_PAGE_SIZE,
        ...(status ? { status } : {}),
        ...filterValues,
      });
      setPayouts(response.data);
      setTotal(response.total);
      setSummary(response.summary);
    } catch (error) {
      setListError(true);
      toast.error(agentErrorMessage(error, "We couldn't load your earnings. Please try again."));
      console.error("Agent payouts failed to load:", error);
    } finally {
      setLoading(false);
    }
  }, [filterValues, page, status]);

  const loadDeals = useCallback(async () => {
    if (!token) return;
    setDealLoading(true);
    setDealListError(false);
    try {
      const response = await agentAPI.getDeals({
        page: dealPage,
        limit: DEALS_PAGE_SIZE,
        ...(dealStatus ? { status: dealStatus } : {}),
        ...dealFilterValues,
      });
      setDeals(response.data);
      setDealTotal(response.total);
      setDealCounts(response.counts);
    } catch (error) {
      setDealListError(true);
      toast.error(agentErrorMessage(error, "We couldn't load your deals. Please try again."));
      console.error("Agent deals failed to load:", error);
    } finally {
      setDealLoading(false);
    }
  }, [dealFilterValues, dealPage, dealStatus, token]);

  const loadVisitFees = useCallback(async () => {
    if (!token) return;
    setVisitLoading(true);
    setVisitListError(false);
    try {
      const response = await agentAPI.getBookings({
        page: visitPage,
        limit: VISITS_PAGE_SIZE,
        ...(visitStatus ? { status: visitStatus } : {}),
        ...visitFilterValues,
      });
      setBookings(response.data);
      setVisitFeeTotal(response.total);
    } catch (error) {
      setVisitListError(true);
      toast.error(agentErrorMessage(error, "We couldn't load your visit fees. Please try again."));
      console.error("Agent visit fees failed to load:", error);
    } finally {
      setVisitLoading(false);
    }
  }, [token, visitFilterValues, visitPage, visitStatus]);

  const loadMeta = useCallback(async () => {
    try {
      const [profile, needsAttention, ratingSummary, payoutFilterResponse, dealFilterResponse, bookingFilterResponse] = await Promise.all([
        agentAPI.getMe(),
        agentAPI.getAttention(),
        agentAPI.getRatingSummary(),
        agentAPI.getPayoutFilters(),
        agentAPI.getDealFilters(),
        agentAPI.getBookingFilters(),
      ]);
      setAgent(profile);
      setAttention(needsAttention);
      setRating(ratingSummary);
      setPayoutFilters(normalizeFilterOptions(payoutFilterResponse.filters));
      setDealFilters(normalizeFilterOptions(dealFilterResponse.filters));
      setVisitFeeFilters(normalizeFilterOptions(bookingFilterResponse.filters as AgentPayoutFilter[]));
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't load your earnings details."));
      console.error("Agent earnings details failed to load:", error);
    }
  }, []);

  useEffect(() => {
    if (token) void loadPayouts();
  }, [loadPayouts, token]);

  useEffect(() => {
    if (token) void loadDeals();
  }, [loadDeals, token]);

  useEffect(() => {
    if (token) void loadVisitFees();
  }, [loadVisitFees, token]);

  useEffect(() => {
    if (token) void loadMeta();
  }, [loadMeta, token]);

  useEffect(() => {
    if (!filtersOpen) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setFiltersOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [filtersOpen]);

  const visiblePayouts = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    if (!query) return payouts;
    return payouts.filter((payout) => [
      payoutReference(payout),
      payoutDescription(payout),
      payoutPropertyTitle(payout),
      payoutStatusLabel(payout.status),
      payoutAmount(payout),
    ].some((value) => value.toLocaleLowerCase().includes(query)));
  }, [payouts, search]);

  const visibleDeals = useMemo(() => {
    const query = dealSearch.trim().toLocaleLowerCase();
    if (!query) return deals;
    return deals.filter((deal) => [
      deal.orderNumber,
      dealPropertyTitle(deal),
      dealCustomerName(deal),
      dealStatusLabel(deal.status),
      dealAmount(deal),
      formatDealDate(deal.createdAt) ?? "",
    ].some((value) => value.toLocaleLowerCase().includes(query)));
  }, [dealSearch, deals]);

  const visibleVisitFees = useMemo(() => {
    const query = visitSearch.trim().toLocaleLowerCase();
    if (!query) return bookings;
    return bookings.filter((booking) => [
      booking.reference,
      booking.property?.title || "",
      booking.contact?.name || booking.customer?.name || "",
      visitStatusLabel(booking.status),
      visitStatusLabel(booking.paymentStatus),
      String(booking.fee ?? ""),
      formatVisitDate(booking.date),
    ].some((value) => value.toLocaleLowerCase().includes(query)));
  }, [bookings, visitSearch]);

  const handleDealUpdated = useCallback((updated: AgentDeal) => {
    setDeals((current) => current.map((deal) => deal.id === updated.id ? updated : deal));
    setSelectedDeal((current) => current?.id === updated.id ? updated : current);
  }, []);

  if (!token) return <Navigate to="/agent/login" replace />;

  const handleLogout = () => {
    logout();
    navigate("/agent/login", { replace: true });
  };

  const changeTab = (nextTab: EarningsTab) => {
    setTab(nextTab);
    setPage(1);
    setDealPage(1);
    setVisitPage(1);
    setSearch("");
    setDealSearch("");
    setVisitSearch("");
    setFiltersOpen(false);
  };

  const changeStatus = (nextStatus: PayoutStatus) => {
    setStatus(nextStatus);
    setPage(1);
  };

  const changeDealStatus = (nextStatus: DealStatus) => {
    setDealStatus(nextStatus);
    setDealPage(1);
  };

  const changeVisitStatus = (nextStatus: string) => {
    setVisitStatus(nextStatus);
    setVisitPage(1);
  };

  const clearFilters = () => {
    setFilterValues({});
    setStatus("");
    setSearch("");
    setFiltersOpen(false);
  };

  const clearDealFilters = () => {
    setDealFilterValues({});
    setDealStatus("");
    setDealSearch("");
    setFiltersOpen(false);
  };

  const clearVisitFilters = () => {
    setVisitFilterValues({});
    setVisitStatus("");
    setVisitSearch("");
    setFiltersOpen(false);
  };

  const activeFilterCount = Object.values(filterValues).filter(Boolean).length + Number(Boolean(status));
  const activeDealFilterCount = Object.values(dealFilterValues).filter(Boolean).length + Number(Boolean(dealStatus));
  const activeVisitFilterCount = Object.values(visitFilterValues).filter(Boolean).length + Number(Boolean(visitStatus));
  const isFiltering = Boolean(search || activeFilterCount);
  const isDealFiltering = Boolean(dealSearch || activeDealFilterCount);
  const isVisitFiltering = Boolean(visitSearch || activeVisitFilterCount);
  const summaryCount = summary
    ? summary.pending.count + summary.paid.count + summary.void.count
    : total;
  const countForTab = (value: EarningsTab) => {
    if (value === "payout") return summaryCount;
    if (value === "deals") return dealCounts?.all ?? dealTotal;
    if (value === "visit_fee") return visitFeeTotal;
    return "—";
  };
  const pageCount = Math.max(1, Math.ceil(total / PAYOUTS_PAGE_SIZE));
  const dealPageCount = Math.max(1, Math.ceil(dealTotal / DEALS_PAGE_SIZE));
  const visitPageCount = Math.max(1, Math.ceil(visitFeeTotal / VISITS_PAGE_SIZE));

  const isPayoutTab = tab === "payout";
  const isDealsTab = tab === "deals";
  const currentSearch = isPayoutTab ? search : isDealsTab ? dealSearch : visitSearch;
  const setCurrentSearch = isPayoutTab ? setSearch : isDealsTab ? setDealSearch : setVisitSearch;
  const currentFilters = isPayoutTab ? payoutFilters : isDealsTab ? dealFilters : visitFeeFilters;
  const currentFilterValues = isPayoutTab ? filterValues : isDealsTab ? dealFilterValues : visitFilterValues;
  const setCurrentFilterValues = isPayoutTab ? setFilterValues : isDealsTab ? setDealFilterValues : setVisitFilterValues;
  const currentStatus = isPayoutTab ? status : isDealsTab ? dealStatus : visitStatus;
  const currentStatusOptions: { label: string; value: string }[] = isPayoutTab
    ? PAYOUT_STATUS_OPTIONS
    : isDealsTab
      ? DEAL_STATUS_OPTIONS
      : VISIT_FEE_STATUS_OPTIONS;
  const currentActiveFilterCount = isPayoutTab ? activeFilterCount : isDealsTab ? activeDealFilterCount : activeVisitFilterCount;
  const currentListCount = isPayoutTab
    ? summaryCount
    : isDealsTab
      ? dealCounts?.all ?? dealTotal
      : visitFeeTotal;
  const filterDisabled = currentListCount < 5 && !currentSearch && currentActiveFilterCount === 0;
  const clearCurrentFilters = isPayoutTab ? clearFilters : isDealsTab ? clearDealFilters : clearVisitFilters;
  const currentFilterHeading = isPayoutTab ? "Filter payouts" : isDealsTab ? "Filter deals" : "Filter visit fees";
  const currentSearchLabel = isPayoutTab ? "Search payouts" : isDealsTab ? "Search deals" : "Search visit fees";

  return (
    <div data-agent-scroll className="fixed inset-0 overflow-y-auto overscroll-contain bg-gray-300 font-sans text-gray-900 dark:bg-neutral-950 dark:text-white">
      <Helmet>
        <title>Earnings | RewaCiti Agent Portal</title>
        <meta name="description" content="Track your RewaCiti payouts, deals, visit fees, rating, and verification status." />
      </Helmet>

      <AgentPortalHeader
        name={agent?.name ?? "Agent"}
        email={agent?.email}
        payoutCount={attention?.payouts}
        visitCount={attention?.bookings}
        activePage="earnings"
        onViewProfile={() => navigate("/agent/profile")}
        onLogout={handleLogout}
      />

      <main className="isolate mx-auto min-h-[calc(100vh-64px)] w-full max-w-[1440px] px-4 pt-5 pb-24 sm:px-6 sm:pb-16 lg:px-10">
        <div className="mb-5">
          <h1 className="m-0 text-xl font-bold tracking-tight sm:text-2xl">Earnings</h1>
          <p className={`mt-1 text-sm ${ui.muted}`}>What you’ve earned from deals and visits, and what’s been paid.</p>
        </div>

        <div className="mb-5">
          <AgentEarningsCards
            summary={summary}
            commissionPercent={agent?.commissionPercent}
            rating={rating}
          />
        </div>

        <nav className="-mx-4 mb-4 overflow-x-auto overflow-y-hidden border-b border-gray-400/60 px-4 [scrollbar-width:none] sm:mx-0 sm:px-0 dark:border-white/15 [&::-webkit-scrollbar]:hidden" aria-label="Filter earnings by type">
          <div className="flex min-w-max gap-1">
            {EARNINGS_TABS.map((filter) => {
              const active = tab === filter.value;
              const countLabel = countForTab(filter.value);
              return (
                <button
                  key={filter.value}
                  type="button"
                  aria-current={active ? "page" : undefined}
                  onClick={() => changeTab(filter.value)}
                  className={`-mb-px inline-flex h-11 items-center gap-2 border-b-2 px-3 text-sm whitespace-nowrap transition-colors ${active
                    ? "border-highlight font-semibold text-gray-900 dark:border-highlight dark:text-white"
                    : "border-transparent text-gray-700 hover:border-gray-400 hover:text-gray-900 dark:text-gray-400 dark:hover:border-white/30 dark:hover:text-white"}`}
                >
                  {filter.label}
                  {countLabel !== "—" && (
                    <span className={`inline-grid h-5 min-w-5 place-items-center rounded-full px-1.5 text-xs font-semibold ${active ? "bg-highlight/10 text-highlight dark:bg-highlight/15 dark:text-highlight" : "bg-gray-200 text-gray-700 dark:bg-neutral-800 dark:text-gray-400"}`}>
                      {countLabel}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </nav>

        <div className="mb-5 flex items-center justify-between gap-2 sm:gap-3">
          <label className={`${ui.control} flex min-w-0 flex-1 items-center gap-2 px-3 text-gray-500 focus-within:border-highlight focus-within:ring-2 focus-within:ring-highlight/15 sm:max-w-md dark:text-gray-400`}>
            <Search size={17} aria-hidden="true" className="shrink-0" />
            <input
              type="search"
              aria-label={currentSearchLabel}
              placeholder={`${currentSearchLabel}...`}
              value={currentSearch}
              onChange={(event) => setCurrentSearch(event.target.value)}
              className="w-full min-w-0 border-0 bg-transparent text-sm text-gray-900 outline-0 placeholder:text-gray-500 dark:text-white dark:placeholder:text-gray-400"
            />
            {currentSearch && (
              <button type="button" aria-label="Clear search" onClick={() => setCurrentSearch("")} className="grid h-7 w-7 shrink-0 place-items-center rounded-md text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-neutral-800">
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
              {currentActiveFilterCount > 0 && <span className="grid h-5 min-w-5 place-items-center rounded-full bg-highlight px-1.5 text-xs font-semibold text-white">{currentActiveFilterCount}</span>}
              <ChevronDown size={15} className={`transition-transform duration-200 max-sm:hidden ${filtersOpen ? "rotate-180" : ""}`} />
            </button>

            {filtersOpen && !filterDisabled && (
              <div className={`${ui.card} absolute top-[calc(100%+8px)] right-0 z-30 w-[min(20rem,calc(100vw-2rem))] p-4 shadow-xl`}>
                <div className="mb-4 flex items-center justify-between">
                  <strong className="text-sm">{currentFilterHeading}</strong>
                  <button type="button" aria-label="Close filters" onClick={() => setFiltersOpen(false)} className={ui.iconBtn}>
                    <X size={16} />
                  </button>
                </div>
                <FilterField label="Status">
                  <CustomDropdown
                    {...FILTER_DROPDOWN}
                    placeholder="All statuses"
                    value={currentStatus}
                    options={currentStatusOptions}
                    onChange={(value) => {
                      if (isPayoutTab) changeStatus(value as PayoutStatus);
                      else if (isDealsTab) changeDealStatus(value as DealStatus);
                      else changeVisitStatus(value);
                    }}
                  />
                </FilterField>
                {currentFilters.map((filter) => (
                  <FilterField key={filter.id} label={filter.label}>
                    <CustomDropdown
                      {...FILTER_DROPDOWN}
                      placeholder={`All ${filter.label.toLowerCase()}`}
                      value={currentFilterValues[filter.field] ?? ""}
                      options={[{ label: `All ${filter.label.toLowerCase()}`, value: "" }, ...filter.options]}
                      onChange={(value) => {
                        setCurrentFilterValues((current) => ({ ...current, [filter.field]: value }));
                        if (isPayoutTab) setPage(1);
                        else if (isDealsTab) setDealPage(1);
                        else setVisitPage(1);
                      }}
                    />
                  </FilterField>
                ))}
                <div className="mt-5 flex items-center justify-between gap-2">
                  <button type="button" className={`${ui.btn} ${ui.btnGhost} h-10 px-3 font-medium`} onClick={clearCurrentFilters}>
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

        {tab === "payout" ? (
          listError ? (
            <section className={`${ui.card} flex min-h-[300px] flex-col items-center justify-center border-dashed p-8 text-center`}>
              <h2 className="m-0 text-xl font-semibold">Earnings couldn’t load</h2>
              <p className={`mt-2 mb-5 text-sm ${ui.muted}`}>Check your connection and try again.</p>
              <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={() => void loadPayouts()}>
                Try again
              </button>
            </section>
          ) : (
            <section aria-label="Payouts list">
              {loading ? (
                <div className={`${ui.card} flex items-center justify-center py-20`}>
                  <Spinner size={36} label="Loading payouts" />
                </div>
              ) : !visiblePayouts.length ? (
                <div className={`${ui.card} flex min-h-[300px] flex-col items-center justify-center px-5 py-10 text-center`}>
                  <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-highlight/10 text-highlight dark:bg-highlight/15 dark:text-highlight">
                    <Wallet size={22} />
                  </div>
                  <h2 className="m-0 text-base font-semibold">
                    {isFiltering ? "No matching payouts" : "No payouts yet"}
                  </h2>
                  <p className={`mt-1.5 mb-0 text-sm ${ui.muted}`}>
                    {isFiltering
                      ? "Try changing your search or filters."
                      : "Commission payouts from your completed deals will appear here."}
                  </p>
                </div>
              ) : (
                <AgentPayoutsTable payouts={visiblePayouts} />
              )}

              {!loading && (
                <div className="mt-8 flex items-center justify-between gap-4 border-t border-gray-400 pt-6 dark:border-white/10">
                  <p className="m-0 text-sm text-gray-800 dark:text-gray-300">Page {page} of {pageCount}</p>
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
          )
        ) : tab === "deals" ? (
          dealListError ? (
            <section className={`${ui.card} flex min-h-[300px] flex-col items-center justify-center border-dashed p-8 text-center`}>
              <h2 className="m-0 text-xl font-semibold">Deals couldn’t load</h2>
              <p className={`mt-2 mb-5 text-sm ${ui.muted}`}>Check your connection and try again.</p>
              <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={() => void loadDeals()}>
                Try again
              </button>
            </section>
          ) : (
            <section aria-label="Deals list">
              {dealLoading ? (
                <div className={`${ui.card} flex items-center justify-center py-20`}>
                  <Spinner size={36} label="Loading deals" />
                </div>
              ) : !visibleDeals.length ? (
                <div className={`${ui.card} flex min-h-[300px] flex-col items-center justify-center px-5 py-10 text-center`}>
                  <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-highlight/10 text-highlight dark:bg-highlight/15 dark:text-highlight">
                    <Wallet size={22} />
                  </div>
                  <h2 className="m-0 text-base font-semibold">
                    {isDealFiltering ? "No matching deals" : "No deals yet"}
                  </h2>
                  <p className={`mt-1.5 mb-0 text-sm ${ui.muted}`}>
                    {isDealFiltering
                      ? "Try changing your search or filters."
                      : "Deals you start will appear here."}
                  </p>
                </div>
              ) : (
                <AgentDealsTable deals={visibleDeals} onSelect={setSelectedDeal} />
              )}

              {!dealLoading && visibleDeals.length > 0 && (
                <div className="mt-8 flex items-center justify-between gap-4 border-t border-gray-400 pt-6 dark:border-white/10">
                  <p className="m-0 text-sm text-gray-800 dark:text-gray-300">Page {dealPage} of {dealPageCount}</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setDealPage((current) => Math.max(1, current - 1))}
                      className={roundButton}
                      disabled={dealPage <= 1}
                      aria-label="Previous page"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setDealPage((current) => Math.min(dealPageCount, current + 1))}
                      className={roundButton}
                      disabled={dealPage >= dealPageCount}
                      aria-label="Next page"
                    >
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </section>
          )
        ) : (
          visitListError ? (
            <section className={`${ui.card} flex min-h-[300px] flex-col items-center justify-center border-dashed p-8 text-center`}>
              <h2 className="m-0 text-xl font-semibold">Visit fees couldn’t load</h2>
              <p className={`mt-2 mb-5 text-sm ${ui.muted}`}>Check your connection and try again.</p>
              <button type="button" className={`${ui.btn} ${ui.btnPrimary}`} onClick={() => void loadVisitFees()}>
                Try again
              </button>
            </section>
          ) : (
            <section aria-label="Visit fees list">
              {visitLoading ? (
                <div className={`${ui.card} flex items-center justify-center py-20`}>
                  <Spinner size={36} label="Loading visit fees" />
                </div>
              ) : !visibleVisitFees.length ? (
                <div className={`${ui.card} flex min-h-[300px] flex-col items-center justify-center px-5 py-10 text-center`}>
                  <div className="mb-3 grid h-12 w-12 place-items-center rounded-full bg-highlight/10 text-highlight dark:bg-highlight/15 dark:text-highlight">
                    <Wallet size={22} />
                  </div>
                  <h2 className="m-0 text-base font-semibold">
                    {isVisitFiltering ? "No matching visit fees" : "No visit fees yet"}
                  </h2>
                  <p className={`mt-1.5 mb-0 text-sm ${ui.muted}`}>
                    {isVisitFiltering
                      ? "Try changing your search or filters."
                      : "Fees from your scheduled visits will appear here."}
                  </p>
                </div>
              ) : (
                <AgentVisitFeesTable bookings={visibleVisitFees} />
              )}

              {!visitLoading && visibleVisitFees.length > 0 && (
                <div className="mt-8 flex items-center justify-between gap-4 border-t border-gray-400 pt-6 dark:border-white/10">
                  <p className="m-0 text-sm text-gray-800 dark:text-gray-300">Page {visitPage} of {visitPageCount}</p>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setVisitPage((current) => Math.max(1, current - 1))}
                      className={roundButton}
                      disabled={visitPage <= 1}
                      aria-label="Previous page"
                    >
                      <ArrowLeft size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setVisitPage((current) => Math.min(visitPageCount, current + 1))}
                      className={roundButton}
                      disabled={visitPage >= visitPageCount}
                      aria-label="Next page"
                    >
                      <ArrowRight size={18} />
                    </button>
                  </div>
                </div>
              )}
            </section>
          )
        )}
      </main>

      {selectedDeal && (
        <AgentDealDetailModal
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
          onUpdated={handleDealUpdated}
        />
      )}
    </div>
  );
};

export default AgentEarningsPage;