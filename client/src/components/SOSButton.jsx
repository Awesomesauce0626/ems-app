import React, { useState, useRef, useEffect } from 'react';
import './SOSButton.css';

const SOSButton = ({ onClick }) => {
  const [isHolding, setIsHolding] = useState(false);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef(null);
  const progressIntervalRef = useRef(null);

  const HOLD_DURATION = 3000; // 3 seconds

  const handlePressStart = () => {
    setIsHolding(true);
    setProgress(0);

    // Timer to trigger the action after 3 seconds
    timerRef.current = setTimeout(() => {
      onClick();
      handlePressEnd(); // Reset after action is triggered
    }, HOLD_DURATION);

    // Interval to update the visual progress indicator
    const startTime = Date.now();
    progressIntervalRef.current = setInterval(() => {
      const elapsedTime = Date.now() - startTime;
      const currentProgress = Math.min((elapsedTime / HOLD_DURATION) * 100, 100);
      setProgress(currentProgress);
    }, 50);
  };

  const handlePressEnd = () => {
    setIsHolding(false);
    setProgress(0);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      handlePressEnd();
    };
  }, []);

  return (
    <div className="sos-button-container">
      <button
        className="sos-button"
        onMouseDown={handlePressStart}
        onMouseUp={handlePressEnd}
        onMouseLeave={handlePressEnd} // Cancel if mouse leaves the button
        onTouchStart={(e) => { e.preventDefault(); handlePressStart(); }}
        onTouchEnd={handlePressEnd}
      >
        {/* Progress indicator circle */}
        <div
          className="progress-circle"
          style={{ background: `conic-gradient(#fff ${progress}%, transparent ${progress}%)` }}
        ></div>

        <div className="sos-button-text-container">
          <span className="sos-button-text">SOS</span>
          <span className="sos-button-subtext">
            {isHolding ? 'Keep Holding' : 'Press & Hold'}
          </span>
        </div>
      </button>
      <div className="sos-pulse"></div>
    </div>
  );
};

export default SOSButton;
