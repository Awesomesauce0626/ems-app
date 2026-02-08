import React, { useState, useEffect } from 'react';
import AlertForm from '../components/AlertForm';
import LocationPickerMap from '../components/LocationPickerMap';
import API_BASE_URL from '../api';
import '../components/AlertForm.css';
import './QuickAccessForm.css';

const QuickAccessForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null); // Optional map location
  const [initialCenter, setInitialCenter] = useState([14.113, 122.95]);
  const [locationError, setLocationError] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const initialPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        };
        setInitialCenter([initialPos.lat, initialPos.lng]);
        setLocation(initialPos);
      },
      () => {
        setLocationError('Could not get your location automatically. The map is optional.');
        setLocation(null);
      }
    );
  }, []);

  const handleLocationChange = (newLocation) => {
    setLocation(newLocation);
  };

  const onSubmit = async (data) => {
    setIsSubmitting(true);
    setError(null);

    try {
      const quickAccessRes = await fetch(`${API_BASE_URL}/api/auth/quick-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reporterName: data.reporterName, reporterPhone: data.reporterPhone }),
      });

      if (!quickAccessRes.ok) throw new Error('Failed to get quick access token');
      const { token } = await quickAccessRes.json();

      // Map coordinates are now optional
      const alertData = { ...data, location };

      const alertRes = await fetch(`${API_BASE_URL}/api/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(alertData),
      });

      if (!alertRes.ok) throw new Error('Failed to submit alert');

      alert('Alert submitted successfully! EMS is on the way.');

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
        <p>Fill out the details below. The location description is required.</p>
      </header>

      <div className="map-form-container">
        <div className="map-wrapper">
          <p className="map-optional-text">Optional: Drag the pin to the exact incident location.</p>
          <LocationPickerMap center={initialCenter} onLocationChange={handleLocationChange} />
        </div>

        {locationError && <p className="location-error">{locationError}</p>}

        <div className="form-wrapper">
            <AlertForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
            {error && <p className="submission-error">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default QuickAccessForm;
