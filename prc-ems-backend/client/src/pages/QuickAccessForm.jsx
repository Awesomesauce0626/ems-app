import React, { useState, useEffect } from 'react';
import AlertForm from '../components/AlertForm';
import '../components/AlertForm.css';
import './QuickAccessForm.css';

const QuickAccessForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setLocationError('Unable to retrieve your location. Please enable location services.');
      }
    );
  }, []);

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError(null);

    if (!location) {
        setError("Location is required to submit an alert.");
        setIsSubmitting(false);
        return;
    }

    try {
      // 1. Get a temporary token for quick access
      const quickAccessRes = await fetch('/api/auth/quick-access', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            reporterName: data.reporterName,
            reporterPhone: data.reporterPhone
        }),
      });

      if (!quickAccessRes.ok) throw new Error('Failed to get quick access token');
      const { token } = await quickAccessRes.json();

      // 2. Submit the alert with the temporary token
      const alertData = { ...data, location };
      const alertRes = await fetch('/api/alerts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(alertData),
      });

      if (!alertRes.ok) throw new Error('Failed to submit alert');

      alert('Alert submitted successfully! EMS is on the way.');
      // navigate('/'); // Optional: redirect to home
    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="quick-form-container">
        <header className="quick-form-header">
            <h1>Emergency Alert</h1>
            <p>Fill out the details below. Your location will be sent automatically.</p>
        </header>

        {locationError && <p className="location-error">{locationError}</p>}
        {!location && !locationError && <p className="location-loading">Getting your location...</p>}

        <AlertForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
        {error && <p className="submission-error">{error}</p>}
    </div>
  );
};

export default QuickAccessForm;
