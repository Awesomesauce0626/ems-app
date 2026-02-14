import React from 'react';
import { MapContainer, TileLayer, Marker, Popup, Tooltip } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import './MapView.css';

const redIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const blueIcon = new L.Icon({
  iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const MapView = ({ alerts, responders }) => {
  const position = [14.113, 122.95];

  return (
    <MapContainer center={position} zoom={12} style={{ height: '100%', width: '100%' }}>
      <TileLayer
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
        attribution='© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors & © <a href="https://carto.com/attributions">CARTO</a>'
      />

      {alerts.map(alert => {
        if (alert.location && alert.location.latitude && alert.location.longitude) {
          const isCompleted = alert.status === 'completed' || alert.status === 'cancelled';
          const markerClass = isCompleted ? '' : 'blinking-marker';

          return (
            <Marker
              key={alert._id}
              position={[alert.location.latitude, alert.location.longitude]}
              icon={redIcon}
              className={markerClass} // Apply the class directly to the marker
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                <strong>{alert.incidentType}</strong><br />
                Address: {alert.location.address || 'N/A'}
              </Tooltip>
              <Popup>
                <strong>{alert.incidentType}</strong><br />
                Status: {alert.status}<br />
                Reporter: {alert.reporterName}<br/>
                <a href={`/alert/${alert._id}`} target="_blank" rel="noopener noreferrer">View Details</a>
              </Popup>
            </Marker>
          );
        }
        return null;
      })}

      {responders && responders.map(responder => {
        if (responder.location && responder.location.lat && responder.location.lng) {
          return (
            <Marker
              key={responder.id}
              position={[responder.location.lat, responder.location.lng]}
              icon={blueIcon}
            >
              <Tooltip direction="top" offset={[0, -10]} opacity={1} permanent={false}>
                <strong>{responder.user.name}</strong><br />
                (On Duty)
              </Tooltip>
            </Marker>
          );
        }
        return null;
      })}

    </MapContainer>
  );
};

export default MapView;
