import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import { Destination } from './TripPlanningForm';

// Fix for default markers in react-leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom marker icons
const createCustomIcon = (color: string) => new L.Icon({
  iconUrl: `https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

const startIcon = createCustomIcon('green');
const endIcon = createCustomIcon('red');
const wayPointIcon = createCustomIcon('blue');

interface TripMapSelectorProps {
  destinations: Destination[];
  onDestinationsChange: (destinations: Destination[]) => void;
  startingAddress: string;
  endingAddress: string;
  onDistanceCalculated: (distance: number) => void;
}

interface MapClickHandlerProps {
  onAddDestination: (lat: number, lng: number) => void;
}

const MapClickHandler: React.FC<MapClickHandlerProps> = ({ onAddDestination }) => {
  useMapEvents({
    click: (e) => {
      onAddDestination(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
};

interface MapMarkersProps {
  startCoords: [number, number] | null;
  endCoords: [number, number] | null;
  destinations: Destination[];
  startingAddress: string;
  endingAddress: string;
  onDestinationsChange: (destinations: Destination[]) => void;
}

const MapMarkers: React.FC<MapMarkersProps> = ({
  startCoords,
  endCoords,
  destinations,
  startingAddress,
  endingAddress,
  onDestinationsChange,
}) => {
  return (
    <>
      {startCoords && (
        <Marker position={startCoords} icon={startIcon}>
          <Popup>
            <div className="text-center">
              <strong>Starting Point</strong>
              <br />
              {startingAddress}
            </div>
          </Popup>
        </Marker>
      )}

      {destinations.map((dest, index) => (
        <Marker
          key={dest.id}
          position={[dest.lat, dest.lng]}
          icon={wayPointIcon}
        >
          <Popup>
            <div className="text-center">
              <strong>Destination {index + 1}</strong>
              <br />
              Lat: {dest.lat.toFixed(4)}, Lng: {dest.lng.toFixed(4)}
              <br />
              <button
                onClick={() => {
                  onDestinationsChange(destinations.filter(d => d.id !== dest.id));
                }}
                className="mt-2 px-2 py-1 bg-red-500 text-white rounded text-xs"
              >
                Remove
              </button>
            </div>
          </Popup>
        </Marker>
      ))}

      {endCoords && (
        <Marker position={endCoords} icon={endIcon}>
          <Popup>
            <div className="text-center">
              <strong>Ending Point</strong>
              <br />
              {endingAddress}
            </div>
          </Popup>
        </Marker>
      )}
    </>
  );
}

const TripMapSelector: React.FC<TripMapSelectorProps> = ({
  destinations,
  onDestinationsChange,
  startingAddress,
  endingAddress,
  onDistanceCalculated,
}) => {
  const [startCoords, setStartCoords] = useState<[number, number] | null>(null);
  const [endCoords, setEndCoords] = useState<[number, number] | null>(null);

  // Default center (Tunisia)
  const defaultCenter: [number, number] = [33.8869, 9.5375];

  const addDestination = (lat: number, lng: number) => {
    const newDestination: Destination = {
      id: Date.now().toString(),
      lat,
      lng,
      name: `Destination ${destinations.length + 1}`,
    };
    onDestinationsChange([...destinations, newDestination]);
  };

  // Geocoding function using Nominatim
  const geocodeAddress = async (address: string): Promise<[number, number] | null> => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`
      );
      const data = await response.json();
      if (data && data.length > 0) {
        return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
      }
    } catch (error) {
      console.error('Geocoding error:', error);
    }
    return null;
  };

  // Calculate route distance using OpenRouteService
  const calculateRouteDistance = async (coordinates: [number, number][]) => {
    if (coordinates.length < 2) return 0;

    try {
      const coordString = coordinates.map(coord => `${coord[1]},${coord[0]}`).join(';');
      const response = await fetch(
        `https://router.project-osrm.org/route/v1/driving/${coordString}?overview=false`
      );
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const distanceInMeters = data.routes[0].distance;
        const distanceInKm = distanceInMeters / 1000;
        return distanceInKm;
      }
    } catch (error) {
      console.error('Route calculation error:', error);
      // Fallback: calculate straight-line distance
      return calculateStraightLineDistance(coordinates);
    }
    return 0;
  };

  // Fallback: straight-line distance calculation
  const calculateStraightLineDistance = (coordinates: [number, number][]): number => {
    if (coordinates.length < 2) return 0;

    let totalDistance = 0;
    for (let i = 0; i < coordinates.length - 1; i++) {
      const [lat1, lon1] = coordinates[i];
      const [lat2, lon2] = coordinates[i + 1];
      
      const R = 6371; // Earth's radius in km
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
      totalDistance += R * c;
    }
    return totalDistance;
  };

  // Geocode addresses when they change
  useEffect(() => {
    if (startingAddress) {
      geocodeAddress(startingAddress).then(setStartCoords);
    }
  }, [startingAddress]);

  useEffect(() => {
    if (endingAddress) {
      geocodeAddress(endingAddress).then(setEndCoords);
    }
  }, [endingAddress]);

  // Calculate total distance when coordinates change
  useEffect(() => {
    const calculateTotalDistance = async () => {
      const allCoordinates: [number, number][] = [];
      
      if (startCoords) allCoordinates.push(startCoords);
      destinations.forEach(dest => allCoordinates.push([dest.lat, dest.lng]));
      if (endCoords) allCoordinates.push(endCoords);

      if (allCoordinates.length >= 2) {
        const distance = await calculateRouteDistance(allCoordinates);
        onDistanceCalculated(distance);
      }
    };

    calculateTotalDistance();
  }, [startCoords, endCoords, destinations, onDistanceCalculated]);

  return (
    <div className="h-96 w-full rounded-lg overflow-hidden border">
      <MapContainer
        center={defaultCenter}
        zoom={7}
        style={{ height: '100%', width: '100%' }}
        className="rounded-lg"
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapClickHandler onAddDestination={addDestination} />
        <MapMarkers 
          startCoords={startCoords}
          endCoords={endCoords}
          destinations={destinations}
          startingAddress={startingAddress}
          endingAddress={endingAddress}
          onDestinationsChange={onDestinationsChange}
        />
      </MapContainer>
    </div>
  );
};

export default TripMapSelector;