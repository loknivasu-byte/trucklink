import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getUserProfile } from '../services/userService';
import Navbar from '../components/Navbar';
import './DriverProfile.css';

// ── Star display ────────────────────────────────────────────────────────────

const StarDisplay = ({ score, max = 5 }) => (
  <span className="star-display" aria-label={`${score} out of ${max} stars`}>
    {Array.from({ length: max }, (_, i) => (
      <span key={i} className={`star ${i < score ? 'star--filled' : 'star--empty'}`}>
        ★
      </span>
    ))}
  </span>
);

// ── Rating card ─────────────────────────────────────────────────────────────

const RatingCard = ({ rating }) => {
  const raterName = rating.rater?.companyName || rating.rater?.name || 'Anonymous';
  const raterRole = rating.rater?.role;
  const route = rating.load
    ? `${rating.load.pickupCity} → ${rating.load.deliveryCity}`
    : null;

  return (
    <div className="profile-rating-card">
      <div className="profile-rating-card__header">
        <StarDisplay score={rating.score} />
        <span className="profile-rating-card__score">{rating.score}/5</span>
        {route && <span className="profile-rating-card__route">{route}</span>}
      </div>
      {rating.comment && (
        <p className="profile-rating-card__comment">"{rating.comment}"</p>
      )}
      <div className="profile-rating-card__meta">
        <span className="profile-rating-card__rater">
          {raterName}
          {raterRole && (
            <span className={`profile-role-badge profile-role-badge--${raterRole}`}>
              {raterRole}
            </span>
          )}
        </span>
        <span className="profile-rating-card__date">
          {new Date(rating.createdAt).toLocaleDateString()}
        </span>
      </div>
    </div>
  );
};

// ── Main component ──────────────────────────────────────────────────────────

const DriverProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError('');
    getUserProfile(id)
      .then((data) => { if (isMounted) { setProfile(data); setLoading(false); } })
      .catch((err) => {
        if (isMounted) {
          setError(err.response?.data?.message || 'Failed to load profile.');
          setLoading(false);
        }
      });
    return () => { isMounted = false; };
  }, [id]);

  const user = profile?.user;
  const ratings = profile?.ratingsReceived ?? [];

  const scoreField = user?.role === 'driver' ? user?.trustScore : user?.rating;
  const initial = user?.name?.charAt(0)?.toUpperCase() ?? '?';
  const displayName = user?.companyName || user?.name || 'Unknown';

  return (
    <div className="driver-profile">
      <Navbar />

      <main className="profile-main">
        <div className="container profile-container">
          <button
            className="profile-back"
            onClick={() => navigate(-1)}
            aria-label="Go back"
          >
            ← Back
          </button>

          {loading ? (
            <div className="loading-state">
              <div className="loading-spinner" />
              <p>Loading profile…</p>
            </div>
          ) : error ? (
            <div className="error-state" role="alert">
              <span className="error-state__icon">⚠️</span>
              <p>{error}</p>
              <button className="btn-outline" onClick={() => navigate(-1)}>Go Back</button>
            </div>
          ) : (
            <>
              {/* ── Profile header ────────────────────────────── */}
              <div className="profile-header">
                <div className="profile-avatar" aria-hidden="true">{initial}</div>
                <div className="profile-header__info">
                  <h1 className="profile-name">{displayName}</h1>
                  <span className={`profile-role-badge profile-role-badge--${user?.role}`}>
                    {user?.role}
                  </span>
                  <p className="profile-member-since">
                    Member since {new Date(user?.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>

              {/* ── Stats row ─────────────────────────────────── */}
              <div className="profile-stats">
                {scoreField != null && (
                  <div className="profile-stat">
                    <div className="profile-stat__value">
                      {scoreField}
                      <StarDisplay score={Math.round(scoreField)} />
                    </div>
                    <div className="profile-stat__label">
                      {user?.role === 'driver' ? 'Trust Score' : 'Rating'}
                    </div>
                  </div>
                )}
                {user?.role === 'driver' && (
                  <div className="profile-stat">
                    <div className="profile-stat__value">
                      {user?.totalDeliveries?.toLocaleString() ?? '0'}
                    </div>
                    <div className="profile-stat__label">Deliveries</div>
                  </div>
                )}
                <div className="profile-stat">
                  <div className="profile-stat__value">{ratings.length}</div>
                  <div className="profile-stat__label">Reviews</div>
                </div>
              </div>

              {/* ── Ratings ───────────────────────────────────── */}
              <section className="profile-ratings">
                <h2 className="profile-ratings__heading">
                  Reviews ({ratings.length})
                </h2>
                {ratings.length === 0 ? (
                  <div className="empty-state">
                    <span className="empty-state__icon">⭐</span>
                    <p>No reviews yet.</p>
                  </div>
                ) : (
                  <div className="profile-ratings__list">
                    {ratings.map((r) => (
                      <RatingCard key={r._id} rating={r} />
                    ))}
                  </div>
                )}
              </section>
            </>
          )}
        </div>
      </main>
    </div>
  );
};

export default DriverProfile;
