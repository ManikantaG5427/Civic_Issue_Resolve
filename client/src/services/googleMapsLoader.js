/**
 * Google Maps API & Places Autocomplete Loader
 * CivicResolve Full-Stack Spatial System
 */

let googleMapsPromise = null;

/**
 * Checks if a valid Google Maps API key is configured
 */
export const getGoogleMapsApiKey = () => {
  return import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';
};

export const hasGoogleMapsKey = () => {
  const key = getGoogleMapsApiKey();
  return Boolean(key && key.trim().length > 5 && !key.includes('YOUR_'));
};

/**
 * Loads the Google Maps JavaScript API with Places and Geometry libraries
 */
export const loadGoogleMaps = () => {
  if (typeof window === 'undefined') return Promise.reject(new Error('Window not defined'));

  if (window.google && window.google.maps) {
    return Promise.resolve(window.google.maps);
  }

  if (googleMapsPromise) {
    return googleMapsPromise;
  }

  const apiKey = getGoogleMapsApiKey();

  googleMapsPromise = new Promise((resolve, reject) => {
    const existingScript = document.getElementById('google-maps-script');
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(window.google.maps));
      existingScript.addEventListener('error', (err) => reject(err));
      return;
    }

    const script = document.createElement('script');
    script.id = 'google-maps-script';
    script.type = 'text/javascript';
    script.async = true;
    script.defer = true;
    
    // If API key is present, use key; else load without key for development/eval if permitted
    const keyParam = apiKey ? `&key=${encodeURIComponent(apiKey)}` : '';
    script.src = `https://maps.googleapis.com/maps/api/js?libraries=places,geometry${keyParam}&v=weekly`;

    script.onload = () => {
      if (window.google && window.google.maps) {
        resolve(window.google.maps);
      } else {
        reject(new Error('Google Maps SDK loaded but window.google.maps is undefined'));
      }
    };

    script.onerror = (error) => {
      console.warn('[Google Maps] Failed to load Google Maps SDK:', error);
      reject(error);
    };

    document.head.appendChild(script);
  });

  return googleMapsPromise;
};

/**
 * Perform Google Places Autocomplete Query
 */
export const searchGooglePlaces = async (input, options = {}) => {
  try {
    const maps = await loadGoogleMaps();
    if (!maps || !maps.places) return [];

    const autocompleteService = new maps.places.AutocompleteService();
    
    return new Promise((resolve) => {
      autocompleteService.getPlacePredictions(
        {
          input,
          componentRestrictions: options.country ? { country: options.country } : undefined,
          ...options,
        },
        (predictions, status) => {
          if (status === maps.places.PlacesServiceStatus.OK && predictions) {
            resolve(
              predictions.map((p) => ({
                id: p.place_id,
                title: p.structured_formatting?.main_text || p.description,
                subtitle: p.structured_formatting?.secondary_text || '',
                description: p.description,
                placeId: p.place_id,
                source: 'google',
              }))
            );
          } else {
            resolve([]);
          }
        }
      );
    });
  } catch (err) {
    console.warn('[Google Maps Autocomplete Error]:', err);
    return [];
  }
};

/**
 * Perform Google Geocoder Forward Search (Finds any place worldwide by address string)
 */
export const searchGoogleGeocoder = async (input) => {
  try {
    const maps = await loadGoogleMaps();
    if (!maps || !maps.Geocoder) return [];

    const geocoder = new maps.Geocoder();
    return new Promise((resolve) => {
      geocoder.geocode({ address: input }, (results, status) => {
        if (status === maps.GeocoderStatus.OK && results && results.length > 0) {
          resolve(
            results.map((res) => {
              const lat = res.geometry.location.lat();
              const lng = res.geometry.location.lng();
              const parsed = extractGoogleAddressDetails(res);
              const parts = res.formatted_address.split(',');
              const title = parts[0]?.trim() || res.formatted_address;
              const subtitle = parts.slice(1).join(', ').trim();
              return {
                id: `google-geo-${res.place_id || Math.random()}`,
                title,
                subtitle,
                description: res.formatted_address,
                lat,
                lng,
                source: 'google',
                type: 'place',
                addressDetails: parsed,
              };
            })
          );
        } else {
          resolve([]);
        }
      });
    });
  } catch (err) {
    return [];
  }
};

/**
 * Fetch Coordinates and Detailed Address from Google Place ID or Text
 */
export const getPlaceDetails = async (placeId) => {
  try {
    const maps = await loadGoogleMaps();
    const geocoder = new maps.Geocoder();

    return new Promise((resolve, reject) => {
      geocoder.geocode({ placeId }, (results, status) => {
        if (status === maps.GeocoderStatus.OK && results && results[0]) {
          const res = results[0];
          const lat = res.geometry.location.lat();
          const lng = res.geometry.location.lng();
          const address = extractGoogleAddressDetails(res);
          resolve({
            lat,
            lng,
            formattedAddress: res.formatted_address,
            ...address,
          });
        } else {
          reject(new Error(`Geocoding failed with status: ${status}`));
        }
      });
    });
  } catch (err) {
    return Promise.reject(err);
  }
};

/**
 * Reverse Geocode (Lat, Lng) -> Formatted Street, Landmark, Pincode
 */
export const reverseGeocodeGoogle = async (lat, lng) => {
  try {
    const maps = await loadGoogleMaps();
    const geocoder = new maps.Geocoder();
    const latlng = { lat: parseFloat(lat), lng: parseFloat(lng) };

    return new Promise((resolve, reject) => {
      geocoder.geocode({ location: latlng }, (results, status) => {
        if (status === maps.GeocoderStatus.OK && results && results.length > 0) {
          const bestMatch = results[0];
          const parsed = extractGoogleAddressDetails(bestMatch);
          resolve({
            formattedAddress: bestMatch.formatted_address,
            ...parsed,
            lat,
            lng,
          });
        } else {
          reject(new Error(`Reverse geocode failed: ${status}`));
        }
      });
    });
  } catch (err) {
    return Promise.reject(err);
  }
};

/**
 * Helper to parse Google Geocoder address components
 */
function extractGoogleAddressDetails(geocodeResult) {
  const components = geocodeResult.address_components || [];
  let streetNumber = '';
  let route = '';
  let neighborhood = '';
  let sublocality = '';
  let locality = '';
  let state = '';
  let country = '';
  let postalCode = '';
  let landmark = '';

  components.forEach((c) => {
    const types = c.types;
    if (types.includes('street_number')) streetNumber = c.long_name;
    if (types.includes('route')) route = c.long_name;
    if (types.includes('neighborhood')) neighborhood = c.long_name;
    if (types.includes('sublocality') || types.includes('sublocality_level_1')) sublocality = c.long_name;
    if (types.includes('locality')) locality = c.long_name;
    if (types.includes('administrative_area_level_1')) state = c.long_name;
    if (types.includes('country')) country = c.long_name;
    if (types.includes('postal_code')) postalCode = c.long_name;
    if (types.includes('point_of_interest') || types.includes('establishment') || types.includes('premise')) {
      landmark = c.long_name;
    }
  });

  const street = [streetNumber, route].filter(Boolean).join(' ') || sublocality || neighborhood;
  const city = locality || sublocality || neighborhood;
  const detectedLandmark = landmark ? `Near ${landmark}` : street ? `Near ${street}` : '';

  return {
    street,
    sublocality,
    locality: city,
    state,
    country,
    postcode: postalCode,
    detectedLandmark,
    fullComponents: components,
  };
}
