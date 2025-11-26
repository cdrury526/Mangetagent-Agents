interface ParsedAddress {
  streetAddress: string;
  city: string;
  state: string;
  zip: string;
}

interface GoogleAddressComponent {
  types: string[];
  long_name?: string;
  short_name?: string;
  longText?: string;
  shortText?: string;
}

export function parseGooglePlacesAddress(addressComponents: GoogleAddressComponent[]): ParsedAddress {
  const result: ParsedAddress = {
    streetAddress: '',
    city: '',
    state: '',
    zip: '',
  };

  if (!addressComponents || addressComponents.length === 0) {
    console.error('No address components received');
    return result;
  }

  let streetNumber = '';
  let route = '';

  console.log('Parsing address components:', addressComponents);

  for (const component of addressComponents) {
    const types = component.types || [];
    console.log('Component:', JSON.stringify(component));

    if (types.includes('street_number')) {
      streetNumber = component.longText || component.long_name || '';
      console.log('Found street number:', streetNumber);
    } else if (types.includes('route')) {
      route = component.longText || component.long_name || '';
      console.log('Found route:', route);
    } else if (types.includes('locality')) {
      result.city = component.longText || component.long_name || '';
      console.log('Found city:', result.city);
    } else if (types.includes('administrative_area_level_1')) {
      result.state = component.shortText || component.short_name || '';
      console.log('Found state:', result.state);
    } else if (types.includes('postal_code')) {
      result.zip = component.longText || component.long_name || '';
      console.log('Found zip:', result.zip);
    }
  }

  if (streetNumber && route) {
    result.streetAddress = `${streetNumber} ${route}`;
  } else if (route) {
    result.streetAddress = route;
  }

  console.log('Final parsed result:', result);
  return result;
}

export function generateSessionToken(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}
