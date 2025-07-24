import React, { useEffect, useState } from 'react';
import { Destination } from './TripPlanningForm';
import SimpleMap from './SimpleMap';

interface TripMapSelectorProps {
  destinations: Destination[];
  onDestinationsChange: (destinations: Destination[]) => void;
  startingAddress: string;
  endingAddress: string;
  onDistanceCalculated: (distance: number) => void;
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

  const addDestination = (lat: number, lng: number) => {
    const newDestination: Destination = {
      id: Date.now().toString(),
      lat,
      lng,
      name: `Destination ${destinations.length + 1}`,
    };
    onDestinationsChange([...destinations, newDestination]);
  };

  const removeDestination = (id: string) => {
    onDestinationsChange(destinations.filter(d => d.id !== id));
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

  // Calculate route distance using OSRM
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
    <SimpleMap
      destinations={destinations}
      onAddDestination={addDestination}
      startCoords={startCoords}
      endCoords={endCoords}
      onRemoveDestination={removeDestination}
    />
  );
};

export default TripMapSelector;