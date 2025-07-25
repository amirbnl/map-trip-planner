import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Search, MapPin, Loader2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

interface LocationSuggestion {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  class: string;
  type: string;
}

interface LocationAutocompleteProps {
  value: string;
  onChange: (value: string) => void;
  onLocationSelect?: (lat: number, lng: number, displayName: string) => void;
  placeholder?: string;
  className?: string;
}

const LocationAutocomplete: React.FC<LocationAutocompleteProps> = ({
  value,
  onChange,
  onLocationSelect,
  placeholder = "Search for a location...",
  className,
}) => {
  const [suggestions, setSuggestions] = useState<LocationSuggestion[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [error, setError] = useState<string | null>(null);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionRefs = useRef<(HTMLDivElement | null)[]>([]);
  const abortControllerRef = useRef<AbortController | null>(null);
  const cacheRef = useRef<Map<string, LocationSuggestion[]>>(new Map());

  const searchLocations = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setError(null);
      return;
    }

    // Check cache first
    const cacheKey = query.toLowerCase().trim();
    const cached = cacheRef.current.get(cacheKey);
    if (cached) {
      setSuggestions(cached);
      setError(null);
      return;
    }

    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=8&addressdetails=1&countrycodes=&dedupe=1`,
        {
          signal: abortControllerRef.current.signal,
          headers: {
            'User-Agent': 'TripPlanner/1.0',
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Search failed: ${response.status}`);
      }

      const data = await response.json();
      const results = data || [];
      
      // Cache the results
      cacheRef.current.set(cacheKey, results);
      
      // Limit cache size
      if (cacheRef.current.size > 50) {
        const firstKey = cacheRef.current.keys().next().value;
        cacheRef.current.delete(firstKey);
      }

      setSuggestions(results);
    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Location search error:', error);
        setError('Failed to search locations. Please try again.');
        setSuggestions([]);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const debouncedSearch = useMemo(() => {
    let timeoutId: NodeJS.Timeout;
    return (query: string) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        if (query) {
          searchLocations(query);
        } else {
          setSuggestions([]);
          setError(null);
        }
      }, 150); // Reduced debounce time for faster response
    };
  }, [searchLocations]);

  useEffect(() => {
    debouncedSearch(value);
  }, [value, debouncedSearch]);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  const handleSuggestionClick = (suggestion: LocationSuggestion) => {
    const displayName = suggestion.display_name;
    onChange(displayName);
    setIsOpen(false);
    setSuggestions([]);
    setSelectedIndex(-1);
    
    if (onLocationSelect) {
      onLocationSelect(parseFloat(suggestion.lat), parseFloat(suggestion.lon), displayName);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev < suggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => 
          prev > 0 ? prev - 1 : suggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSuggestionClick(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setIsOpen(false);
        setSelectedIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  useEffect(() => {
    if (selectedIndex >= 0 && suggestionRefs.current[selectedIndex]) {
      suggestionRefs.current[selectedIndex]?.scrollIntoView({
        block: 'nearest',
      });
    }
  }, [selectedIndex]);

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={value}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsOpen(true)}
          onBlur={() => {
            // Delay hiding to allow clicks on suggestions
            setTimeout(() => setIsOpen(false), 150);
          }}
          placeholder={placeholder}
          className={cn("pl-10 pr-10", className)}
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && (suggestions.length > 0 || error) && (
        <div className="absolute z-50 w-full mt-1 bg-popover border border-border rounded-md shadow-lg max-h-60 overflow-y-auto">
          {error ? (
            <div className="flex items-center gap-3 px-3 py-4 text-destructive">
              <div className="text-sm">{error}</div>
            </div>
          ) : (
            suggestions.map((suggestion, index) => (
              <div
                key={suggestion.place_id}
                ref={el => suggestionRefs.current[index] = el}
                className={cn(
                  "flex items-start gap-3 px-3 py-2 cursor-pointer hover:bg-accent transition-colors border-b border-border/50 last:border-b-0",
                  selectedIndex === index && "bg-accent"
                )}
                onClick={() => handleSuggestionClick(suggestion)}
              >
                <MapPin className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {suggestion.display_name.split(',')[0]}
                  </div>
                  <div className="text-xs text-muted-foreground truncate">
                    {suggestion.display_name.split(',').slice(1).join(',').trim()}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export default LocationAutocomplete;