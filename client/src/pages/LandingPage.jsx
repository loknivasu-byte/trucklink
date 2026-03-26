import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import './LandingPage.css';

/* ─── Data ─────────────────────────────────────────────── */
const HOW_IT_WORKS = [
  {
    step: '01',
    role: 'Shipper',
    icon: '📦',
    title: 'Post Your Load',
    desc: 'Enter pickup city, delivery city, cargo weight, and your rate. Funds are locked in escrow immediately — your load is guaranteed covered.',
  },
  {
    step: '02',
    role: 'Driver',
    icon: '🗺️',
    title: 'Find & Accept',
    desc: 'Browse loads on your route filtered by truck type and pay rate. See shipper ratings before you commit. One tap to accept.',
  },
  {
    step: '03',
    role: 'Both',
    icon: '⚡',
    title: 'Deliver & Get Paid',
    desc: 'Driver confirms delivery. Escrow releases automatically. Payment hits the driver within 2 hours — no invoices, no waiting.',
  },
];

const TRUST_FEATURES = [
  {
    icon: '✅',
    title: 'Verified CDL Drivers',
    desc: 'Every driver on TruckLink has a verified Commercial Driver\'s License and a public trust score built from delivery history.',
    color: '#dcfce7',
    iconBg: '#16a34a',
  },
  {
    icon: '🔒',
    title: 'Escrow-Protected Payment',
    desc: 'Shipper funds are locked in escrow the moment a load is posted. Drivers know they\'re guaranteed to get paid before they ever leave the dock.',
    color: '#dbeafe',
    iconBg: '#1d4ed8',
  },
  {
    icon: '⚡',
    title: '2-Hour Payment Guarantee',
    desc: 'No other platform guarantees this. From delivery confirmation to money in your account — 2 hours, every time, no exceptions.',
    color: '#fff7ed',
    iconBg: '#f97316',
  },
];

const STATS = [
  { value: '12,400+', label: 'Loads Delivered' },
  { value: '$47M+', label: 'Paid to Drivers' },
  { value: '98.6%', label: 'On-Time Rate' },
  { value: '< 2 hrs', label: 'Avg Payment Time' },
];

const ROUTES = [
  { from: 'Chicago', to: 'Dallas', miles: '921 mi', pay: '$2,947', type: 'Dry Van' },
  { from: 'Los Angeles', to: 'Phoenix', miles: '372 mi', pay: '$1,525', type: 'Refrigerated' },
  { from: 'Atlanta', to: 'New York', miles: '876 mi', pay: '$3,285', type: 'Dry Van' },
  { from: 'Houston', to: 'Chicago', miles: '1,092 mi', pay: '$3,166', type: 'Flatbed' },
];

/* ─── Component ─────────────────────────────────────────── */
const LandingPage = () => (
  <div className="landing">
    <Navbar />

    {/* ── HERO ─────────────────────────────────────────── */}
    <section className="hero">
      <div className="container hero__inner">
        <div className="hero__content">
          <div className="hero__badge">🚛 The Smarter Way to Move Freight</div>
          <h1 className="hero__headline">
            Freight Matching.<br />
            <span className="hero__headline--accent">Paid in 2 Hours.</span>
          </h1>
          <p className="hero__sub">
            TruckLink connects verified CDL drivers with shippers across the US.
            Post a load, accept a load, confirm delivery — escrow releases your
            payment in under 2 hours. Guaranteed.
          </p>
          <div className="hero__cta">
            <Link to="/login" className="btn-primary hero__btn-main">
              Get Started Free →
            </Link>
            <a href="#how-it-works" className="btn-outline-white">
              See How It Works
            </a>
          </div>
          <div className="hero__proof">
            <div className="hero__proof-item">
              <span className="hero__proof-dot hero__proof-dot--green" />
              <span>12,400+ loads delivered</span>
            </div>
            <div className="hero__proof-item">
              <span className="hero__proof-dot hero__proof-dot--orange" />
              <span>Drivers paid within 2 hours</span>
            </div>
          </div>
        </div>

        <div className="hero__card-wrap">
          <div className="hero__card">
            <div className="hero__card-header">
              <span className="hero__card-tag hero__card-tag--available">● Available Now</span>
              <span className="hero__card-type">Dry Van</span>
            </div>
            <div className="hero__card-route">
              <div className="hero__card-city">
                <div className="hero__card-dot hero__card-dot--pickup" />
                <div>
                  <div className="hero__card-city-name">Chicago, IL</div>
                  <div className="hero__card-city-label">Pickup</div>
                </div>
              </div>
              <div className="hero__card-arrow">→</div>
              <div className="hero__card-city">
                <div className="hero__card-dot hero__card-dot--delivery" />
                <div>
                  <div className="hero__card-city-name">Dallas, TX</div>
                  <div className="hero__card-city-label">Delivery</div>
                </div>
              </div>
            </div>
            <div className="hero__card-details">
              <div className="hero__card-detail">
                <span className="hero__card-detail-label">Distance</span>
                <span className="hero__card-detail-value">921 miles</span>
              </div>
              <div className="hero__card-detail">
                <span className="hero__card-detail-label">Rate</span>
                <span className="hero__card-detail-value">$3.20/mi</span>
              </div>
              <div className="hero__card-detail">
                <span className="hero__card-detail-label">Total Pay</span>
                <span className="hero__card-detail-value hero__card-detail-value--pay">$2,947</span>
              </div>
            </div>
            <div className="hero__card-shipper">
              <div className="hero__card-avatar">RC</div>
              <div>
                <div className="hero__card-shipper-name">Chen Industrial Supply</div>
                <div className="hero__card-stars">★★★★★ <span>4.7 rating</span></div>
              </div>
            </div>
            <div className="hero__card-escrow">
              🔒 $2,947 locked in escrow · Paid within 2 hrs of delivery
            </div>
            <button className="btn-primary hero__card-btn">Accept This Load</button>
          </div>

          <div className="hero__payment-badge">
            <div className="hero__payment-icon">⚡</div>
            <div>
              <div className="hero__payment-title">Payment Guarantee</div>
              <div className="hero__payment-sub">Funds in your account within 2 hours</div>
            </div>
          </div>
        </div>
      </div>
    </section>

    {/* ── STATS ────────────────────────────────────────── */}
    <section className="stats">
      <div className="container stats__inner">
        {STATS.map((s) => (
          <div key={s.label} className="stats__item">
            <div className="stats__value">{s.value}</div>
            <div className="stats__label">{s.label}</div>
          </div>
        ))}
      </div>
    </section>

    {/* ── HOW IT WORKS ─────────────────────────────────── */}
    <section className="how" id="how-it-works">
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow">Simple Process</div>
          <h2 className="section-title">How TruckLink Works</h2>
          <p className="section-sub">
            Three steps from posting a load to getting paid — no phone calls, no invoices, no delays.
          </p>
        </div>

        <div className="how__steps">
          {HOW_IT_WORKS.map((item, i) => (
            <div key={item.step} className="how__step">
              <div className="how__step-num">{item.step}</div>
              <div className="how__step-icon">{item.icon}</div>
              <div className="how__step-role">{item.role}</div>
              <h3 className="how__step-title">{item.title}</h3>
              <p className="how__step-desc">{item.desc}</p>
              {i < HOW_IT_WORKS.length - 1 && <div className="how__connector" />}
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── TRUST ────────────────────────────────────────── */}
    <section className="trust">
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow">Why Drivers & Shippers Choose Us</div>
          <h2 className="section-title">Built on Trust, Backed by Escrow</h2>
          <p className="section-sub">
            Every transaction on TruckLink is protected from the moment a load is posted to the moment it's delivered.
          </p>
        </div>

        <div className="trust__cards">
          {TRUST_FEATURES.map((f) => (
            <div key={f.title} className="trust__card" style={{ '--card-bg': f.color }}>
              <div className="trust__card-icon" style={{ background: f.iconBg }}>
                {f.icon}
              </div>
              <h3 className="trust__card-title">{f.title}</h3>
              <p className="trust__card-desc">{f.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* ── LIVE LOADS PREVIEW ───────────────────────────── */}
    <section className="loads-preview">
      <div className="container">
        <div className="section-header">
          <div className="section-eyebrow">Live on the Platform</div>
          <h2 className="section-title">Real Loads. Real Pay. Right Now.</h2>
          <p className="section-sub">
            These routes are live on TruckLink today. Sign up as a driver to see full details and accept loads.
          </p>
        </div>

        <div className="loads-preview__grid">
          {ROUTES.map((r) => (
            <div key={`${r.from}-${r.to}`} className="loads-preview__card">
              <div className="loads-preview__top">
                <span className="loads-preview__type">{r.type}</span>
                <span className="loads-preview__status">● Available</span>
              </div>
              <div className="loads-preview__route">
                <span className="loads-preview__city">{r.from}</span>
                <span className="loads-preview__arrow">→</span>
                <span className="loads-preview__city">{r.to}</span>
              </div>
              <div className="loads-preview__meta">
                <span>{r.miles}</span>
                <span className="loads-preview__pay">{r.pay}</span>
              </div>
              <div className="loads-preview__escrow">🔒 Escrow protected</div>
            </div>
          ))}
        </div>

        <div className="loads-preview__more">
          <Link to="/login" className="btn-primary">
            View All Available Loads →
          </Link>
        </div>
      </div>
    </section>

    {/* ── ROLES CTA ────────────────────────────────────── */}
    <section className="roles">
      <div className="container roles__inner">
        <div className="roles__card roles__card--driver">
          <div className="roles__card-icon">🚛</div>
          <h3>I'm a Driver</h3>
          <p>Find loads on your route, see full pay upfront, and get paid within 2 hours of delivery. No invoice chasing.</p>
          <ul className="roles__list">
            <li>✓ Browse available loads by route</li>
            <li>✓ See shipper ratings before accepting</li>
            <li>✓ AI assistant for load questions</li>
            <li>✓ Guaranteed 2-hour payment</li>
          </ul>
          <Link to="/login" className="btn-primary">Start as a Driver →</Link>
        </div>

        <div className="roles__card roles__card--shipper">
          <div className="roles__card-icon">📦</div>
          <h3>I'm a Shipper</h3>
          <p>Post loads in minutes, get matched with verified drivers, and track your freight in real time. Escrow protects every shipment.</p>
          <ul className="roles__list">
            <li>✓ Post loads with one form</li>
            <li>✓ See driver trust scores before confirming</li>
            <li>✓ Real-time shipment tracking</li>
            <li>✓ Escrow holds funds until delivery</li>
          </ul>
          <Link to="/login" className="btn-outline">Post Your First Load →</Link>
        </div>
      </div>
    </section>

    {/* ── FINAL CTA ────────────────────────────────────── */}
    <section className="final-cta">
      <div className="container final-cta__inner">
        <h2>Ready to Move Freight the Right Way?</h2>
        <p>
          Join thousands of drivers and shippers who trust TruckLink for
          every load — backed by escrow, guaranteed in 2 hours.
        </p>
        <div className="final-cta__buttons">
          <Link to="/login" className="btn-primary">
            Create Free Account →
          </Link>
          <Link to="/login" className="btn-outline-white">
            Sign In
          </Link>
        </div>
      </div>
    </section>

    <Footer />
  </div>
);

export default LandingPage;
