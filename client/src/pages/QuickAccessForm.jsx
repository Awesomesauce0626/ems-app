import React, { useState, useEffect } from 'react';
import AlertForm from '../components/AlertForm';
import LocationPickerMap from '../components/LocationPickerMap';
import API_BASE_URL from '../api';
import '../components/AlertForm.css'; // Re-use styles
import './QuickAccessForm.css';

const EMERGENCY_HOTLINE = '09477357651';

// Helper function to convert Data URL to Blob
const dataURLtoBlob = (dataurl) => {
    const arr = dataurl.split(',');
    const mime = arr[0].match(/:(.*?);/)[1];
    const bstr = atob(arr[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while(n--){
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], {type:mime});
}

const QuickAccessForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [location, setLocation] = useState(null);
  const [initialCenter, setInitialCenter] = useState([14.113, 122.95]);
  const [locationError, setLocationError] = useState(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [formData, setFormData] = useState(null);

  // Add state for the new fields
  const [reporterName, setReporterName] = useState('');
  const [reporterPhone, setReporterPhone] = useState('');

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

  // The onSubmit function now receives data from the child AlertForm
  const onSubmit = async (alertFormData) => {
    // Combine data from the child form with data from this form
    const combinedData = { ...alertFormData, reporterName, reporterPhone };

    if (isOffline) {
        setFormData(combinedData);
        return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const quickAccessRes = await fetch(`${API_BASE_URL}/api/auth/quick-access`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // Use the name and phone from this form's state
        body: JSON.stringify({ reporterName, reporterPhone }),
      });

      if (!quickAccessRes.ok) throw new Error('Failed to get quick access token');
      const { token } = await quickAccessRes.json();

      let imageUrl = null;
      if (combinedData.image) {
        const signRes = await fetch(`${API_BASE_URL}/api/upload/sign`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        if (!signRes.ok) throw new Error('Could not get upload signature from server.');
        const signData = await signRes.json();

        const imageBlob = dataURLtoBlob(combinedData.image.dataUrl);
        const uploadFormData = new FormData();
        uploadFormData.append('file', imageBlob);
        uploadFormData.append('api_key', signData.apikey);
        uploadFormData.append('timestamp', signData.timestamp);
        uploadFormData.append('signature', signData.signature);
        uploadFormData.append('folder', 'incidents');

        const cloudinaryUrl = `https://api.cloudinary.com/v1_1/${signData.cloudname}/image/upload`;

        const uploadRes = await fetch(cloudinaryUrl, {
            method: 'POST',
            body: uploadFormData,
        });
        if (!uploadRes.ok) throw new Error('Image upload to Cloudinary failed.');
        const uploadResult = await uploadRes.json();
        imageUrl = uploadResult.secure_url;
      }

      const alertData = { ...combinedData, location, imageUrl };

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
              <button onClick={() => window.location.reload()} className="submit-another-btn">Submit Another Report</button>
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
            {/* Add the Name and Phone fields here */}
            <div className="alert-form">
              <div className="form-group">
                <label htmlFor="reporterName">Your Name</label>
                <input id="reporterName" value={reporterName} onChange={(e) => setReporterName(e.target.value)} required />
              </div>

              <div className="form-group">
                <label htmlFor="reporterPhone">Your Phone Number</label>
                <input id="reporterPhone" value={reporterPhone} onChange={(e) => setReporterPhone(e.target.value)} required />
              </div>
            </div>

            <AlertForm onSubmit={onSubmit} isSubmitting={isSubmitting} />
            {error && <p className="submission-error">{error}</p>}
        </div>
      </div>
    </div>
  );
};

export default QuickAccessForm;
