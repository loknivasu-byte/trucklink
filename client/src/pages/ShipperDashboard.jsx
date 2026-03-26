import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { getMyLoads, postLoad } from '../services/loadService';
import { releasePayment } from '../services/paymentService';
import Navbar from '../components/Navbar';
import './ShipperDashboard.css';

// ── Constants ──────────────────────────────────────────────────────────────

const TRUCK_TYPES = ['Dry Van', 'Flatbed', 'Refrigerated', 'Tanker', 'Step Deck'];

const STATUS_LABEL = {
  available: 'Open',
  accepted: 'Accepted',
  in_transit: 'In Transit',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

const EMPTY_FORM = {
  pickupCity: '',
  deliveryCity: '',
  pickupAddress: '',
  deliveryAddress: '',
  pickupDate: '',
  miles: '',
  ratePerMile: '',
  weight: '',
  truckType: '',
  commodity: '',
  specialInstructions: '',
};

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

// ── Payment release button with confirmation ───────────────────────────────

const ReleasePaymentButton = ({ load, onReleased }) => {
  const [releasing, setReleasing] = useState(false);
  const [released, setReleased] = useState(false);
  const [error, setError] = useState('');
  const [confirming, setConfirming] = useState(false);
  const hasReleased = useRef(false);

  const handleRelease = async () => {
    if (!confirming) { setConfirming(true); return; }
    if (hasReleased.current) return;
    hasReleased.current = true;
    setReleasing(true);
    setError('');
    try {
      await releasePayment(load._id);
      setReleased(true);
      onReleased();
    } catch (err) {
      hasReleased.current = false;
      setError(err.response?.data?.message || 'Failed to release payment.');
      // Keep confirming=true so error is visible inside the confirm dialog
    } finally {
      setReleasing(false);
    }
  };

  if (released) {
    return (
      <div className="payment-released">
        <span>✓</span> Payment of ${load.totalPay?.toLocaleString() ?? '—'} released
      </div>
    );
  }

  return (
    <div className="release-payment">
      {error && <div className="release-error">{error}</div>}
      {confirming ? (
        <div
          className="release-confirm"
          role="alertdialog"
          aria-label="Confirm payment release"
        >
          <span>Release ${load.totalPay?.toLocaleString() ?? '—'} to driver?</span>
          <div className="release-confirm__actions">
            <button
              type="button"
              className="btn-primary release-confirm__yes"
              onClick={handleRelease}
              disabled={releasing}
            >
              {releasing ? <span className="spinner" /> : 'Yes, Release'}
            </button>
            <button
              type="button"
              className="btn-outline release-confirm__no"
              onClick={() => setConfirming(false)}
              disabled={releasing}
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <button type="button" className="btn-primary release-btn" onClick={handleRelease}>
          Release Payment
        </button>
      )}
    </div>
  );
};

// ── Load card ──────────────────────────────────────────────────────────────

const ShipperLoadCard = ({ load, onReleased }) => (
  <div className={`shipper-load-card shipper-load-card--${load.status}`}>
    <div className="shipper-load-card__header">
      <div className="load-route">
        <span className="load-city">{load.pickupCity}</span>
        <span className="load-arrow">→</span>
        <span className="load-city">{load.deliveryCity}</span>
      </div>
      <StatusBadge status={load.status} />
    </div>

    <div className="shipper-load-card__meta">
      <div className="meta-item">
        <span className="meta-label">Truck</span>
        <span className="meta-value">{load.truckType ?? '—'}</span>
      </div>
      <div className="meta-item">
        <span className="meta-label">Commodity</span>
        <span className="meta-value">{load.commodity ?? '—'}</span>
      </div>
      <div className="meta-item">
        <span className="meta-label">Miles</span>
        <span className="meta-value">{load.miles?.toLocaleString() ?? '—'}</span>
      </div>
      <div className="meta-item">
        <span className="meta-label">Weight</span>
        <span className="meta-value">{load.weight?.toLocaleString() ?? '—'} lbs</span>
      </div>
    </div>

    <div className="shipper-load-card__pay">
      <span className="pay-amount">${load.totalPay?.toLocaleString() ?? '—'}</span>
      <span className="pay-rate">${load.ratePerMile ?? '—'}/mi</span>
    </div>

    {load.driver ? (
      <div className="shipper-load-card__driver">
        <span className="driver-label">Driver</span>
        <span className="driver-name">{load.driver.name}</span>
        {load.driver.trustScore && (
          <span className="driver-score">⭐ {load.driver.trustScore}</span>
        )}
        {load.driver.totalDeliveries != null && (
          <span className="driver-deliveries">{load.driver.totalDeliveries} deliveries</span>
        )}
      </div>
    ) : (
      <div className="shipper-load-card__no-driver">Awaiting driver</div>
    )}

    {load.status === 'delivered' && (
      <ReleasePaymentButton load={load} onReleased={onReleased} />
    )}
  </div>
);

// ── Post Load Form ─────────────────────────────────────────────────────────

const PostLoadForm = ({ onPosted, onCancel }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const milesVal = parseFloat(form.miles);
  const rateVal = parseFloat(form.ratePerMile);
  const totalPay =
    !isNaN(milesVal) && !isNaN(rateVal) && milesVal > 0 && rateVal > 0
      ? (milesVal * rateVal).toFixed(2)
      : null;

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const validate = () => {
    if (!form.pickupCity.trim())  return 'Pickup city is required.';
    if (!form.deliveryCity.trim()) return 'Delivery city is required.';
    if (!form.pickupDate)         return 'Pickup date is required.';
    if (!form.miles || parseFloat(form.miles) <= 0) return 'Miles must be a positive number.';
    if (!form.ratePerMile || parseFloat(form.ratePerMile) <= 0) return 'Rate per mile must be positive.';
    if (!form.weight || parseFloat(form.weight) <= 0) return 'Weight must be a positive number.';
    if (!form.truckType)          return 'Truck type is required.';
    if (!form.commodity.trim())   return 'Commodity is required.';
    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const validationError = validate();
    if (validationError) { setError(validationError); return; }

    setSubmitting(true);
    setError('');
    try {
      await postLoad({
        ...form,
        miles: parseFloat(form.miles),
        ratePerMile: parseFloat(form.ratePerMile),
        weight: parseFloat(form.weight),
      });
      onPosted();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to post load. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="post-load-form-wrap">
      <div className="post-load-form-header">
        <h2>Post a New Load</h2>
        <button
          type="button"
          className="post-load-close"
          onClick={onCancel}
          aria-label="Close form"
        >
          ✕
        </button>
      </div>

      <form className="post-load-form" onSubmit={handleSubmit} noValidate>
        {/* Route */}
        <div className="form-section-label">Route</div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="pickupCity">Pickup City *</label>
            <input id="pickupCity" name="pickupCity" type="text"
              placeholder="e.g. Chicago, IL" value={form.pickupCity} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="deliveryCity">Delivery City *</label>
            <input id="deliveryCity" name="deliveryCity" type="text"
              placeholder="e.g. Dallas, TX" value={form.deliveryCity} onChange={handleChange} />
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="pickupAddress">Pickup Address <span className="optional">(optional)</span></label>
            <input id="pickupAddress" name="pickupAddress" type="text"
              placeholder="Full street address" value={form.pickupAddress} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="deliveryAddress">Delivery Address <span className="optional">(optional)</span></label>
            <input id="deliveryAddress" name="deliveryAddress" type="text"
              placeholder="Full street address" value={form.deliveryAddress} onChange={handleChange} />
          </div>
        </div>

        {/* Logistics */}
        <div className="form-section-label">Logistics</div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="pickupDate">Pickup Date *</label>
            <input id="pickupDate" name="pickupDate" type="date"
              min={new Date().toISOString().split('T')[0]}
              value={form.pickupDate} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="truckType">Truck Type *</label>
            <select id="truckType" name="truckType" value={form.truckType} onChange={handleChange}>
              <option value="">Select type</option>
              {TRUCK_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
        </div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="commodity">Commodity *</label>
            <input id="commodity" name="commodity" type="text"
              placeholder="e.g. Steel Coils" value={form.commodity} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="weight">Weight (lbs) *</label>
            <input id="weight" name="weight" type="number"
              placeholder="e.g. 40000" min="1" value={form.weight} onChange={handleChange} />
          </div>
        </div>

        {/* Pay */}
        <div className="form-section-label">Pricing</div>
        <div className="form-row">
          <div className="form-group">
            <label htmlFor="miles">Miles *</label>
            <input id="miles" name="miles" type="number"
              placeholder="e.g. 921" min="1" value={form.miles} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label htmlFor="ratePerMile">Rate per Mile ($) *</label>
            <input id="ratePerMile" name="ratePerMile" type="number"
              placeholder="e.g. 3.20" min="0.01" step="0.01" value={form.ratePerMile} onChange={handleChange} />
          </div>
        </div>

        {totalPay && (
          <div className="total-pay-preview">
            <span>Estimated Total Pay</span>
            <span className="total-pay-preview__amount">${parseFloat(totalPay).toLocaleString()}</span>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="specialInstructions">Special Instructions <span className="optional">(optional)</span></label>
          <textarea id="specialInstructions" name="specialInstructions" rows={3}
            placeholder="Any special handling requirements…"
            value={form.specialInstructions} onChange={handleChange} />
        </div>

        {error && (
          <div className="form-error" role="alert">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
          </div>
        )}

        <div className="post-load-actions">
          <button type="submit" className="btn-primary post-load-submit" disabled={submitting}>
            {submitting ? <span className="spinner" /> : 'Post Load & Lock in Escrow'}
          </button>
          <button type="button" className="btn-outline" onClick={onCancel} disabled={submitting}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

// ── Main component ─────────────────────────────────────────────────────────

const ShipperDashboard = () => {
  const { user } = useAuth();

  const [loads, setLoads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('loads'); // 'loads' | 'post'

  const fetchLoads = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyLoads();
      setLoads(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load your shipments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchLoads(); }, [fetchLoads]);

  const handlePosted = () => {
    setActiveTab('loads');
    fetchLoads();
  };

  // Derived stats — exclude cancelled from total count
  const totalLoads = loads.filter((l) => l.status !== 'cancelled').length;
  const activeLoads = loads.filter((l) => ['accepted', 'in_transit'].includes(l.status)).length;
  const totalSpent = loads
    .filter((l) => l.status === 'delivered')
    .reduce((sum, l) => sum + (l.totalPay ?? 0), 0);

  const openLoads       = loads.filter((l) => l.status === 'available');
  const inProgressLoads = loads.filter((l) => ['accepted', 'in_transit'].includes(l.status));
  const completedLoads  = loads.filter((l) => l.status === 'delivered');
  const cancelledLoads  = loads.filter((l) => l.status === 'cancelled');

  return (
    <div className="shipper-dashboard">
      <Navbar />

      <main className="shipper-main">
        {/* ── Hero + Stats ──────────────────────────────────── */}
        <section className="shipper-hero">
          <div className="container shipper-hero__inner">
            <div className="shipper-hero__text">
              <h1>{user?.companyName ?? user?.name ?? 'Shipper'}</h1>
              <p>Manage your freight, track drivers, release payments.</p>
            </div>
            <div className="shipper-stats">
              <StatCard label="Total Loads" value={totalLoads} />
              <StatCard label="Active Now" value={activeLoads} />
              <StatCard label="Paid Out" value={`$${totalSpent.toLocaleString()}`} />
              <StatCard label="Rating" value={`${user?.rating ?? '—'} ⭐`} />
            </div>
          </div>
        </section>

        {/* ── Tab bar ──────────────────────────────────────── */}
        <div className="container">
          <div className="dashboard-tabs">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'loads'}
              className={`dashboard-tab ${activeTab === 'loads' ? 'dashboard-tab--active' : ''}`}
              onClick={() => setActiveTab('loads')}
            >
              My Shipments
              {loads.length > 0 && <span className="tab-badge">{loads.length}</span>}
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'post'}
              className={`dashboard-tab ${activeTab === 'post' ? 'dashboard-tab--active' : ''}`}
              onClick={() => setActiveTab('post')}
            >
              + Post a Load
            </button>
          </div>
        </div>

        {/* ── Post Load tab ─────────────────────────────────── */}
        {activeTab === 'post' && (
          <section className="container dashboard-section">
            <PostLoadForm
              onPosted={handlePosted}
              onCancel={() => setActiveTab('loads')}
            />
          </section>
        )}

        {/* ── My Shipments tab ──────────────────────────────── */}
        {activeTab === 'loads' && (
          <section className="container dashboard-section">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner" />
                <p>Loading your shipments…</p>
              </div>
            ) : error ? (
              <div className="error-state" role="alert">
                <span className="error-state__icon">⚠️</span>
                <p>{error}</p>
                <button type="button" className="btn-outline" onClick={fetchLoads}>Try Again</button>
              </div>
            ) : loads.length === 0 ? (
              <div className="empty-state">
                <span className="empty-state__icon">📦</span>
                <p>No loads posted yet.</p>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={() => setActiveTab('post')}
                >
                  Post Your First Load
                </button>
              </div>
            ) : (
              <>
                {inProgressLoads.length > 0 && (
                  <>
                    <h2 className="section-heading">In Progress</h2>
                    <div className="loads-grid">
                      {inProgressLoads.map((load) => (
                        <ShipperLoadCard key={load._id} load={load} onReleased={fetchLoads} />
                      ))}
                    </div>
                  </>
                )}

                {openLoads.length > 0 && (
                  <>
                    <h2 className="section-heading">Open — Awaiting Driver</h2>
                    <div className="loads-grid">
                      {openLoads.map((load) => (
                        <ShipperLoadCard key={load._id} load={load} onReleased={fetchLoads} />
                      ))}
                    </div>
                  </>
                )}

                {completedLoads.length > 0 && (
                  <>
                    <h2 className="section-heading section-heading--completed">Delivered</h2>
                    <div className="loads-grid">
                      {completedLoads.map((load) => (
                        <ShipperLoadCard key={load._id} load={load} onReleased={fetchLoads} />
                      ))}
                    </div>
                  </>
                )}

                {cancelledLoads.length > 0 && (
                  <>
                    <h2 className="section-heading section-heading--completed">Cancelled</h2>
                    <div className="loads-grid">
                      {cancelledLoads.map((load) => (
                        <ShipperLoadCard key={load._id} load={load} onReleased={fetchLoads} />
                      ))}
                    </div>
                  </>
                )}
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default ShipperDashboard;
