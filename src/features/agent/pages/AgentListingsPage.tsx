import { useCallback, useEffect, useMemo, useState } from "react";
import { CalendarPlus, CalendarClock, ChevronDown, ChevronFirst, ChevronLast, ChevronLeft, ChevronRight, Clock3, Eye, EyeOff, Filter, ImagePlus, MapPin, MessageSquare, MoreHorizontal, Pencil, Plus, Search, Star, X } from "lucide-react";
import { toast } from "sonner";
import CustomDropdown from "../../properties/components/CustomDropdown";
import { agentAPI, agentErrorMessage, type AgentAttention, type AgentProfile, type AgentProperty, type AgentPropertyCounts, type AgentPropertyType } from "../services/agentAPI";
import { PAGE_SIZE, STATUS_FILTERS, PROPERTY_PURPOSES, money, statusLabel, periodLabel, periodShortLabel, purposeLabel } from "../utils/agentListingUtils";
import type { ListingTab, PropertyDetailAction } from "../utils/agentListingUtils";
import { Navigate, useNavigate } from "react-router";
import { Helmet } from "react-helmet-async";
import AgentPortalHeader from "../components/AgentPortalHeader";
import AgentProfileModal from "../components/AgentProfileModal";
import { useAgentAuthStore } from "../store/useAgentAuthStore";
import AgentListingEditor from "../components/AgentListingEditor";
import AgentPropertyOverview from "../components/AgentPropertyOverview";
import "../styles/AgentPortal.css";

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
  const [pageSize, setPageSize] = useState(PAGE_SIZE);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [purposeFilter, setPurposeFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [propertyTypes, setPropertyTypes] = useState<AgentPropertyType[]>([]);
  const [loading, setLoading] = useState(true);
  const [listError, setListError] = useState(false);
  const [selectedProperty, setSelectedProperty] = useState<AgentProperty | null>(null);
  const [detailAction, setDetailAction] = useState<PropertyDetailAction>("details");
  const [detailLoading, setDetailLoading] = useState(false);
  const [editingProperty, setEditingProperty] = useState<AgentProperty | null | undefined>(undefined);
  const [profileOpen, setProfileOpen] = useState(false);

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

  const openProperty = async (id: string, action: PropertyDetailAction = "details") => {
    setDetailLoading(true);
    setSelectedProperty(null);
    setDetailAction(action);
    try {
      setSelectedProperty(await agentAPI.getProperty(id));
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't open that listing. Please try again."));
      console.error("Agent listing detail failed to load:", error);
    } finally {
      setDetailLoading(false);
    }
  };

  const openPropertyForEdit = async (id: string) => {
    setDetailLoading(true);
    try {
      setEditingProperty(await agentAPI.getProperty(id));
    } catch (error) {
      toast.error(agentErrorMessage(error, "We couldn't open that listing for editing. Please try again."));
      console.error("Agent listing edit failed to load:", error);
    } finally {
      setDetailLoading(false);
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
    if (action === "edit") {
      void openPropertyForEdit(property.id);
    } else if (action === "availability") {
      void openProperty(property.id, "availability");
    } else if (action === "book") {
      void openProperty(property.id, "book");
    } else if (action === "withdraw") {
      void openProperty(property.id, "withdraw");
    }
  };

  const pageCount = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="agent-portal">
      <Helmet>
        <title>My listings | RewaCiti Agent Portal</title>
        <meta name="description" content="View and manage your RewaCiti property listings." />
      </Helmet>
      <AgentPortalHeader
        name={agent?.name ?? "Agent"}
        email={agent?.email}
        payoutCount={attention?.payouts}
        activePage="listings"
        onEditProfile={() => setProfileOpen(true)}
        onLogout={handleLogout}
      />

      <main className="agent-dashboard agent-listings-page">
        <div className="agent-listings-heading">
          <div>
            <h1>My listings</h1>
            <p className="agent-subtitle">New listings are checked by RewaCiti before they go live.</p>
          </div>
          <button type="button" className="agent-primary-button agent-listing-create-button" onClick={() => setEditingProperty(null)}>
            <Plus size={18} /> New listing
          </button>
        </div>

        <nav className="agent-listing-filters" aria-label="Filter listings by status">
          {STATUS_FILTERS.map((filter) => (
            <button
              type="button"
              key={filter.value}
              className={`agent-listing-filter${status === filter.value ? " is-active" : ""}`}
              onClick={() => changeStatus(filter.value)}
            >
              {filter.label}<span>{countForStatus(filter.value)}</span>
            </button>
          ))}
        </nav>

        <div className="agent-listing-toolbar">
          <label className="agent-listing-search">
            <Search size={17} aria-hidden="true" />
            <input
              type="search"
              aria-label="Search listings"
              placeholder="Search your listings..."
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {search && <button type="button" aria-label="Clear search" onClick={() => setSearch("")}><X size={15} /></button>}
          </label>
          <div className={`agent-listing-filter-control${filtersOpen ? " is-open" : ""}`}>
            <button type="button" className={`agent-listing-filter-button${filtersOpen ? " is-active" : ""}`} onClick={() => setFiltersOpen((open) => !open)} aria-expanded={filtersOpen}>
              <Filter size={16} /> Filters <ChevronDown size={15} className="agent-listing-filter-chevron" />
            </button>
            {filtersOpen && (
              <div className="agent-listing-filter-popover">
                <div className="agent-filter-popover-heading">
                  <strong>Filter listings</strong>
                  <button type="button" aria-label="Close filters" onClick={() => setFiltersOpen(false)}><X size={16} /></button>
                </div>
                <label className="agent-form-field"><span>Property type</span>
                  <CustomDropdown
                    className="agent-filter-dropdown"
                    buttonClassName="agent-filter-dropdown-trigger"
                    menuClassName="agent-filter-dropdown-menu"
                    menuItemClassName="agent-filter-dropdown-menu-item"
                    placeholder="All types"
                    value={typeFilter}
                    options={[{ label: "All types", value: "" }, ...propertyTypes.map((type) => ({ label: type.name, value: type.id }))]}
                    onChange={setTypeFilter}
                  />
                </label>
                <label className="agent-form-field"><span>Purpose</span>
                  <CustomDropdown
                    className="agent-filter-dropdown"
                    buttonClassName="agent-filter-dropdown-trigger"
                    menuClassName="agent-filter-dropdown-menu"
                    menuItemClassName="agent-filter-dropdown-menu-item"
                    placeholder="All purposes"
                    value={purposeFilter}
                    options={[{ label: "All purposes", value: "" }, ...PROPERTY_PURPOSES.map(([value, label]) => ({ label, value }))]}
                    onChange={setPurposeFilter}
                  />
                </label>
                <div className="agent-filter-popover-actions">
                  <button type="button" className="agent-listing-filter-clear" onClick={() => { setTypeFilter(""); setPurposeFilter(""); }}>Clear all</button>
                  <button type="button" className="agent-filter-apply" onClick={() => setFiltersOpen(false)}>Show results</button>
                </div>
              </div>
            )}
          </div>
        </div>

        {listError ? (
          <section className="agent-listings-empty">
            <h2>Listings couldn’t load</h2>
            <p>Check your connection and try again.</p>
            <button type="button" className="agent-primary-button" onClick={() => void loadProperties()}>Try again</button>
          </section>
        ) : (
          <section className="agent-listing-table-shell" aria-label="Property listings">
            <div className="agent-listing-table-scroll">
              <table className="agent-listing-table">
                <thead><tr>
                  <th>Property</th><th>Type</th><th>Price</th><th>Status</th><th>Activity</th><th>Actions</th>
                </tr></thead>
                <tbody>
                  {loading ? (
                    [0, 1, 2, 3].map((item) => <tr className="agent-listing-loading-row" key={item}><td colSpan={6}><span /></td></tr>)
                  ) : visibleProperties.length ? visibleProperties.map((property) => (
                    <tr
                      className="agent-listing-row-clickable"
                      key={property.id}
                      tabIndex={0}
                      aria-label={`View details for ${property.title}`}
                      onClick={() => void openProperty(property.id)}
                      onKeyDown={(event) => {
                        if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) {
                          event.preventDefault();
                          void openProperty(property.id);
                        }
                      }}
                    >
                      <td>
                        <div className="agent-table-property">
                          <button type="button" className="agent-table-thumbnail" aria-label={`Edit ${property.title}`}>
                            {property.photos[0] ? <img src={property.photos[0]} alt="" loading="lazy" /> : <ImagePlus size={19} />}
                          </button>
                          <div>
                            <button type="button" className="agent-table-property-title">{property.title}</button>
                            <span>{[property.location.area, property.location.city, property.location.state].filter(Boolean).join(", ") || "Location not added"}</span>
                          </div>
                        </div>
                      </td>
                      <td><span className="agent-table-type">{propertyTypes.find((type) => type.id === property.typeId)?.name ?? "Property"}</span><small>{purposeLabel(property.purpose)}</small></td>
                      <td><strong className="agent-table-price">{money(property.price, property.currency)}</strong><small className="agent-table-price-period">{periodShortLabel(property.pricePeriod) || periodLabel(property.pricePeriod)}</small></td>
                      <td><span className={`agent-status-pill status-${property.status}`}>{statusLabel(property.status)}</span></td>
                      <td>
                        <div className="agent-listing-activity" aria-label={`${property.views} views, ${property.inquiryCount ?? 0} inquiries, ${property.visitCount ?? 0} visits and ${property.rating.count} reviews`}>
                          <span title="Views"><Eye size={14} />{property.views}</span>
                          <span title="Inquiries"><MessageSquare size={14} />{property.inquiryCount ?? 0}</span>
                          <span title="Visits"><CalendarClock size={14} />{property.visitCount ?? 0}</span>
                          <span title="Reviews"><Star size={14} />{property.rating.count}</span>
                        </div>
                      </td>
                      <td className="agent-table-actions-cell">
                        <CustomDropdown
                          className="agent-table-action-dropdown"
                          buttonClassName="agent-table-action-button"
                          triggerContent={<MoreHorizontal size={19} />}
                          ariaLabel={`Actions for ${property.title}`}
                          placeholder=""
                          value=""
                          portal
                          menuClassName="agent-table-action-menu"
                          menuItemClassName="agent-table-action-menu-item"
                          menuWidth={184}
                          options={[
                            { label: "Edit", value: "edit", icon: <Pencil size={16} /> },
                            { label: "Visiting hours", value: "availability", icon: <Clock3 size={16} /> },
                            ...(property.status === "published" ? [
                              { label: "Book a visit", value: "book", icon: <CalendarPlus size={16} /> },
                              { label: "Take off the site", value: "withdraw", icon: <EyeOff size={16} />, danger: true },
                            ] : []),
                          ]}
                          onChange={(action) => handleListingAction(action, property)}
                        />
                      </td>
                    </tr>
                  )) : (
                    <tr><td colSpan={6}>
                      <div className="agent-table-empty">
                        <div className="agent-empty-icon"><MapPin size={22} /></div>
                        <h2>{search || typeFilter || purposeFilter ? "No matching properties" : status === "all" ? "No listings yet" : `No ${STATUS_FILTERS.find((item) => item.value === status)?.label.toLowerCase()} listings`}</h2>
                        <p>{search || typeFilter || purposeFilter ? "Try changing your search or filters." : status === "all" ? "Add your first property to start managing it here." : "When you have listings in this category, they’ll appear here."}</p>
                        {status === "all" && !search && <button type="button" className="agent-primary-button" onClick={() => setEditingProperty(null)}><Plus size={16} /> New listing</button>}
                      </div>
                    </td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="agent-listing-table-footer">
              <span className="agent-listing-page-summary">Showing {total ? (page - 1) * pageSize + 1 : 0} to {Math.min(page * pageSize, total)} of {total} results</span>
              <div className="agent-listing-footer-controls">
                <div className="agent-listing-page-size">
                  <span>Rows per page</span>
                  <CustomDropdown
                    className="agent-page-size-dropdown"
                    buttonClassName="agent-page-size-dropdown-trigger"
                    placeholder={String(pageSize)}
                    value={String(pageSize)}
                    options={[10, 20, 50].map((size) => ({ label: String(size), value: String(size) }))}
                    onChange={(value) => { setPageSize(Number(value)); setPage(1); }}
                  />
                </div>
                <div className="agent-pagination agent-listing-pagination">
                  <button type="button" aria-label="First page" disabled={page <= 1} onClick={() => setPage(1)}><ChevronFirst size={17} /></button>
                  <button type="button" aria-label="Previous page" disabled={page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))}><ChevronLeft size={17} /></button>
                  <span>Page {page} of {pageCount}</span>
                  <button type="button" aria-label="Next page" disabled={page >= pageCount} onClick={() => setPage((current) => Math.min(pageCount, current + 1))}><ChevronRight size={17} /></button>
                  <button type="button" aria-label="Last page" disabled={page >= pageCount} onClick={() => setPage(pageCount)}><ChevronLast size={17} /></button>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {editingProperty !== undefined && (
        <AgentListingEditor
          property={editingProperty}
          onClose={() => setEditingProperty(undefined)}
          onSaved={() => {
            setEditingProperty(undefined);
            refreshListings();
          }}
        />
      )}

      {detailLoading && (
        <div className="fixed inset-0 z-20 grid place-items-center bg-black/45 p-5 backdrop-blur-sm" role="status" aria-live="polite">
          <div className="flex min-w-[220px] items-center justify-center gap-3 rounded-2xl border border-border bg-(--surface) px-6 py-5 text-sm font-semibold text-(--text) shadow-2xl">
            <span className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-primary" aria-hidden="true" />
            Loading listing details…
          </div>
        </div>
      )}

      {selectedProperty && (
        <AgentPropertyOverview
          property={selectedProperty}
          typeName={propertyTypes.find((type) => type.id === selectedProperty.typeId)?.name ?? "Property"}
          initialAction={detailAction}
          onClose={() => setSelectedProperty(null)}
          onEdit={() => {
            const property = selectedProperty;
            setSelectedProperty(null);
            setEditingProperty(property);
          }}
          onViewWebsite={() => navigate(`/properties/${selectedProperty.slug}`)}
          onChanged={(updatedProperty) => {
            setSelectedProperty(updatedProperty);
            setProperties((current) => current.map((property) => property.id === updatedProperty.id ? updatedProperty : property));
            refreshListings();
          }}
        />
      )}

      {profileOpen && agent && (
        <AgentProfileModal
          agent={agent}
          onClose={() => setProfileOpen(false)}
          onSaved={setAgent}
        />
      )}
    </div>
  );
};


export default AgentListingsPage;
