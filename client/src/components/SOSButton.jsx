import React from 'react';
import './SOSButton.css';

const SOSButton = ({ onClick }) => {
  return (
    <div className="sos-button-container">
      <button className="sos-button" onClick={onClick}>
        <div className="sos-button-text-container">
          <span className="sos-button-text">SOS</span>
          <span className="sos-button-subtext">Emergency</span>
        </div>
      </button>
      <div className="sos-pulse"></div>
    </div>
  );
};

export default SOSButton;
