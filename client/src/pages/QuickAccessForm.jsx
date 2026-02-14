import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getStorage, ref, uploadBytes, getDownloadURL } from "firebase/storage";
import AlertForm from '../components/AlertForm';
import LocationPickerMap from '../components/LocationPickerMap';
import API_BASE_URL from '../api';
import '../components/AlertForm.css';
import './QuickAccessForm.css';

const EMERGENCY_HOTLINE = '09477357651';

const QuickAccessForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [initialCenter, setInitialCenter] = useState([14.113, 122.95]);
  const [locationError, setLocationError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const initialPos = { lat: position.coords.latitude, lng: position.coords.longitude };
        setInitialCenter([initialPos.lat, initialPos.lng]);
        setLocation(initialPos);
      },
      () => {
        setLocationError('Could not get your location automatically. The map is optional.');
        setLocation(null);
      }
    );

    const handleOnlineStatus = () => setIsOffline(!navigator.onLine);
    window.addEventListener('online', handleOnlineStatus);
    window.addEventListener('offline', handleOnlineStatus);
    return () => {
      window.removeEventListener('online', handleOnlineStatus);
      window.removeEventListener('offline', handleOnlineStatus);
    };
  }, []);

  const handleLocationChange = (newLocation) => {
    setLocation(newLocation);
  };

  const onSubmit = async (data) => {
    if (isOffline) {
        setFormData(data);
        return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      let imageUrl = null;
      if (data.image && data.image[0]) {
        const storage = getStorage();
        const storageRef = ref(storage, `incidents/${Date.now()}_${data.image[0].name}`);
        const snapshot = await uploadBytes(storageRef, data.image[0]);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      const quickAccessRes = await fetch(`${API_BASE_URL}/api/auth/quick-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reporterName: data.reporterName, reporterPhone: data.reporterPhone }),
      });

      if (!quickAccessRes.ok) throw new Error('Failed to get quick access token');
      const { token } = await quickAccessRes.json();

      const alertData = { ...data, location, imageUrl };

      const alertRes = await fetch(`${API_BASE_URL}/api/alerts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(alertData),
      });

      if (!alertRes.ok) throw new Error('Failed to submit alert');

      setIsSuccess(true);

    } catch (err) {
      setError(err.message || 'An unexpected error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSmsSend = () => {
      const message = `PRC-CN EMS ALERT:\nIncident: ${formData.incidentType}\nAddress: ${formData.address}\nReporter: ${formData.reporterName}, ${formData.reporterPhone}\nPatients: ${formData.patientCount}\nDetails: ${formData.description}`;
      window.location.href = `sms:${EMERGENCY_HOTLINE}?body=${encodeURIComponent(message)}`;
  };

  const handleCall = () => {
    window.location.href = `tel:${EMERGENCY_HOTLINE}`;
  };

  if (isOffline && formData) {
      return (
        <div className="quick-form-container">
            <div className="offline-container">
                <h2>No Internet Connection</h2>
                <p>You can send the alert via SMS or call the emergency hotline directly.</p>
                <div className="offline-actions">
                    <button onClick={handleSmsSend} className="offline-btn sms-btn">Send Alert via SMS</button>
                    <button onClick={handleCall} className="offline-btn call-btn">Call Emergency Hotline</button>
                </div>
            </div>
        </div>
      );
  }

  if (isSuccess) {
    return (
      <div className="quick-form-container">
          <div className="success-message-container">
              <h2>Alert Submitted Successfully!</h2>
              <p>Thank you for your report. The EMS team has been notified.</p>
              <p><strong>Please keep your phone line open. An EMS dispatcher may call you for confirmation or additional details.</strong></p>
              <div className="success-actions">
                <Link to="/" className="homepage-btn">Back to Homepage</Link>
                <button onClick={() => window.location.reload()} className="submit-another-btn">Submit Another Report</button>
              </div>
          </div>
      </div>
    )
  }

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
