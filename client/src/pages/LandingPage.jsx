import React from 'react';
import { useNavigate, Link } from 'react-router-dom'; // --- ENHANCEMENT: Import Link
import SOSButton from '../components/SOSButton';
import './LandingPage.css';

function LandingPage() {
  const navigate = useNavigate();

  const handleSOSClick = () => {
    navigate('/quick-access');
  };

  return (
    <div className="landing-container">
      <header className="landing-header">
        <img src="/prc-logo.png" alt="Philippine Red Cross Logo" className="logo" />
        <h1>Philippine Red Cross</h1>
        <h2>Camarines Norte Chapter</h2>
      </header>
      <main className="landing-main">
        <p className="instructions">
          In case of emergency, press the button below.
        </p>
        <SOSButton onClick={handleSOSClick} />
      </main>
      <footer className="landing-footer">
        {/* --- ENHANCEMENT: Add link to First-Aid Guide --- */}
        <p><Link to="/first-aid" className="footer-link">View First-Aid Guide</Link></p>
        <p>Already have an account? <Link to="/login" className="footer-link">Login</Link></p>
        <p>or <Link to="/register" className="footer-link">Register</Link> for a better experience.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
