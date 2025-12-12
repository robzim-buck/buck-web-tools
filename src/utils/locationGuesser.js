// Location mapping based on global studio/production locations
export const locationDatabase = {
  // Major VFX/Animation Studio Hubs - Global

  // United Kingdom
  'lon': { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
  'london': { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
  'lhr': { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
  'uk': { name: 'London, UK', lat: 51.5074, lng: -0.1278 },
  'soho': { name: 'Soho, London', lat: 51.5137, lng: -0.1360 },
  'pinewood': { name: 'Pinewood Studios, UK', lat: 51.5489, lng: -0.5344 },
  'shepperton': { name: 'Shepperton Studios, UK', lat: 51.4058, lng: -0.4619 },

  // Canada - Major VFX Hub
  'van': { name: 'Vancouver, Canada', lat: 49.2827, lng: -123.1207 },
  'vancouver': { name: 'Vancouver, Canada', lat: 49.2827, lng: -123.1207 },
  'yvr': { name: 'Vancouver, Canada', lat: 49.2827, lng: -123.1207 },
  'tor': { name: 'Toronto, Canada', lat: 43.6532, lng: -79.3832 },
  'toronto': { name: 'Toronto, Canada', lat: 43.6532, lng: -79.3832 },
  'yyz': { name: 'Toronto, Canada', lat: 43.6532, lng: -79.3832 },
  'mtl': { name: 'Montreal, Canada', lat: 45.5017, lng: -73.5673 },
  'montreal': { name: 'Montreal, Canada', lat: 45.5017, lng: -73.5673 },

  // Australia & New Zealand
  'syd': { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093 },
  'sydney': { name: 'Sydney, Australia', lat: -33.8688, lng: 151.2093 },
  'mel': { name: 'Melbourne, Australia', lat: -37.8136, lng: 144.9631 },
  'melbourne': { name: 'Melbourne, Australia', lat: -37.8136, lng: 144.9631 },
  'adl': { name: 'Adelaide, Australia', lat: -34.9285, lng: 138.6007 },
  'adelaide': { name: 'Adelaide, Australia', lat: -34.9285, lng: 138.6007 },
  'bne': { name: 'Brisbane, Australia', lat: -27.4698, lng: 153.0251 },
  'brisbane': { name: 'Brisbane, Australia', lat: -27.4698, lng: 153.0251 },
  'wlg': { name: 'Wellington, NZ', lat: -41.2866, lng: 174.7756 },
  'wellington': { name: 'Wellington, NZ', lat: -41.2866, lng: 174.7756 },
  'nz': { name: 'Wellington, NZ', lat: -41.2866, lng: 174.7756 },
  'akl': { name: 'Auckland, NZ', lat: -36.8509, lng: 174.7645 },
  'auckland': { name: 'Auckland, NZ', lat: -36.8509, lng: 174.7645 },

  // India - Growing VFX Hub
  'mum': { name: 'Mumbai, India', lat: 19.0760, lng: 72.8777 },
  'mumbai': { name: 'Mumbai, India', lat: 19.0760, lng: 72.8777 },
  'bom': { name: 'Mumbai, India', lat: 19.0760, lng: 72.8777 },
  'blr': { name: 'Bangalore, India', lat: 12.9716, lng: 77.5946 },
  'bangalore': { name: 'Bangalore, India', lat: 12.9716, lng: 77.5946 },
  'bengaluru': { name: 'Bangalore, India', lat: 12.9716, lng: 77.5946 },
  'hyd': { name: 'Hyderabad, India', lat: 17.3850, lng: 78.4867 },
  'hyderabad': { name: 'Hyderabad, India', lat: 17.3850, lng: 78.4867 },
  'chennai': { name: 'Chennai, India', lat: 13.0827, lng: 80.2707 },
  'maa': { name: 'Chennai, India', lat: 13.0827, lng: 80.2707 },
  'pune': { name: 'Pune, India', lat: 18.5204, lng: 73.8567 },

  // Europe
  'par': { name: 'Paris, France', lat: 48.8566, lng: 2.3522 },
  'paris': { name: 'Paris, France', lat: 48.8566, lng: 2.3522 },
  'cdg': { name: 'Paris, France', lat: 48.8566, lng: 2.3522 },
  'ber': { name: 'Berlin, Germany', lat: 52.5200, lng: 13.4050 },
  'berlin': { name: 'Berlin, Germany', lat: 52.5200, lng: 13.4050 },
  'muc': { name: 'Munich, Germany', lat: 48.1351, lng: 11.5820 },
  'munich': { name: 'Munich, Germany', lat: 48.1351, lng: 11.5820 },
  'ams': { name: 'Amsterdam, Netherlands', lat: 52.3676, lng: 4.9041 },
  'amsterdam': { name: 'Amsterdam, Netherlands', lat: 52.3676, lng: 4.9041 },
  'mad': { name: 'Madrid, Spain', lat: 40.4168, lng: -3.7038 },
  'madrid': { name: 'Madrid, Spain', lat: 40.4168, lng: -3.7038 },
  'bcn': { name: 'Barcelona, Spain', lat: 41.3851, lng: 2.1734 },
  'barcelona': { name: 'Barcelona, Spain', lat: 41.3851, lng: 2.1734 },
  'dub': { name: 'Dublin, Ireland', lat: 53.3498, lng: -6.2603 },
  'dublin': { name: 'Dublin, Ireland', lat: 53.3498, lng: -6.2603 },
  'pra': { name: 'Prague, Czech Republic', lat: 50.0755, lng: 14.4378 },
  'prague': { name: 'Prague, Czech Republic', lat: 50.0755, lng: 14.4378 },
  'bud': { name: 'Budapest, Hungary', lat: 47.4979, lng: 19.0402 },
  'budapest': { name: 'Budapest, Hungary', lat: 47.4979, lng: 19.0402 },
  'sto': { name: 'Stockholm, Sweden', lat: 59.3293, lng: 18.0686 },
  'stockholm': { name: 'Stockholm, Sweden', lat: 59.3293, lng: 18.0686 },

  // Asia
  'sin': { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  'singapore': { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  'sgp': { name: 'Singapore', lat: 1.3521, lng: 103.8198 },
  'tyo': { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
  'tokyo': { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
  'nrt': { name: 'Tokyo, Japan', lat: 35.6762, lng: 139.6503 },
  'hkg': { name: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
  'hongkong': { name: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
  'hk': { name: 'Hong Kong', lat: 22.3193, lng: 114.1694 },
  'sel': { name: 'Seoul, South Korea', lat: 37.5665, lng: 126.9780 },
  'seoul': { name: 'Seoul, South Korea', lat: 37.5665, lng: 126.9780 },
  'icn': { name: 'Seoul, South Korea', lat: 37.5665, lng: 126.9780 },
  'sha': { name: 'Shanghai, China', lat: 31.2304, lng: 121.4737 },
  'shanghai': { name: 'Shanghai, China', lat: 31.2304, lng: 121.4737 },
  'bej': { name: 'Beijing, China', lat: 39.9042, lng: 116.4074 },
  'beijing': { name: 'Beijing, China', lat: 39.9042, lng: 116.4074 },
  'pek': { name: 'Beijing, China', lat: 39.9042, lng: 116.4074 },
  'tpe': { name: 'Taipei, Taiwan', lat: 25.0330, lng: 121.5654 },
  'taipei': { name: 'Taipei, Taiwan', lat: 25.0330, lng: 121.5654 },
  'bkk': { name: 'Bangkok, Thailand', lat: 13.7563, lng: 100.5018 },
  'bangkok': { name: 'Bangkok, Thailand', lat: 13.7563, lng: 100.5018 },
  'kul': { name: 'Kuala Lumpur, Malaysia', lat: 3.1390, lng: 101.6869 },
  'kualalumpur': { name: 'Kuala Lumpur, Malaysia', lat: 3.1390, lng: 101.6869 },

  // USA - West Coast (Hollywood/VFX)
  'lax': { name: 'Los Angeles, USA', lat: 34.0522, lng: -118.2437 },
  'la': { name: 'Los Angeles, USA', lat: 34.0522, lng: -118.2437 },
  'losangeles': { name: 'Los Angeles, USA', lat: 34.0522, lng: -118.2437 },
  'hollywood': { name: 'Hollywood, USA', lat: 34.0928, lng: -118.3287 },
  'burbank': { name: 'Burbank, USA', lat: 34.1808, lng: -118.3090 },
  'culver': { name: 'Culver City, USA', lat: 34.0211, lng: -118.3965 },
  'sfo': { name: 'San Francisco, USA', lat: 37.7749, lng: -122.4194 },
  'sf': { name: 'San Francisco, USA', lat: 37.7749, lng: -122.4194 },
  'sanfrancisco': { name: 'San Francisco, USA', lat: 37.7749, lng: -122.4194 },
  'emeryville': { name: 'Emeryville, USA', lat: 37.8313, lng: -122.2852 },
  'sea': { name: 'Seattle, USA', lat: 47.6062, lng: -122.3321 },
  'seattle': { name: 'Seattle, USA', lat: 47.6062, lng: -122.3321 },
  'pdx': { name: 'Portland, USA', lat: 45.5152, lng: -122.6784 },
  'portland': { name: 'Portland, USA', lat: 45.5152, lng: -122.6784 },

  // USA - Other
  'nyc': { name: 'New York, USA', lat: 40.7128, lng: -74.0060 },
  'ny': { name: 'New York, USA', lat: 40.7128, lng: -74.0060 },
  'newyork': { name: 'New York, USA', lat: 40.7128, lng: -74.0060 },
  'atl': { name: 'Atlanta, USA', lat: 33.7490, lng: -84.3880 },
  'atlanta': { name: 'Atlanta, USA', lat: 33.7490, lng: -84.3880 },
  'aus': { name: 'Austin, USA', lat: 30.2672, lng: -97.7431 },
  'austin': { name: 'Austin, USA', lat: 30.2672, lng: -97.7431 },
  'chi': { name: 'Chicago, USA', lat: 41.8781, lng: -87.6298 },
  'chicago': { name: 'Chicago, USA', lat: 41.8781, lng: -87.6298 },

  // Latin America
  'mex': { name: 'Mexico City, Mexico', lat: 19.4326, lng: -99.1332 },
  'mexico': { name: 'Mexico City, Mexico', lat: 19.4326, lng: -99.1332 },
  'cdmx': { name: 'Mexico City, Mexico', lat: 19.4326, lng: -99.1332 },
  'gru': { name: 'São Paulo, Brazil', lat: -23.5505, lng: -46.6333 },
  'saopaulo': { name: 'São Paulo, Brazil', lat: -23.5505, lng: -46.6333 },
  'sao': { name: 'São Paulo, Brazil', lat: -23.5505, lng: -46.6333 },
  'bue': { name: 'Buenos Aires, Argentina', lat: -34.6037, lng: -58.3816 },
  'buenosaires': { name: 'Buenos Aires, Argentina', lat: -34.6037, lng: -58.3816 },
  'bog': { name: 'Bogotá, Colombia', lat: 4.7110, lng: -74.0721 },
  'bogota': { name: 'Bogotá, Colombia', lat: 4.7110, lng: -74.0721 },

  // Middle East & Africa
  'dxb': { name: 'Dubai, UAE', lat: 25.2048, lng: 55.2708 },
  'dubai': { name: 'Dubai, UAE', lat: 25.2048, lng: 55.2708 },
  'auh': { name: 'Abu Dhabi, UAE', lat: 24.4539, lng: 54.3773 },
  'abudhabi': { name: 'Abu Dhabi, UAE', lat: 24.4539, lng: 54.3773 },
  'cpt': { name: 'Cape Town, South Africa', lat: -33.9249, lng: 18.4241 },
  'capetown': { name: 'Cape Town, South Africa', lat: -33.9249, lng: 18.4241 },
  'jnb': { name: 'Johannesburg, South Africa', lat: -26.2041, lng: 28.0473 },
  'johannesburg': { name: 'Johannesburg, South Africa', lat: -26.2041, lng: 28.0473 },

  // Generic/Regional terms
  'apac': { name: 'Asia Pacific', lat: 1.3521, lng: 103.8198 },
  'asia': { name: 'Asia', lat: 35.6762, lng: 139.6503 },
  'emea': { name: 'EMEA (London)', lat: 51.5074, lng: -0.1278 },
  'eu': { name: 'Europe', lat: 50.1109, lng: 8.6821 },
  'europe': { name: 'Europe', lat: 50.1109, lng: 8.6821 },
  'na': { name: 'North America', lat: 34.0522, lng: -118.2437 },
  'us': { name: 'USA', lat: 34.0522, lng: -118.2437 },
  'usa': { name: 'USA', lat: 34.0522, lng: -118.2437 },
  'latam': { name: 'Latin America', lat: -23.5505, lng: -46.6333 },
  'anz': { name: 'Australia/NZ', lat: -33.8688, lng: 151.2093 },

  // Studio-specific terms
  'hq': { name: 'Headquarters', lat: 34.0522, lng: -118.2437 },
  'main': { name: 'Main Studio', lat: 34.0522, lng: -118.2437 },
  'primary': { name: 'Primary Site', lat: 34.0522, lng: -118.2437 },
  'backup': { name: 'Backup Site', lat: 34.0522, lng: -118.2437 },
  'dr': { name: 'Disaster Recovery', lat: 34.0522, lng: -118.2437 },
  'prod': { name: 'Production', lat: 34.0522, lng: -118.2437 },
  'render': { name: 'Render Farm', lat: 34.0522, lng: -118.2437 },
  'farm': { name: 'Render Farm', lat: 34.0522, lng: -118.2437 },
};

/**
 * Guess a location from a name string by matching against known location keywords
 * @param {string} name - The name to parse for location hints
 * @param {object} options - Optional configuration
 * @param {object} options.defaultLocation - Default location if no match found
 * @returns {object|null} Location object with { name, lat, lng, confidence }
 */
export const guessLocationFromName = (name, options = {}) => {
  if (!name) return null;

  const {
    defaultLocation = { name: 'Unknown Location', lat: 39.8283, lng: -98.5795 }
  } = options;

  const nameLower = name.toLowerCase();

  // Check for exact matches first
  for (const [key, location] of Object.entries(locationDatabase)) {
    if (nameLower === key) {
      return { ...location, confidence: 'high' };
    }
  }

  // Check for partial matches
  for (const [key, location] of Object.entries(locationDatabase)) {
    if (nameLower.includes(key) || key.includes(nameLower)) {
      return { ...location, confidence: 'medium' };
    }
  }

  // Check for word boundary matches (e.g., "buck-lax-01" should match "lax")
  const words = nameLower.split(/[-_\s.]+/);
  for (const word of words) {
    if (locationDatabase[word]) {
      return { ...locationDatabase[word], confidence: 'medium' };
    }
  }

  // Default to provided or standard default location if no match found
  return { ...defaultLocation, confidence: 'low' };
};

/**
 * Get all unique locations from an array of items
 * @param {array} items - Array of items with a name property
 * @param {string} nameField - The field name containing the name to parse (default: 'name')
 * @returns {array} Array of unique locations with counts
 */
export const getUniqueLocations = (items, nameField = 'name') => {
  if (!items || !Array.isArray(items)) return [];

  const locationCounts = {};

  items.forEach(item => {
    const location = guessLocationFromName(item[nameField]);
    if (location) {
      const key = `${location.lat},${location.lng}`;
      if (!locationCounts[key]) {
        locationCounts[key] = {
          ...location,
          count: 0,
          items: []
        };
      }
      locationCounts[key].count++;
      locationCounts[key].items.push(item);
    }
  });

  return Object.values(locationCounts).sort((a, b) => b.count - a.count);
};

/**
 * Add location data to an array of items
 * @param {array} items - Array of items to enrich with location data
 * @param {string} nameField - The field name containing the name to parse (default: 'name')
 * @param {string} locationField - The field name to store the location (default: 'guessedLocation')
 * @returns {array} Array of items with added location data
 */
export const enrichWithLocations = (items, nameField = 'name', locationField = 'guessedLocation') => {
  if (!items || !Array.isArray(items)) return [];

  return items.map(item => ({
    ...item,
    [locationField]: guessLocationFromName(item[nameField])
  }));
};
