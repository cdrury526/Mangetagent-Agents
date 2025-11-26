import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { parseGooglePlacesAddress, generateSessionToken } from '../../utils/addressParser';

interface Suggestion {
  placeId: string;
  text: string;
  structuredFormat?: {
    mainText: string;
    secondaryText: string;
  };
}

interface AddressData {
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
}

interface AddressAutocompleteProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onAddressSelect?: (address: AddressData) => void;
  required?: boolean;
  error?: string;
  helperText?: string;
  placeholder?: string;
}

// Google Places API types
interface GooglePlacePrediction {
  placePrediction?: {
    placeId: string;
    text?: { text?: string };
    structuredFormat?: {
      mainText?: { text?: string };
      secondaryText?: { text?: string };
    };
  };
}

export const AddressAutocomplete = forwardRef<HTMLInputElement, AddressAutocompleteProps>(
  ({ label, value, onChange, onAddressSelect, required, error, helperText, placeholder }, ref) => {
    const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
    const [loading, setLoading] = useState(false);
    const [showDropdown, setShowDropdown] = useState(false);
    const [sessionToken, setSessionToken] = useState(generateSessionToken());
    const [selectedIndex, setSelectedIndex] = useState(-1);
    const inputRef = useRef<HTMLInputElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const debounceTimeout = useRef<NodeJS.Timeout | null>(null);
    const abortController = useRef<AbortController | null>(null);

    useImperativeHandle(ref, () => inputRef.current!);

    useEffect(() => {
      const handleClickOutside = (event: MouseEvent) => {
        if (
          dropdownRef.current &&
          !dropdownRef.current.contains(event.target as Node) &&
          !inputRef.current?.contains(event.target as Node)
        ) {
          setShowDropdown(false);
        }
      };

      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSuggestions = async (input: string) => {
      // Try both VITE_ prefixed and non-prefixed keys for compatibility
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

      if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
        console.warn('Google Maps API key not configured');
        return;
      }

      if (input.length < 3) {
        setSuggestions([]);
        return;
      }

      if (abortController.current) {
        abortController.current.abort();
      }

      abortController.current = new AbortController();

      try {
        setLoading(true);

        const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'suggestions.placePrediction.placeId,suggestions.placePrediction.text,suggestions.placePrediction.structuredFormat',
          },
          body: JSON.stringify({
            input,
            sessionToken,
            includedRegionCodes: ['us'],
            languageCode: 'en',
          }),
          signal: abortController.current.signal,
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const predictions = data.suggestions || [];

        const formattedSuggestions: Suggestion[] = predictions
          .filter((s: GooglePlacePrediction) => s.placePrediction)
          .map((s: GooglePlacePrediction) => ({
            placeId: s.placePrediction?.placeId || '',
            text: s.placePrediction?.text?.text || '',
            structuredFormat: s.placePrediction?.structuredFormat
              ? {
                  mainText: s.placePrediction.structuredFormat.mainText?.text || '',
                  secondaryText: s.placePrediction.structuredFormat.secondaryText?.text || '',
                }
              : undefined,
          }));

        setSuggestions(formattedSuggestions);
        setShowDropdown(formattedSuggestions.length > 0);
        setSelectedIndex(-1);
      } catch (err: unknown) {
        if (err instanceof Error && err.name !== 'AbortError') {
          console.error('Error fetching address suggestions:', err);
          setSuggestions([]);
        }
      } finally {
        setLoading(false);
      }
    };

    const fetchPlaceDetails = async (placeId: string) => {
      // Try both VITE_ prefixed and non-prefixed keys for compatibility
      const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || import.meta.env.VITE_GOOGLE_PLACES_API_KEY;

      if (!apiKey || apiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
        return;
      }

      try {
        const response = await fetch(`https://places.googleapis.com/v1/places/${placeId}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'X-Goog-Api-Key': apiKey,
            'X-Goog-FieldMask': 'addressComponents',
          },
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const data = await response.json();
        const addressComponents = data.addressComponents || [];
        const parsed = parseGooglePlacesAddress(addressComponents);

        if (onAddressSelect) {
          onAddressSelect(parsed);
        }

        setSessionToken(generateSessionToken());
      } catch (err) {
        console.error('Error fetching place details:', err);
      }
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);

      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }

      debounceTimeout.current = setTimeout(() => {
        fetchSuggestions(newValue);
      }, 300);
    };

    const handleSelectSuggestion = (suggestion: Suggestion) => {
      onChange(suggestion.structuredFormat?.mainText || suggestion.text);
      fetchPlaceDetails(suggestion.placeId);
      setShowDropdown(false);
      setSuggestions([]);
      setSelectedIndex(-1);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (!showDropdown || suggestions.length === 0) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev < suggestions.length - 1 ? prev + 1 : prev));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
          break;
        case 'Enter':
          e.preventDefault();
          if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
            handleSelectSuggestion(suggestions[selectedIndex]);
          }
          break;
        case 'Escape':
          setShowDropdown(false);
          setSelectedIndex(-1);
          break;
      }
    };

    return (
      <div className="relative">
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
        <div className="relative">
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <MapPin className="w-5 h-5" />
            )}
          </div>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setShowDropdown(true)}
            required={required}
            placeholder={placeholder || 'Start typing an address...'}
            className={`w-full pl-10 pr-3 py-2 border rounded-lg text-sm transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              error
                ? 'border-red-300 bg-red-50'
                : 'border-gray-300 bg-white hover:border-gray-400'
            }`}
          />
        </div>

        {showDropdown && suggestions.length > 0 && (
          <div
            ref={dropdownRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-auto"
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion.placeId}
                type="button"
                onClick={() => handleSelectSuggestion(suggestion)}
                className={`w-full text-left px-4 py-3 hover:bg-blue-50 transition-colors border-b border-gray-100 last:border-b-0 ${
                  index === selectedIndex ? 'bg-blue-50' : ''
                }`}
              >
                {suggestion.structuredFormat ? (
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {suggestion.structuredFormat.mainText}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">
                      {suggestion.structuredFormat.secondaryText}
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-gray-900">{suggestion.text}</div>
                )}
              </button>
            ))}
          </div>
        )}

        {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        {helperText && !error && <p className="mt-1 text-xs text-gray-500">{helperText}</p>}
      </div>
    );
  }
);

AddressAutocomplete.displayName = 'AddressAutocomplete';
