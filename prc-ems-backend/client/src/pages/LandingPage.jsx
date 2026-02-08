import React from 'react';
import { useNavigate } from 'react-router-dom';
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
        <p>Already have an account? <a href="/login">Login</a></p>
        <p>or <a href="/register">Register</a> for a better experience.</p>
      </footer>
    </div>
  );
}

export default LandingPage;
