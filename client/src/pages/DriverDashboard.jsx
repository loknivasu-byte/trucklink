import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  getDriverLoads,
  getAvailableLoads,
  acceptLoad,
  updateLoadStatus,
} from '../services/loadService';
import { getPaymentStatus, getMyPayments } from '../services/paymentService';
import { submitRating, getMyRatings } from '../services/ratingService';
import Navbar from '../components/Navbar';
import './DriverDashboard.css';

// ── Status helpers ─────────────────────────────────────────────────────────

const STATUS_LABEL = {
  available: 'Available',
  accepted: 'Accepted',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const NEXT_STATUS = {
  accepted: 'in_transit',
  in_transit: 'delivered',
};

const NEXT_LABEL = {
  accepted: 'Start Trip',
  in_transit: 'Confirm Delivery',
};

const TRUCK_TYPES = ['Dry Van', 'Flatbed', 'Refrigerated', 'Tanker', 'Step Deck'];

// ── Sub-components ─────────────────────────────────────────────────────────

const StatCard = ({ label, value }) => (
  <div className="stat-card">
    <div className="stat-card__value">{value}</div>
    <div className="stat-card__label">{label}</div>
  </div>
);

const StatusBadge = ({ status }) => (
  <span className={`status-badge status-badge--${status}`}>
    {STATUS_LABEL[status] ?? status}
  </span>
);

const LoadMeta = ({ icon, text }) => (
  <div className="load-meta">
    <span className="load-meta__icon">{icon}</span>
    <span>{text}</span>
  </div>
);

// ── Payment timer for delivered loads ─────────────────────────────────────

const EscrowTimer = ({ loadId }) => {
  const [info, setInfo] = useState(null);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    getPaymentStatus(loadId)
      .then((data) => { if (isMounted) { setInfo(data); setLoading(false); } })
      .catch(() => { if (isMounted) { setError(true); setLoading(false); } });
    return () => { isMounted = false; };
  }, [loadId]);

  if (loading) {
    return (
      <div className="escrow-info escrow-info--loading">
        <span className="escrow-spinner" /> Checking payment…
      </div>
    );
  }

  if (error) {
    return (
      <div className="escrow-info escrow-info--error">
        Unable to load payment status
      </div>
    );
  }

  if (info?.status === 'released') {
    return (
      <div className="escrow-info escrow-info--released">
        <span>✓</span> Payment released
      </div>
    );
  }

  return (
    <div className="escrow-info escrow-info--pending">
      <span>🔒</span>
      {info?.minutesUntilRelease != null
        ? `Escrow releases in ${info.minutesUntilRelease} min`
        : 'Payment in escrow'}
    </div>
  );
};

// ── Active load card ───────────────────────────────────────────────────────

const ActiveLoadCard = ({ load, onStatusUpdate }) => {
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState('');

  const handleStatusUpdate = async () => {
    const next = NEXT_STATUS[load.status];
    if (!next) return;
    setUpdating(true);
    setError('');
    try {
      await updateLoadStatus(load._id, next);
      onStatusUpdate();
    } catch (err) {
      setError(err.response?.data?.message || 'Update failed. Please try again.');
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="load-card load-card--active">
      <div className="load-card__header">
        <div className="load-card__route">
          <span className="load-card__city">{load.pickupCity}</span>
          <span className="load-card__arrow">→</span>
          <span className="load-card__city">{load.deliveryCity}</span>
        </div>
        <StatusBadge status={load.status} />
      </div>

      <div className="load-card__meta">
        <LoadMeta icon="🚛" text={load.truckType ?? '—'} />
        <LoadMeta icon="📦" text={load.commodity ?? '—'} />
        <LoadMeta icon="📍" text={`${load.miles?.toLocaleString() ?? '—'} mi`} />
        <LoadMeta icon="⚖️" text={`${load.weight?.toLocaleString() ?? '—'} lbs`} />
      </div>

      <div className="load-card__pay">
        <span className="load-card__pay-amount">
          ${load.totalPay?.toLocaleString() ?? '—'}
        </span>
        <span className="load-card__pay-rate">
          ${load.ratePerMile ?? '—'}/mi
        </span>
      </div>

      {load.shipper && (
        <div className="load-card__shipper">
          Shipper: <strong>{load.shipper.companyName || load.shipper.name}</strong>
          {load.shipper.rating && (
            <span className="load-card__rating"> ⭐ {load.shipper.rating}</span>
          )}
        </div>
      )}

      {error && <div className="load-card__error">{error}</div>}

      {load.status === 'delivered' ? (
        <EscrowTimer loadId={load._id} />
      ) : (
        NEXT_STATUS[load.status] && (
          <button
            className="btn-primary load-card__action"
            onClick={handleStatusUpdate}
            disabled={updating}
          >
            {updating ? <span className="spinner" /> : NEXT_LABEL[load.status]}
          </button>
        )
      )}
    </div>
  );
};

// ── Available load card ────────────────────────────────────────────────────

const AvailableLoadCard = ({ load, onAccept, accepting }) => (
  <div className="load-card load-card--available">
    <div className="load-card__header">
      <div className="load-card__route">
        <span className="load-card__city">{load.pickupCity}</span>
        <span className="load-card__arrow">→</span>
        <span className="load-card__city">{load.deliveryCity}</span>
      </div>
      <span className="load-card__pay-amount">
        ${load.totalPay?.toLocaleString() ?? '—'}
      </span>
    </div>

    <div className="load-card__meta">
      <LoadMeta icon="🚛" text={load.truckType ?? '—'} />
      <LoadMeta icon="📦" text={load.commodity ?? '—'} />
      <LoadMeta icon="📍" text={`${load.miles?.toLocaleString() ?? '—'} mi`} />
      <LoadMeta icon="⚖️" text={`${load.weight?.toLocaleString() ?? '—'} lbs`} />
    </div>

    <div className="load-card__rate-row">
      <span className="load-card__rate-label">Rate per mile</span>
      <span className="load-card__rate-value">${load.ratePerMile ?? '—'}</span>
    </div>

    {load.shipper && (
      <div className="load-card__shipper">
        {load.shipper.companyName || load.shipper.name}
        {load.shipper.rating && (
          <span className="load-card__rating"> ⭐ {load.shipper.rating}</span>
        )}
      </div>
    )}

    <button
      className="btn-primary load-card__action"
      onClick={() => onAccept(load._id)}
      disabled={accepting === load._id}
    >
      {accepting === load._id ? <span className="spinner" /> : 'Accept Load'}
    </button>
  </div>
);

// ── Rating widget ──────────────────────────────────────────────────────────

const RatingWidget = ({ loadId, rateeLabel, myRatings, onRated }) => {
  const [score, setScore] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  // Reset widget state whenever the load changes
  useEffect(() => {
    setScore(0);
    setHovered(0);
    setComment('');
    setSubmitting(false);
    setSubmitted(false);
    setError('');
  }, [loadId]);

  const alreadyRated = myRatings.find(
    (r) => r.load?._id === loadId || r.load?._id?.toString() === loadId
  );

  if (alreadyRated || submitted) {
    const displayScore = alreadyRated?.score ?? score;
    return (
      <div className="rating-widget rating-widget--done">
        <span className="rating-widget__stars-display" aria-label={`Rated ${displayScore} out of 5`}>
          {'★'.repeat(displayScore)}{'☆'.repeat(5 - displayScore)}
        </span>
        <span className="rating-widget__done-label">You rated {rateeLabel}</span>
      </div>
    );
  }

  const handleSubmit = async () => {
    if (!score || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await submitRating({ loadId, score, comment });
      setSubmitted(true);
      if (onRated) onRated(score);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="rating-widget">
      <div className="rating-widget__prompt">Rate {rateeLabel}</div>
      <div className="rating-widget__stars" role="group" aria-label={`Rate ${rateeLabel}`}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            className={`rating-star ${n <= (hovered || score) ? 'rating-star--active' : ''}`}
            onMouseEnter={() => setHovered(n)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setScore(n)}
            aria-label={`${n} star${n !== 1 ? 's' : ''}`}
            aria-pressed={score === n}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        className="rating-widget__comment"
        aria-label="Optional comment for your rating"
        placeholder="Optional comment… (max 500 chars)"
        rows={2}
        maxLength={500}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
      />
      {error && <div className="rating-widget__error">{error}</div>}
      <button
        type="button"
        className="btn-primary rating-widget__submit"
        onClick={handleSubmit}
        disabled={!score || submitting}
      >
        {submitting ? <span className="spinner" /> : 'Submit Rating'}
      </button>
    </div>
  );
};

// ── Earnings payment row ───────────────────────────────────────────────────

const PAYMENT_STATUS_LABEL = {
  pending: 'Pending',
  in_escrow: 'In Escrow',
  released: 'Released',
  refunded: 'Refunded',
};

const EarningRow = ({ payment, myRatings, ratingsLoaded }) => {
  const load = payment.load;
  const isReleased = payment.status === 'released';
  const isEscrow = payment.status === 'in_escrow';
  const shipperLabel = payment.shipper?.companyName || payment.shipper?.name || 'your shipper';

  return (
    <div className={`earning-row earning-row--${payment.status}`}>
      <div className="earning-row__route">
        {load ? (
          <>
            <span className="earning-row__city">{load.pickupCity}</span>
            <span className="earning-row__arrow">→</span>
            <span className="earning-row__city">{load.deliveryCity}</span>
          </>
        ) : (
          <span className="earning-row__no-load">Load removed</span>
        )}
      </div>

      <div className="earning-row__details">
        {load && (
          <span className="earning-row__meta">{load.miles?.toLocaleString() ?? '—'} mi</span>
        )}
        <span className={`earning-status earning-status--${payment.status}`}>
          {PAYMENT_STATUS_LABEL[payment.status] ?? payment.status}
        </span>
      </div>

      <div className="earning-row__right">
        <span className={`earning-amount ${isReleased ? 'earning-amount--released' : ''}`}>
          ${payment.amount?.toLocaleString() ?? '—'}
        </span>
        <span className="earning-row__date">
          {isReleased && payment.releasedAt
            ? `Released ${new Date(payment.releasedAt).toLocaleDateString()}`
            : isEscrow && payment.scheduledReleaseAt
            ? `Auto-releases ${new Date(payment.scheduledReleaseAt).toLocaleString()}`
            : payment.createdAt
            ? new Date(payment.createdAt).toLocaleDateString()
            : ''}
        </span>
      </div>

      {isReleased && load?._id && ratingsLoaded && (
        <RatingWidget
          loadId={load._id}
          rateeLabel={shipperLabel}
          myRatings={myRatings}
        />
      )}
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────

const DriverDashboard = () => {
  const { user } = useAuth();

  const [activeLoads, setActiveLoads] = useState([]);
  const [availableLoads, setAvailableLoads] = useState([]);
  const [loadingActive, setLoadingActive] = useState(true);
  const [loadingAvailable, setLoadingAvailable] = useState(true);
  const [activeError, setActiveError] = useState('');
  const [availableError, setAvailableError] = useState('');
  const [acceptError, setAcceptError] = useState('');
  const [accepting, setAccepting] = useState(null);
  const [filters, setFilters] = useState({ pickupCity: '', deliveryCity: '', truckType: '' });
  const [activeTab, setActiveTab] = useState('available');

  const [earnings, setEarnings] = useState([]);
  const [loadingEarnings, setLoadingEarnings] = useState(true);
  const [earningsError, setEarningsError] = useState('');

  const [myRatings, setMyRatings] = useState([]);
  const [ratingsLoaded, setRatingsLoaded] = useState(false);

  // Accepts params directly — no filter dependency, no auto-refetch on typing
  const fetchAvailableLoads = useCallback(async (params = {}) => {
    setLoadingAvailable(true);
    setAvailableError('');
    try {
      const data = await getAvailableLoads(params);
      setAvailableLoads(data);
    } catch (err) {
      setAvailableError(
        err.response?.data?.message || 'Failed to load available loads. Please try again.'
      );
      setAvailableLoads([]);
    } finally {
      setLoadingAvailable(false);
    }
  }, []);

  const fetchActiveLoads = useCallback(async () => {
    setLoadingActive(true);
    setActiveError('');
    try {
      const data = await getDriverLoads();
      setActiveLoads(data);
    } catch (err) {
      setActiveError(
        err.response?.data?.message || 'Failed to load your loads. Please try again.'
      );
    } finally {
      setLoadingActive(false);
    }
  }, []);

  const fetchEarnings = useCallback(async () => {
    setLoadingEarnings(true);
    setEarningsError('');
    try {
      const data = await getMyPayments();
      setEarnings(data);
    } catch (err) {
      setEarningsError(
        err.response?.data?.message || 'Failed to load earnings. Please try again.'
      );
    } finally {
      setLoadingEarnings(false);
    }
  }, []);

  // Fetch once on mount only
  useEffect(() => { fetchActiveLoads(); }, [fetchActiveLoads]);
  useEffect(() => { fetchAvailableLoads(); }, [fetchAvailableLoads]);
  useEffect(() => { fetchEarnings(); }, [fetchEarnings]);
  // Fetch submitted ratings silently — failure is non-blocking
  useEffect(() => {
    getMyRatings()
      .then((data) => { setMyRatings(data); setRatingsLoaded(true); })
      .catch(() => { setRatingsLoaded(true); });
  }, []);

  const handleAccept = async (loadId) => {
    setAccepting(loadId);
    setAcceptError('');
    try {
      await acceptLoad(loadId);
      // Optimistically remove from available list
      setAvailableLoads((prev) => prev.filter((l) => l._id !== loadId));
      // Refresh active loads — if this fails, accept still succeeded
      try {
        await fetchActiveLoads();
      } catch {
        // Accept worked; stale My Loads list is acceptable
      }
      setActiveTab('active');
    } catch (err) {
      setAcceptError(
        err.response?.data?.message || 'Could not accept load. It may have already been taken.'
      );
    } finally {
      setAccepting(null);
    }
  };

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    const params = {};
    if (filters.pickupCity.trim()) params.pickupCity = filters.pickupCity.trim();
    if (filters.deliveryCity.trim()) params.deliveryCity = filters.deliveryCity.trim();
    if (filters.truckType) params.truckType = filters.truckType;
    fetchAvailableLoads(params);
  };

  const inProgressLoads = activeLoads.filter((l) => l.status !== 'delivered');
  const deliveredLoads = activeLoads.filter((l) => l.status === 'delivered');

  const totalEarned = earnings
    .filter((p) => p.status === 'released')
    .reduce((s, p) => s + (p.amount ?? 0), 0);
  const inEscrowTotal = earnings
    .filter((p) => p.status === 'in_escrow')
    .reduce((s, p) => s + (p.amount ?? 0), 0);
  const inEscrowCount = earnings.filter((p) => p.status === 'in_escrow').length;

  return (
    <div className="driver-dashboard">
      <Navbar />

      <main className="driver-main">
        {/* ── Welcome + Stats ─────────────────────────────────── */}
        <section className="driver-hero">
          <div className="container driver-hero__inner">
            <div className="driver-hero__text">
              <h1>Welcome back, {user?.name?.split(' ')[0] ?? 'Driver'}</h1>
              <p>Find loads, haul freight, get paid fast.</p>
            </div>
            <div className="driver-stats">
              <StatCard label="Trust Score" value={`${user?.trustScore ?? '—'} ⭐`} />
              <StatCard label="Deliveries" value={user?.totalDeliveries?.toLocaleString() ?? '0'} />
              <StatCard label="Total Earned" value={`$${user?.totalEarnings?.toLocaleString() ?? '0'}`} />
            </div>
          </div>
        </section>

        {/* ── Tab bar ─────────────────────────────────────────── */}
        <div className="container">
          <div className="dashboard-tabs">
            <button
              className={`dashboard-tab ${activeTab === 'available' ? 'dashboard-tab--active' : ''}`}
              onClick={() => setActiveTab('available')}
            >
              Find Loads
              {availableLoads.length > 0 && (
                <span className="tab-badge">{availableLoads.length}</span>
              )}
            </button>
            <button
              className={`dashboard-tab ${activeTab === 'active' ? 'dashboard-tab--active' : ''}`}
              onClick={() => setActiveTab('active')}
            >
              My Loads
              {inProgressLoads.length > 0 && (
                <span className="tab-badge tab-badge--orange">{inProgressLoads.length}</span>
              )}
            </button>
            <button
              className={`dashboard-tab ${activeTab === 'earnings' ? 'dashboard-tab--active' : ''}`}
              onClick={() => setActiveTab('earnings')}
            >
              Earnings
              {inEscrowCount > 0 && (
                <span className="tab-badge tab-badge--orange">{inEscrowCount}</span>
              )}
            </button>
          </div>
        </div>

        {/* ── Find Loads tab ───────────────────────────────────── */}
        {activeTab === 'available' && (
          <section className="container dashboard-section">
            <form className="load-filters" onSubmit={handleFilterSubmit}>
              <input
                name="pickupCity"
                type="text"
                placeholder="Pickup city"
                aria-label="Filter by pickup city"
                value={filters.pickupCity}
                onChange={handleFilterChange}
              />
              <input
                name="deliveryCity"
                type="text"
                placeholder="Delivery city"
                aria-label="Filter by delivery city"
                value={filters.deliveryCity}
                onChange={handleFilterChange}
              />
              <select
                name="truckType"
                aria-label="Filter by truck type"
                value={filters.truckType}
                onChange={handleFilterChange}
              >
                <option value="">All truck types</option>
                {TRUCK_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>
              <button
                type="submit"
                className="btn-primary"
                disabled={loadingAvailable}
              >
                {loadingAvailable ? <span className="spinner" /> : 'Search'}
              </button>
            </form>

            {acceptError && (
              <div className="section-error" role="alert">{acceptError}</div>
            )}

            {loadingAvailable ? (
              <div className="loading-state">
                <div className="loading-spinner" />
                <p>Loading available loads…</p>
              </div>
            ) : availableError ? (
              <div className="error-state" role="alert">
                <span className="error-state__icon">⚠️</span>
                <p>{availableError}</p>
                <button className="btn-outline" onClick={() => fetchAvailableLoads()}>
                  Try Again
                </button>
              </div>
            ) : availableLoads.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state__icon">📭</span>
                <p>No loads match your filters. Try adjusting your search.</p>
              </div>
            ) : (
              <div className="loads-grid">
                {availableLoads.map((load) => (
                  <AvailableLoadCard
                    key={load._id}
                    load={load}
                    onAccept={handleAccept}
                    accepting={accepting}
                  />
                ))}
              </div>
            )}
          </section>
        )}

        {/* ── My Loads tab ─────────────────────────────────────── */}
        {activeTab === 'active' && (
          <section className="container dashboard-section">
            {loadingActive ? (
              <div className="loading-state">
                <div className="loading-spinner" />
                <p>Loading your loads…</p>
              </div>
            ) : activeError ? (
              <div className="error-state" role="alert">
                <span className="error-state__icon">⚠️</span>
                <p>{activeError}</p>
                <button className="btn-outline" onClick={fetchActiveLoads}>
                  Try Again
                </button>
              </div>
            ) : activeLoads.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state__icon">🚛</span>
                <p>No loads yet. Head to <strong>Find Loads</strong> to accept your first haul.</p>
              </div>
            ) : (
              <>
                {inProgressLoads.length > 0 && (
                  <>
                    <h2 className="section-heading">Active Hauls</h2>
                    <div className="loads-grid">
                      {inProgressLoads.map((load) => (
                        <ActiveLoadCard
                          key={load._id}
                          load={load}
                          onStatusUpdate={fetchActiveLoads}
                        />
                      ))}
                    </div>
                  </>
                )}

                {deliveredLoads.length > 0 && (
                  <>
                    <h2 className="section-heading section-heading--delivered">Delivered</h2>
                    <div className="loads-grid">
                      {deliveredLoads.map((load) => (
                        <ActiveLoadCard
                          key={load._id}
                          load={load}
                          onStatusUpdate={fetchActiveLoads}
                        />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        )}
        {/* ── Earnings tab ─────────────────────────────────────── */}
        {activeTab === 'earnings' && (
          <section className="container dashboard-section">
            {/* Summary row */}
            <div className="earnings-summary">
              <div className="earnings-summary__item">
                <span className="earnings-summary__label">Total Earned</span>
                <span className="earnings-summary__value earnings-summary__value--green">
                  ${totalEarned.toLocaleString()}
                </span>
              </div>
              <div className="earnings-summary__divider" />
              <div className="earnings-summary__item">
                <span className="earnings-summary__label">In Escrow</span>
                <span className="earnings-summary__value earnings-summary__value--escrow">
                  ${inEscrowTotal.toLocaleString()}
                </span>
              </div>
              <div className="earnings-summary__divider" />
              <div className="earnings-summary__item">
                <span className="earnings-summary__label">Payments</span>
                <span className="earnings-summary__value">{earnings.length}</span>
              </div>
            </div>

            {loadingEarnings ? (
              <div className="loading-state">
                <div className="loading-spinner" />
                <p>Loading earnings…</p>
              </div>
            ) : earningsError ? (
              <div className="error-state" role="alert">
                <span className="error-state__icon">⚠️</span>
                <p>{earningsError}</p>
                <button className="btn-outline" onClick={fetchEarnings}>Try Again</button>
              </div>
            ) : earnings.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state__icon">💰</span>
                <p>No payments yet. Accept and complete a load to start earning.</p>
              </div>
            ) : (
              <div className="earnings-list">
                {earnings.map((payment) => (
                  <EarningRow key={payment._id} payment={payment} myRatings={myRatings} ratingsLoaded={ratingsLoaded} />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default DriverDashboard;
