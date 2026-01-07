import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Circle, useMap } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapStyles.css';

// Fix for default marker icons in React-Leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Modern custom marker icons - mapcn style
const createCustomIcon = (color, icon) => {
  return L.divIcon({
    className: 'custom-marker',
    html: `
      <div style="
        background: linear-gradient(135deg, ${color}, ${color}dd);
        width: 36px;
        height: 36px;
        border-radius: 50% 50% 50% 0;
        transform: rotate(-45deg);
        border: 3px solid rgba(255, 255, 255, 0.95);
        box-shadow:
          0 3px 8px rgba(0, 0, 0, 0.25),
          0 1px 3px rgba(0, 0, 0, 0.15),
          inset 0 1px 0 rgba(255, 255, 255, 0.3);
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.2s ease;
      ">
        <span style="
          transform: rotate(45deg);
          font-size: 18px;
          color: white;
          filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.3));
        ">${icon}</span>
      </div>
    `,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
    popupAnchor: [0, -36]
  });
};

const donorIcon = createCustomIcon('#EF4444', '🩸');
const requestIcon = createCustomIcon('#F59E0B', '🚨');
const campIcon = createCustomIcon('#10B981', '⛺');
const hospitalIcon = createCustomIcon('#3B82F6', '🏥');

// Component to recenter map when center prop changes
const RecenterMap = ({ center }) => {
  const map = useMap();

  useEffect(() => {
    if (center) {
      map.setView(center, map.getZoom());
    }
  }, [center, map]);

  return null;
};

// Component to handle geolocation
const LocationButton = ({ onLocationFound }) => {
  const map = useMap();

  const handleLocate = () => {
    map.locate({ setView: true, maxZoom: 13 });
  };

  useEffect(() => {
    map.on('locationfound', (e) => {
      if (onLocationFound) {
        onLocationFound(e.latlng);
      }
    });

    map.on('locationerror', () => {
      alert('Could not get your location. Please enable location services.');
    });

    return () => {
      map.off('locationfound');
      map.off('locationerror');
    };
  }, [map, onLocationFound]);

  return (
    <button
      onClick={handleLocate}
      className="leaflet-control leaflet-bar modern-location-btn"
      style={{
        position: 'absolute',
        top: '80px',
        right: '10px',
        zIndex: 1000,
        background: 'rgba(255, 255, 255, 0.98)',
        backdropFilter: 'blur(8px)',
        padding: '10px',
        cursor: 'pointer',
        border: '1px solid rgba(0, 0, 0, 0.08)',
        borderRadius: '8px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
        fontSize: '18px',
        transition: 'all 0.2s ease',
        fontWeight: 600
      }}
      title="Get my location"
      onMouseEnter={(e) => {
        e.target.style.background = 'white';
        e.target.style.boxShadow = '0 2px 6px rgba(0, 0, 0, 0.15)';
        e.target.style.transform = 'translateY(-1px)';
      }}
      onMouseLeave={(e) => {
        e.target.style.background = 'rgba(255, 255, 255, 0.98)';
        e.target.style.boxShadow = '0 1px 3px rgba(0, 0, 0, 0.1)';
        e.target.style.transform = 'translateY(0)';
      }}
    >
      📍
    </button>
  );
};

const LeafletMap = ({
  donors = [],
  requests = [],
  camps = [],
  hospitals = [],
  center = [23.8103, 90.4125], // Dhaka, Bangladesh
  zoom = 12,
  radius = 50,
  showRadius = true,
  onLocationFound,
  height = '500px'
}) => {
  const [mapCenter, setMapCenter] = useState(center);

  useEffect(() => {
    setMapCenter(center);
  }, [center]);

  const handleLocationFound = (latlng) => {
    setMapCenter([latlng.lat, latlng.lng]);
    if (onLocationFound) {
      onLocationFound(latlng);
    }
  };

  return (
    <div style={{
      height,
      width: '100%',
      position: 'relative',
      borderRadius: '16px',
      overflow: 'hidden',
      boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08), inset 0 0 0 1px rgba(0, 0, 0, 0.06)'
    }}>
      <MapContainer
        center={mapCenter}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <RecenterMap center={mapCenter} />
        <LocationButton onLocationFound={handleLocationFound} />

        {/* Radius circle */}
        {showRadius && (
          <Circle
            center={mapCenter}
            radius={radius * 1000} // Convert km to meters
            pathOptions={{
              color: '#3B82F6',
              fillColor: '#3B82F6',
              fillOpacity: 0.1,
              weight: 2
            }}
          />
        )}

        {/* Donor markers with clustering */}
        <MarkerClusterGroup>
          {donors.map((donor) => (
            <Marker
              key={donor.id}
              position={[donor.location.lat, donor.location.lng]}
              icon={donorIcon}
            >
              <Popup>
                <div className="map-popup">
                  <h3 className="font-bold text-lg">🩸 Donor</h3>
                  <p><strong>Name:</strong> {donor.name}</p>
                  <p><strong>Blood Type:</strong> {donor.bloodType}</p>
                  <p><strong>Status:</strong> {donor.isAvailable ? '✅ Available' : '❌ Unavailable'}</p>
                  <p><strong>Donations:</strong> {donor.totalDonations}</p>
                  <p><strong>Distance:</strong> {donor.distance} km</p>
                  {donor.address && (
                    <p><strong>Location:</strong> {donor.address.city}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
        </MarkerClusterGroup>

        {/* Blood request markers */}
        {requests.map((request) => (
          <Marker
            key={request.id}
            position={[request.location.lat, request.location.lng]}
            icon={requestIcon}
          >
            <Popup>
              <div className="map-popup">
                <h3 className="font-bold text-lg">🚨 Blood Request</h3>
                <p><strong>Blood Type:</strong> {request.bloodType}</p>
                <p><strong>Units Needed:</strong> {request.unitsNeeded}</p>
                <p><strong>Urgency:</strong>
                  <span className={`ml-2 px-2 py-1 rounded text-white text-xs ${
                    request.urgency === 'critical' ? 'bg-red-600' :
                    request.urgency === 'urgent' ? 'bg-orange-500' :
                    'bg-yellow-500'
                  }`}>
                    {request.urgency}
                  </span>
                </p>
                <p><strong>Hospital:</strong> {request.hospital}</p>
                <p><strong>Distance:</strong> {request.distance} km</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Blood camp markers */}
        {camps.map((camp) => (
          <Marker
            key={camp.id}
            position={[camp.location.lat, camp.location.lng]}
            icon={campIcon}
          >
            <Popup>
              <div className="map-popup">
                <h3 className="font-bold text-lg">⛺ Blood Camp</h3>
                <p><strong>Title:</strong> {camp.title}</p>
                <p><strong>Date:</strong> {new Date(camp.eventDate).toLocaleDateString()}</p>
                <p><strong>Location:</strong> {camp.address}</p>
                <p><strong>Distance:</strong> {camp.distance} km</p>
                {camp.contactNumber && (
                  <p><strong>Contact:</strong> {camp.contactNumber}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Hospital markers */}
        {hospitals.map((hospital, index) => (
          <Marker
            key={`hospital-${index}`}
            position={[hospital.location.lat, hospital.location.lng]}
            icon={hospitalIcon}
          >
            <Popup>
              <div className="map-popup">
                <h3 className="font-bold text-lg">🏥 Hospital</h3>
                <p><strong>Name:</strong> {hospital.name}</p>
                <p><strong>Active Requests:</strong> {hospital.requestCount}</p>
                <p><strong>Distance:</strong> {hospital.distance} km</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>

      {/* Map Legend */}
      <div className="map-legend">
        <div className="legend-item">
          <span className="legend-icon">🩸</span>
          <span>Donors ({donors.length})</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">🚨</span>
          <span>Requests ({requests.length})</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">⛺</span>
          <span>Blood Camps ({camps.length})</span>
        </div>
        <div className="legend-item">
          <span className="legend-icon">🏥</span>
          <span>Hospitals ({hospitals.length})</span>
        </div>
      </div>
    </div>
  );
};

export default LeafletMap;
