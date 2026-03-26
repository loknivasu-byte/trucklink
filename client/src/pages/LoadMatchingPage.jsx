import { useState, useCallback, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAvailableLoads, acceptLoad } from '../services/loadService';
import Navbar from '../components/Navbar';
import './LoadMatchingPage.css';

// ── Constants ──────────────────────────────────────────────────────────────

const TRUCK_TYPES = ['Dry Van', 'Flatbed', 'Refrigerated', 'Tanker', 'Step Deck'];

const SORT_OPTIONS = [
  { value: 'newest',     label: 'Newest First' },
  { value: 'pay_high',   label: 'Pay: High → Low' },
  { value: 'pay_low',    label: 'Pay: Low → High' },
  { value: 'miles_asc',  label: 'Miles: Short → Long' },
  { value: 'miles_desc', label: 'Miles: Long → Short' },
];

const sortLoads = (loads, sortBy) => {
  const copy = [...loads];
  switch (sortBy) {
    case 'pay_high':   return copy.sort((a, b) => (b.totalPay ?? 0) - (a.totalPay ?? 0));
    case 'pay_low':    return copy.sort((a, b) => (a.totalPay ?? 0) - (b.totalPay ?? 0));
    case 'miles_asc':  return copy.sort((a, b) => (a.miles ?? 0) - (b.miles ?? 0));
    case 'miles_desc': return copy.sort((a, b) => (b.miles ?? 0) - (a.miles ?? 0));
    default:           return copy; // newest: already sorted by server (createdAt: -1)
  }
};

const fmtDate = (iso) =>
  iso
    ? new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : '—';

// ── Load card ──────────────────────────────────────────────────────────────

const LoadCard = ({ load, isDriver, onAccepted }) => {
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState('');

  const handleAccept = async () => {
    setAccepting(true);
    setError('');
    try {
      await acceptLoad(load._id);
      setAccepting(false);
      onAccepted(load._id);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to accept load. Please try again.');
      setAccepting(false);
    }
  };

  return (
    <div className="match-card">
      {/* Route + Pay */}
      <div className="match-card__header">
        <div className="match-card__route">
          <span className="match-card__city">{load.pickupCity}</span>
          <span className="match-card__arrow">→</span>
          <span className="match-card__city">{load.deliveryCity}</span>
        </div>
        <div className="match-card__pay">
          <span className="match-card__pay-amount">
            ${load.totalPay?.toLocaleString() ?? '—'}
          </span>
          <span className="match-card__pay-rate">
            ${load.ratePerMile ?? '—'}/mi
          </span>
        </div>
      </div>

      {/* Tags */}
      <div className="match-card__tags">
        <span className="match-tag match-tag--truck">{load.truckType ?? '—'}</span>
        <span className="match-tag">{load.miles?.toLocaleString() ?? '—'} mi</span>
        <span className="match-tag">{load.weight?.toLocaleString() ?? '—'} lbs</span>
        <span className="match-tag">{load.commodity ?? '—'}</span>
      </div>

      {/* Details */}
      <div className="match-card__detail-row">
        <div className="match-card__detail">
          <span className="match-card__detail-label">Pickup</span>
          <span className="match-card__detail-value">{fmtDate(load.pickupDate)}</span>
        </div>
        <div className="match-card__detail">
          <span className="match-card__detail-label">Est. Delivery</span>
          <span className="match-card__detail-value">{fmtDate(load.estimatedDeliveryDate)}</span>
        </div>
        <div className="match-card__detail">
          <span className="match-card__detail-label">Shipper</span>
          <span className="match-card__detail-value">
            {load.shipper?.companyName ?? load.shipper?.name ?? '—'}
            {load.shipper?.rating != null && (
              <span className="match-card__rating"> ⭐ {load.shipper.rating}</span>
            )}
          </span>
        </div>
      </div>

      {/* Special instructions */}
      {load.specialInstructions && (
        <div className="match-card__notes">
          <span className="match-card__notes-label">Notes:</span>{' '}
          {load.specialInstructions}
        </div>
      )}

      {/* Accept (driver only) */}
      {isDriver && (
        <div className="match-card__action">
          {error && <div className="match-card__error" role="alert">{error}</div>}
          <button
            type="button"
            className="btn-primary match-card__accept"
            onClick={handleAccept}
            disabled={accepting}
          >
            {accepting ? <span className="spinner" /> : 'Accept Load'}
          </button>
        </div>
      )}
    </div>
  );
};

// ── Main page ──────────────────────────────────────────────────────────────

const LoadMatchingPage = () => {
  const { user } = useAuth();
  const isDriver = user?.role === 'driver';

  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  // Filter inputs — NOT wired to auto-fetch; only fire on Search click or Enter
  const [pickupCity, setPickupCity] = useState('');
  const [deliveryCity, setDeliveryCity] = useState('');
  const [truckType, setTruckType] = useState('');

  // AbortController ref — cancels in-flight request when a new search fires
  const abortRef = useRef(null);

  const fetchLoads = useCallback(async (params = {}) => {
    // Cancel any in-flight request before starting a new one
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();
    const { signal } = abortRef.current;

    setLoading(true);
    setError('');
    try {
      const data = await getAvailableLoads(params, signal);
      setLoads(data);
    } catch (err) {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      setError(
        err.response?.data?.message || 'Failed to load available freight. Please try again.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLoads(); }, [fetchLoads]);

  const handleSearch = () => {
    const params = {};
    if (pickupCity.trim())   params.pickupCity   = pickupCity.trim();
    if (deliveryCity.trim()) params.deliveryCity = deliveryCity.trim();
    if (truckType)           params.truckType    = truckType;
    fetchLoads(params);
  };

  const handleReset = () => {
    setPickupCity('');
    setDeliveryCity('');
    setTruckType('');
    fetchLoads();
  };

  const handleAccepted = (loadId) => {
    setLoads((prev) => prev.filter((l) => l._id !== loadId));
  };

  const hasFilters = pickupCity || deliveryCity || truckType;
  const sortedLoads = sortLoads(loads, sortBy);

  return (
    <div className="load-matching">
      <Navbar />

      <main className="load-matching__main">

        {/* ── Hero ──────────────────────────────────────────── */}
        <section className="load-matching__hero">
          <div className="container load-matching__hero-inner">
            <div>
              <h1 className="load-matching__title">Available Loads</h1>
              <p className="load-matching__sub">Browse open freight across the US</p>
            </div>

            {/* AI Match banner — wired up in Step 7 */}
            {isDriver && (
              <div className="ai-banner">
                <span className="ai-banner__icon">🤖</span>
                <div className="ai-banner__text">
                  <div className="ai-banner__title">AI Load Matching</div>
                  <div className="ai-banner__sub">
                    Smart recommendations based on your route — coming in Step 7
                  </div>
                </div>
                <button type="button" className="ai-banner__btn" disabled>
                  Ask AI
                </button>
              </div>
            )}
          </div>
        </section>

        {/* ── Sticky filter bar ─────────────────────────────── */}
        <div className="load-matching__filters-wrap">
          <div className="container load-matching__filters">
            <input
              type="text"
              className="filter-input"
              placeholder="Pickup city…"
              aria-label="Filter by pickup city"
              value={pickupCity}
              onChange={(e) => setPickupCity(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
            />
            <input
              type="text"
              className="filter-input"
              placeholder="Delivery city…"
              aria-label="Filter by delivery city"
              value={deliveryCity}
              onChange={(e) => setDeliveryCity(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleSearch(); } }}
            />
            <select
              className="filter-select"
              aria-label="Filter by truck type"
              value={truckType}
              onChange={(e) => setTruckType(e.target.value)}
              disabled={loading}
            >
              <option value="">All Truck Types</option>
              {TRUCK_TYPES.map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <button
              type="button"
              className="btn-primary filter-search-btn"
              onClick={handleSearch}
              disabled={loading}
            >
              {loading ? <span className="spinner" /> : 'Search'}
            </button>
            {hasFilters && (
              <button
                type="button"
                className="btn-outline filter-reset-btn"
                onClick={handleReset}
                disabled={loading}
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* ── Results ───────────────────────────────────────── */}
        <section className="container load-matching__results">
          {!loading && !error && (
            <div className="results-header">
              <span className="results-count">
                {sortedLoads.length}{' '}
                {sortedLoads.length === 1 ? 'load' : 'loads'} available
              </span>
              <select
                className="sort-select"
                aria-label="Sort loads"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                {SORT_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
          )}

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Searching available loads…</p>
            </div>
          ) : error ? (
            <div className="error-state" role="alert">
              <span className="error-state__icon">⚠️</span>
              <p>{error}</p>
              <button type="button" className="btn-outline" onClick={() => fetchLoads()}>
                Try Again
              </button>
            </div>
          ) : sortedLoads.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state__icon">🔍</span>
              <p>No loads match your search.</p>
              {hasFilters && (
                <button type="button" className="btn-outline" onClick={handleReset}>
                  Clear Filters
                </button>
              )}
            </div>
          ) : (
            <div className="match-grid">
              {sortedLoads.map((load) => (
                <LoadCard
                  key={load._id}
                  load={load}
                  isDriver={isDriver}
                  onAccepted={handleAccepted}
                />
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default LoadMatchingPage;
