import { Link } from 'react-router-dom';
import './Footer.css';

const Footer = () => (
  <footer className="footer">
    <div className="container footer__inner">
      <div className="footer__brand">
        <div className="footer__logo">
          <span>🚛</span>
          <span>TruckLink</span>
        </div>
        <p className="footer__tagline">
          The freight platform that pays drivers in 2 hours — guaranteed.
        </p>
      </div>

      <div className="footer__links">
        <div className="footer__col">
          <h4>Platform</h4>
          <Link to="/">Home</Link>
          <Link to="/login">Sign In</Link>
          <Link to="/login">Get Started</Link>
        </div>
        <div className="footer__col">
          <h4>For Drivers</h4>
          <Link to="/login">Find Loads</Link>
          <Link to="/login">My Earnings</Link>
          <Link to="/login">Trip History</Link>
        </div>
        <div className="footer__col">
          <h4>For Shippers</h4>
          <Link to="/login">Post a Load</Link>
          <Link to="/login">Track Shipment</Link>
          <Link to="/login">Escrow Payments</Link>
        </div>
      </div>
    </div>

    <div className="footer__bottom">
      <div className="container">
        <span>© 2024 TruckLink. All rights reserved.</span>
        <span className="footer__badge">🔒 Escrow Protected · ✓ Verified Drivers · ⚡ 2-Hour Pay</span>
      </div>
    </div>
  </footer>
);

export default Footer;
