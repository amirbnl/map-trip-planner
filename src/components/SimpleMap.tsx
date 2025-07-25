import React, { useEffect, useRef } from 'react';
import L from 'leaflet';

// Fix for default markers
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface SimpleMapProps {
  destinations: Array<{
    id: string;
    lat: number;
    lng: number;
    name?: string;
  }>;
  onAddDestination: (lat: number, lng: number) => void;
  startCoords?: [number, number] | null;
  endCoords?: [number, number] | null;
  onRemoveDestination: (id: string) => void;
}

const SimpleMap: React.FC<SimpleMapProps> = ({
  destinations,
  onAddDestination,
  startCoords,
  endCoords,
  onRemoveDestination,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return;

    // Initialize map
    const map = L.map(mapRef.current).setView([33.8869, 9.5375], 7);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add click handler
    map.on('click', (e) => {
      onAddDestination(e.latlng.lat, e.latlng.lng);
    });

    mapInstanceRef.current = map;

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [onAddDestination]);

  // Update markers when destinations change
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add start marker
    if (startCoords) {
      const startMarker = L.marker(startCoords, {
        icon: L.icon({
          iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      }).addTo(mapInstanceRef.current);
      
      startMarker.bindPopup('<strong>Starting Point</strong>');
      markersRef.current.push(startMarker);
    }

    // Add destination markers
    destinations.forEach((dest, index) => {
      const marker = L.marker([dest.lat, dest.lng], {
        icon: L.icon({
          iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      }).addTo(mapInstanceRef.current);

      marker.bindPopup(`
        <div style="text-align: center;">
          <strong>${dest.name || `Destination ${index + 1}`}</strong><br/>
          ${dest.lat.toFixed(4)}, ${dest.lng.toFixed(4)}<br/>
          <button onclick="window.removeDestination('${dest.id}')" style="margin-top: 8px; padding: 4px 8px; background: #ef4444; color: white; border: none; border-radius: 4px; cursor: pointer;">
            Remove
          </button>
        </div>
      `);
      
      markersRef.current.push(marker);
    });

    // Add end marker
    if (endCoords) {
      const endMarker = L.marker(endCoords, {
        icon: L.icon({
          iconUrl: 'https://cdn.rawgit.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41]
        })
      }).addTo(mapInstanceRef.current);
      
      endMarker.bindPopup('<strong>Ending Point</strong>');
      markersRef.current.push(endMarker);
    }
  }, [destinations, startCoords, endCoords]);

  // Set up global remove function
  useEffect(() => {
    (window as any).removeDestination = onRemoveDestination;
    return () => {
      delete (window as any).removeDestination;
    };
  }, [onRemoveDestination]);

  return (
    <div 
      ref={mapRef} 
      className="h-96 w-full rounded-lg border"
      style={{ height: '400px' }}
    />
  );
};

export default SimpleMap;