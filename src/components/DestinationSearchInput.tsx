import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import LocationAutocomplete from './LocationAutocomplete';
import { Destination } from './TripPlanningForm';

interface DestinationSearchInputProps {
  destinations: Destination[];
  onDestinationsChange: (destinations: Destination[]) => void;
}

const DestinationSearchInput: React.FC<DestinationSearchInputProps> = ({
  destinations,
  onDestinationsChange,
}) => {
  const [searchValue, setSearchValue] = useState('');

  const handleLocationSelect = (lat: number, lng: number, displayName: string) => {
    const newDestination: Destination = {
      id: Date.now().toString(),
      lat,
      lng,
      name: displayName.split(',')[0], // Use first part as name
    };
    
    onDestinationsChange([...destinations, newDestination]);
    setSearchValue(''); // Clear input after selection
  };

  const handleAddCurrent = () => {
    if (searchValue.trim()) {
      // If user typed something but didn't select, try to geocode it
      handleLocationSelect(0, 0, searchValue);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <div className="flex-1">
          <LocationAutocomplete
            value={searchValue}
            onChange={setSearchValue}
            onLocationSelect={handleLocationSelect}
            placeholder="Search for a destination to add..."
          />
        </div>
        {searchValue && (
          <Button
            type="button"
            variant="outline"
            size="default"
            onClick={handleAddCurrent}
            className="flex-shrink-0"
          >
            <Plus className="h-4 w-4" />
          </Button>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground">
        Type a location name or click on the map to add destinations
      </p>
    </div>
  );
};

export default DestinationSearchInput;