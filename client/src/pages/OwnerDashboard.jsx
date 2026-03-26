import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { getAllPayments } from '../services/paymentService';
import Navbar from '../components/Navbar';
import './OwnerDashboard.css';

// ── Constants ──────────────────────────────────────────────────────────────

const PAYMENT_STATUS_LABEL = {
  pending: 'Pending',
  in_escrow: 'In Escrow',
  released: 'Released',
  refunded: 'Refunded',
};

// ── Sub-components ─────────────────────────────────────────────────────────

const StatCard = ({ label, value, sub }) => (
  <div className="stat-card">
    <div className="stat-card__value">{value}</div>
    <div className="stat-card__label">{label}</div>
    {sub && <div className="stat-card__sub">{sub}</div>}
  </div>
);

const PaymentStatusBadge = ({ status }) => (
  <span className={`payment-badge payment-badge--${status}`}>
    {PAYMENT_STATUS_LABEL[status] ?? status}
  </span>
);

// ── Main component ─────────────────────────────────────────────────────────

const OwnerDashboard = () => {
  const { user } = useAuth();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all'); // 'all' | 'in_escrow' | 'released'

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getAllPayments();
      setPayments(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load payments. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  // Derived stats
  const totalInEscrow = payments
    .filter((p) => p.status === 'in_escrow')
    .reduce((s, p) => s + (p.amount ?? 0), 0);
  const totalReleased = payments
    .filter((p) => p.status === 'released')
    .reduce((s, p) => s + (p.amount ?? 0), 0);
  const inEscrowCount = payments.filter((p) => p.status === 'in_escrow').length;
  const releasedCount = payments.filter((p) => p.status === 'released').length;

  const filtered = filter === 'all'
    ? payments
    : payments.filter((p) => p.status === filter);

  return (
    <div className="owner-full">
      <Navbar />

      <main className="owner-main">
        {/* ── Hero + Stats ──────────────────────────────────── */}
        <section className="owner-hero">
          <div className="container owner-hero__inner">
            <div className="owner-hero__text">
              <h1>Platform Overview</h1>
              <p>All escrow payments — {user?.name ?? 'Owner'}</p>
            </div>
            <div className="owner-stats">
              <StatCard
                label="Total Payments"
                value={payments.length}
              />
              <StatCard
                label="In Escrow"
                value={`$${totalInEscrow.toLocaleString()}`}
                sub={`${inEscrowCount} payment${inEscrowCount !== 1 ? 's' : ''}`}
              />
              <StatCard
                label="Released"
                value={`$${totalReleased.toLocaleString()}`}
                sub={`${releasedCount} payment${releasedCount !== 1 ? 's' : ''}`}
              />
            </div>
          </div>
        </section>

        {/* ── Payments section ──────────────────────────────── */}
        <section className="container owner-section">
          <div className="owner-section__header">
            <h2 className="owner-section__title">All Payments</h2>

            <div className="owner-filter-tabs">
              {['all', 'in_escrow', 'released'].map((f) => (
                <button
                  key={f}
                  className={`owner-filter-tab ${filter === f ? 'owner-filter-tab--active' : ''}`}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? 'All' : f === 'in_escrow' ? 'In Escrow' : 'Released'}
                  {f === 'in_escrow' && inEscrowCount > 0 && (
                    <span className="owner-filter-count">{inEscrowCount}</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Loading payments…</p>
            </div>
          ) : error ? (
            <div className="error-state" role="alert">
              <span className="error-state__icon">⚠️</span>
              <p>{error}</p>
              <button className="btn-outline" onClick={fetchPayments}>Try Again</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state__icon">💳</span>
              <p>
                {filter === 'all'
                  ? 'No payments on record yet.'
                  : `No ${PAYMENT_STATUS_LABEL[filter]?.toLowerCase()} payments.`}
              </p>
            </div>
          ) : (
            <div className="payments-table-wrap">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>Route</th>
                    <th>Amount</th>
                    <th>Shipper</th>
                    <th>Driver</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => (
                    <tr key={p._id} className={`payment-row payment-row--${p.status}`}>
                      <td>
                        <div className="payment-route">
                          {p.load ? (
                            <>
                              <span className="payment-city">{p.load.pickupCity}</span>
                              <span className="payment-arrow">→</span>
                              <span className="payment-city">{p.load.deliveryCity}</span>
                            </>
                          ) : (
                            <span className="payment-na">—</span>
                          )}
                        </div>
                        {p.load?.miles && (
                          <div className="payment-miles">{p.load.miles.toLocaleString()} mi</div>
                        )}
                      </td>
                      <td>
                        <span className="payment-amount">${p.amount?.toLocaleString() ?? '—'}</span>
                      </td>
                      <td className="payment-name">
                        {p.shipper?.companyName || p.shipper?.name || '—'}
                      </td>
                      <td className="payment-name">
                        {p.driver?.name || (
                          <span className="payment-unassigned">Unassigned</span>
                        )}
                      </td>
                      <td>
                        <PaymentStatusBadge status={p.status} />
                        {p.status === 'in_escrow' && p.scheduledReleaseAt && (
                          <div className="payment-release-time">
                            Releases {new Date(p.scheduledReleaseAt).toLocaleString()}
                          </div>
                        )}
                        {p.status === 'released' && p.releasedAt && (
                          <div className="payment-release-time">
                            {new Date(p.releasedAt).toLocaleDateString()}
                          </div>
                        )}
                      </td>
                      <td className="payment-date">
                        {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

export default OwnerDashboard;
