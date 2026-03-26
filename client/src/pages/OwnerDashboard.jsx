import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAllPayments } from '../services/paymentService';
import Navbar from '../components/Navbar';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import './OwnerDashboard.css';

// ── Constants ──────────────────────────────────────────────────────────────

const PAYMENT_STATUS_LABEL = {
  pending: 'Pending',
  in_escrow: 'In Escrow',
  released: 'Released',
  refunded: 'Refunded',
};

const CHART_COLORS = ['#f97316', '#1a3a6b', '#0f2240', '#fb923c', '#2563eb'];

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

// ── Analytics helpers ───────────────────────────────────────────────────────

const getRevenueByMonth = (payments) => {
  const map = {};
  payments
    .filter((p) => p.status === 'released')
    .forEach((p) => {
      const d = new Date(p.releasedAt || p.createdAt);
      const key = d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      map[key] = (map[key] || 0) + (p.amount ?? 0);
    });
  // Sort chronologically
  return Object.entries(map)
    .map(([month, revenue]) => ({ month, revenue }))
    .sort((a, b) => new Date('1 ' + a.month) - new Date('1 ' + b.month))
    .slice(-8); // last 8 months
};

const getTopDrivers = (payments) => {
  const map = {};
  payments
    .filter((p) => p.status === 'released' && p.driver?._id)
    .forEach((p) => {
      const id = p.driver._id;
      if (!map[id]) map[id] = { name: p.driver.name || 'Unknown', earned: 0 };
      map[id].earned += p.amount ?? 0;
    });
  return Object.values(map)
    .sort((a, b) => b.earned - a.earned)
    .slice(0, 5);
};

const dollarFormatter = (v) => `$${v.toLocaleString()}`;

// ── Main component ─────────────────────────────────────────────────────────

const OwnerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('payments'); // 'payments' | 'analytics'
  const [filter, setFilter] = useState('all');

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

  // Analytics data
  const revenueByMonth = getRevenueByMonth(payments);
  const topDrivers = getTopDrivers(payments);

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
              <StatCard label="Total Payments" value={payments.length} />
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

        {/* ── Tab bar ──────────────────────────────────────── */}
        <div className="container">
          <div className="owner-tabs">
            <button
              className={`owner-tab ${activeTab === 'payments' ? 'owner-tab--active' : ''}`}
              onClick={() => setActiveTab('payments')}
            >
              All Payments
            </button>
            <button
              className={`owner-tab ${activeTab === 'analytics' ? 'owner-tab--active' : ''}`}
              onClick={() => setActiveTab('analytics')}
            >
              Analytics
            </button>
          </div>
        </div>

        {/* ── Payments tab ──────────────────────────────────── */}
        {activeTab === 'payments' && (
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
                          {p.driver?._id ? (
                            <button
                              type="button"
                              className="driver-profile-link"
                              onClick={() => navigate(`/driver/${p.driver._id}`)}
                            >
                              {p.driver.name}
                            </button>
                          ) : (
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
        )}

        {/* ── Analytics tab ─────────────────────────────────── */}
        {activeTab === 'analytics' && (
          <section className="container owner-section">
            {loading ? (
              <div className="loading-state">
                <div className="loading-spinner" />
                <p>Loading analytics…</p>
              </div>
            ) : (
              <>
                {/* Revenue by month */}
                <div className="analytics-card">
                  <h2 className="analytics-card__title">Revenue Over Time</h2>
                  <p className="analytics-card__sub">Released payments by month</p>
                  {revenueByMonth.length === 0 ? (
                    <div className="analytics-empty">No released payments yet.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={revenueByMonth} margin={{ top: 8, right: 16, left: 8, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#64748b' }} />
                        <YAxis tickFormatter={dollarFormatter} tick={{ fontSize: 11, fill: '#64748b' }} width={70} />
                        <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Revenue']} />
                        <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Top drivers */}
                <div className="analytics-card">
                  <h2 className="analytics-card__title">Top Drivers by Earnings</h2>
                  <p className="analytics-card__sub">Total released payments per driver</p>
                  {topDrivers.length === 0 ? (
                    <div className="analytics-empty">No driver earnings data yet.</div>
                  ) : (
                    <ResponsiveContainer width="100%" height={Math.max(180, topDrivers.length * 52)}>
                      <BarChart
                        layout="vertical"
                        data={topDrivers}
                        margin={{ top: 4, right: 24, left: 8, bottom: 0 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" horizontal={false} />
                        <XAxis type="number" tickFormatter={dollarFormatter} tick={{ fontSize: 11, fill: '#64748b' }} />
                        <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12, fill: '#374151' }} />
                        <Tooltip formatter={(v) => [`$${v.toLocaleString()}`, 'Earned']} />
                        <Bar dataKey="earned" radius={[0, 4, 4, 0]}>
                          {topDrivers.map((_, i) => (
                            <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>

                {/* Platform summary */}
                <div className="analytics-summary">
                  <div className="analytics-summary__item">
                    <span className="analytics-summary__label">Total Platform Revenue</span>
                    <span className="analytics-summary__value">${totalReleased.toLocaleString()}</span>
                  </div>
                  <div className="analytics-summary__item">
                    <span className="analytics-summary__label">Funds in Escrow</span>
                    <span className="analytics-summary__value analytics-summary__value--escrow">
                      ${totalInEscrow.toLocaleString()}
                    </span>
                  </div>
                  <div className="analytics-summary__item">
                    <span className="analytics-summary__label">Unique Drivers</span>
                    <span className="analytics-summary__value">{topDrivers.length}</span>
                  </div>
                  <div className="analytics-summary__item">
                    <span className="analytics-summary__label">Total Loads Paid</span>
                    <span className="analytics-summary__value">{releasedCount}</span>
                  </div>
                </div>
              </>
            )}
          </section>
        )}
      </main>
    </div>
  );
};

export default OwnerDashboard;
