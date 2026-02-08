import React from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Leaflet's default icon URLs are not easily handled by Vite, so we manually fix them.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.3/dist/images/marker-shadow.png',
});

const MapView = ({ alerts }) => {
  const position = [14.113, 122.95]; // Default center (Camarines Norte)

  return (
    <MapContainer center={position} zoom={12} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & © <a href="https://carto.com/attributions">CARTO</a>'
      />
      {alerts.map(alert => (
        <Marker
          key={alert._id}
          position={[alert.location.lat, alert.location.lng]}
        >
          <Popup>
            <strong>{alert.incidentType}</strong><br />
            Status: {alert.status}<br />
            Reporter: {alert.reporterName}<br/>
            <a href={`/alert/${alert._id}`} target="_blank" rel="noopener noreferrer">View Details</a>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
};

export default MapView;
