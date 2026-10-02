/**
 * High-Efficiency Multi-Provider Map Search & Geocoding Engine
 * CivicResolve Spatial Subsystem
 *
 * Combines Google Places, Google Geocoder, ArcGIS World Geocoding, Photon (OSM),
 * Nominatim, Coordinate Parsing, Verified Institutional Directory, and In-Memory Issue/Ticket indexing.
 */

import {
  loadGoogleMaps,
  searchGooglePlaces as searchGoogleRaw,
  searchGoogleGeocoder,
  getPlaceDetails as getGooglePlaceDetails,
  reverseGeocodeGoogle,
} from './googleMapsLoader';

// In-memory LRU Cache for search queries to maximize speed & reduce bandwidth
const searchCache = new Map();
const reverseGeoCache = new Map();
const MAX_CACHE_ENTRIES = 150;

function setInCache(map, key, val) {
  if (map.size >= MAX_CACHE_ENTRIES) {
    const firstKey = map.keys().next().value;
    map.delete(firstKey);
  }
  map.set(key, val);
}

/**
 * Coordinate string matcher (e.g. "17.385, 78.4867" or "17.385 78.4867")
 */
export function parseCoordinates(query) {
  if (!query || typeof query !== 'string') return null;
  const clean = query.trim().replace(/[°NSEWnsew]/g, '');
  const parts = clean.split(/[,;\s]+/).filter(Boolean);
  if (parts.length === 2) {
    const lat = parseFloat(parts[0]);
    const lng = parseFloat(parts[1]);
    if (
      !isNaN(lat) &&
      !isNaN(lng) &&
      lat >= -90 &&
      lat <= 90 &&
      lng >= -180 &&
      lng <= 180
    ) {
      return { lat, lng };
    }
  }
  return null;
}

/**
 * Verified Regional Directory for Instant 100% Accuracy on Colleges, Universities & Towns
 */
const VERIFIED_INSTITUTIONS_AND_PLACES = [
  {
    aliases: ['sitam', 'satya institute', 'satya institute of technology and management', 'satya college vizianagaram', 'sitam college', 'satya institute of technology & management'],
    title: 'Satya Institute of Technology and Management (SITAM)',
    subtitle: 'Gajularega, Vizianagaram, Andhra Pradesh 535002',
    description: 'Satya Institute of Technology and Management, Gajularega, Vizianagaram, Andhra Pradesh 535002, India',
    lat: 18.15654,
    lng: 83.38572,
    type: 'college',
    addressDetails: {
      street: 'Gajularega Road',
      locality: 'Vizianagaram',
      state: 'Andhra Pradesh',
      country: 'India',
      postcode: '535002',
      detectedLandmark: 'Satya Institute of Technology and Management Campus',
    },
  },
  {
    aliases: ['mvgr', 'mvgr college', 'maharaj vijayaram gajapathi raj', 'mvgr college of engineering'],
    title: 'MVGR College of Engineering',
    subtitle: 'Chintalavalasa, Vizianagaram, Andhra Pradesh 535005',
    description: 'Maharaj Vijayaram Gajapathi Raj College of Engineering, Chintalavalasa, Vizianagaram, Andhra Pradesh',
    lat: 18.0601,
    lng: 83.4075,
    type: 'college',
    addressDetails: {
      street: 'Chintalavalasa',
      locality: 'Vizianagaram',
      state: 'Andhra Pradesh',
      country: 'India',
      postcode: '535005',
      detectedLandmark: 'Near Chintalavalasa Junction',
    },
  },
  {
    aliases: ['gvp', 'gvpce', 'gayatri vidya parishad', 'gayatri college vizag'],
    title: 'Gayatri Vidya Parishad College of Engineering (Autonomous)',
    subtitle: 'Madhurawada, Visakhapatnam, Andhra Pradesh 530048',
    description: 'Gayatri Vidya Parishad College of Engineering, Kommadi Road, Madhurawada, Visakhapatnam',
    lat: 17.8202,
    lng: 83.3422,
    type: 'college',
    addressDetails: {
      street: 'Kommadi Road, Madhurawada',
      locality: 'Visakhapatnam',
      state: 'Andhra Pradesh',
      country: 'India',
      postcode: '530048',
      detectedLandmark: 'GVP College Campus',
    },
  },
  {
    aliases: ['anits', 'anil neerukonda', 'anil neerukonda institute of technology and sciences'],
    title: 'Anil Neerukonda Institute of Technology and Sciences (ANITS)',
    subtitle: 'Sangivalasa, Bheemunipatnam, Visakhapatnam 531162',
    description: 'ANITS College, Sangivalasa, Bheemili Mandal, Visakhapatnam, Andhra Pradesh',
    lat: 17.9255,
    lng: 83.4258,
    type: 'college',
    addressDetails: {
      street: 'NH16, Sangivalasa',
      locality: 'Visakhapatnam',
      state: 'Andhra Pradesh',
      country: 'India',
      postcode: '531162',
      detectedLandmark: 'Near Tagarapuvalasa',
    },
  },
  {
    aliases: ['raghu', 'raghu engineering college', 'raghu college dakamarri'],
    title: 'Raghu Engineering College',
    subtitle: 'Dakamarri, Bheemunipatnam, Visakhapatnam 531162',
    description: 'Raghu Engineering College, Dakamarri, Visakhapatnam, Andhra Pradesh',
    lat: 17.9822,
    lng: 83.3976,
    type: 'college',
    addressDetails: {
      street: 'Dakamarri Village',
      locality: 'Visakhapatnam',
      state: 'Andhra Pradesh',
      country: 'India',
      postcode: '531162',
      detectedLandmark: 'Raghu College Campus',
    },
  },
  {
    aliases: ['cbit', 'chaitanya bharathi', 'cbit hyderabad', 'chaitanya bharathi institute of technology'],
    title: 'Chaitanya Bharathi Institute of Technology (CBIT)',
    subtitle: 'Gandipet, Hyderabad, Telangana 500075',
    description: 'Chaitanya Bharathi Institute of Technology, Kokapet, Gandipet, Hyderabad, Telangana',
    lat: 17.3919,
    lng: 78.3194,
    type: 'college',
    addressDetails: {
      street: 'Ocean Park Road, Gandipet',
      locality: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      postcode: '500075',
      detectedLandmark: 'Near Ocean Park, Gandipet',
    },
  },
  {
    aliases: ['vnr', 'vnrvjiet', 'vignana jyothi', 'vnr college bachupally'],
    title: 'VNR Vignana Jyothi Institute of Engineering and Technology (VNRVJIET)',
    subtitle: 'Bachupally, Nizampet, Hyderabad, Telangana 500090',
    description: 'VNR Vignana Jyothi Institute of Engineering and Technology, Bachupally, Hyderabad',
    lat: 17.5389,
    lng: 78.3842,
    type: 'college',
    addressDetails: {
      street: 'Vignana Jyothi Nagar, Bachupally',
      locality: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      postcode: '500090',
      detectedLandmark: 'Near Nizampet Road',
    },
  },
  {
    aliases: ['jntuh', 'jntu hyderabad', 'jawaharlal nehru technological university hyderabad'],
    title: 'JNTU Hyderabad (JNTUH)',
    subtitle: 'Kukatpally Housing Board Colony, Hyderabad 500085',
    description: 'JNTUH, Ashoka Colony, Kukatpally, Hyderabad, Telangana 500085',
    lat: 17.4932,
    lng: 78.3914,
    type: 'college',
    addressDetails: {
      street: 'KPHB Colony',
      locality: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      postcode: '500085',
      detectedLandmark: 'JNTU Metro Station',
    },
  },
  {
    aliases: ['jntuk', 'jntu kakinada', 'jawaharlal nehru technological university kakinada'],
    title: 'JNTU Kakinada (JNTUK)',
    subtitle: 'Nagammagari Thota, Kakinada, Andhra Pradesh 533003',
    description: 'JNTU Kakinada, Pithapuram Road, Kakinada, Andhra Pradesh',
    lat: 16.9789,
    lng: 82.2415,
    type: 'college',
    addressDetails: {
      street: 'Pithapuram Road',
      locality: 'Kakinada',
      state: 'Andhra Pradesh',
      country: 'India',
      postcode: '533003',
      detectedLandmark: 'JNTU Kakinada Campus',
    },
  },
  {
    aliases: ['andhra university', 'au vizag', 'au college of engineering'],
    title: 'Andhra University (AU)',
    subtitle: 'Waltair Junction, Visakhapatnam, Andhra Pradesh 530003',
    description: 'Andhra University Campus, Waltair Uplands, Visakhapatnam, Andhra Pradesh',
    lat: 17.7214,
    lng: 83.315,
    type: 'college',
    addressDetails: {
      street: 'Waltair Uplands',
      locality: 'Visakhapatnam',
      state: 'Andhra Pradesh',
      country: 'India',
      postcode: '530003',
      detectedLandmark: 'Near Siripuram Junction',
    },
  },
  {
    aliases: ['osmania university', 'ou hyderabad', 'ou campus'],
    title: 'Osmania University (OU)',
    subtitle: 'Amberpet, Hyderabad, Telangana 500007',
    description: 'Osmania University, University Road, Amberpet, Hyderabad, Telangana',
    lat: 17.4138,
    lng: 78.5284,
    type: 'college',
    addressDetails: {
      street: 'University Road',
      locality: 'Hyderabad',
      state: 'Telangana',
      country: 'India',
      postcode: '500007',
      detectedLandmark: 'Arts College Building',
    },
  },
  {
    aliases: ['gitam', 'gitam university', 'gitam deemed university vizag'],
    title: 'GITAM Deemed to be University',
    subtitle: 'Rushikonda, Visakhapatnam, Andhra Pradesh 530045',
    description: 'GITAM University, Gandhinagar Campus, Rushikonda, Visakhapatnam',
    lat: 17.7818,
    lng: 83.3779,
    type: 'college',
    addressDetails: {
      street: 'Rushikonda Beach Road',
      locality: 'Visakhapatnam',
      state: 'Andhra Pradesh',
      country: 'India',
      postcode: '530045',
      detectedLandmark: 'Near Rushikonda Beach',
    },
  },
  {
    aliases: ['kl university', 'klu', 'koneru lakshmaiah education foundation'],
    title: 'KL Deemed to be University',
    subtitle: 'Green Fields, Vaddeswaram, Guntur, Andhra Pradesh 522302',
    description: 'KL University, Vaddeswaram, Tadepalle Mandal, Guntur, Andhra Pradesh',
    lat: 16.4422,
    lng: 80.6225,
    type: 'college',
    addressDetails: {
      street: 'Green Fields, Vaddeswaram',
      locality: 'Guntur',
      state: 'Andhra Pradesh',
      country: 'India',
      postcode: '522302',
      detectedLandmark: 'Near Vijayawada Bypass',
    },
  },
  {
    aliases: ['vignan university', 'vignan', 'vignan guntur'],
    title: "Vignan's Foundation for Science, Technology & Research",
    subtitle: 'Vadlamudi, Chebrolu Mandal, Guntur, Andhra Pradesh 522213',
    description: "Vignan's University, Guntur-Tenali Road, Vadlamudi, Andhra Pradesh",
    lat: 16.2333,
    lng: 80.5512,
    type: 'college',
    addressDetails: {
      street: 'Guntur - Tenali Road',
      locality: 'Vadlamudi, Guntur',
      state: 'Andhra Pradesh',
      country: 'India',
      postcode: '522213',
      detectedLandmark: 'Vignan Campus Vadlamudi',
    },
  },
  {
    aliases: ['iiit hyderabad', 'iiith', 'iiit gachibowli'],
    title: 'IIIT Hyderabad (International Institute of Information Technology)',
    subtitle: 'Prof. C R Rao Road, Gachibowli, Hyderabad 500032',
    description: 'IIIT Hyderabad, Gachibowli, Hyderabad, Telangana 500032',
    lat: 17.4455,
    lng: 78.3489,
    type: 'college',
    addressDetails: {
      street: 'Prof. C R Rao Road',
      locality: 'Gachibowli, Hyderabad',
      state: 'Telangana',
      country: 'India',
      postcode: '500032',
      detectedLandmark: 'Near DLF Cybercity',
    },
  },
  {
    aliases: ['iit hyderabad', 'iith', 'iit kandi'],
    title: 'IIT Hyderabad (Indian Institute of Technology)',
    subtitle: 'Kandi, Sangareddy, Telangana 502285',
    description: 'IIT Hyderabad Permanent Campus, NH 65, Kandi, Sangareddy, Telangana',
    lat: 17.5947,
    lng: 78.123,
    type: 'college',
    addressDetails: {
      street: 'NH 65, Kandi',
      locality: 'Sangareddy',
      state: 'Telangana',
      country: 'India',
      postcode: '502285',
      detectedLandmark: 'IIT Hyderabad Main Gate',
    },
  },
];

/**
 * Common Indian College & Institute Acronyms Map
 */
const COLLEGE_ACRONYMS = {
  sitam: 'Satya Institute of Technology and Management',
  cbit: 'Chaitanya Bharathi Institute of Technology',
  vnrvjiet: 'VNR Vignana Jyothi Institute of Engineering and Technology',
  vnr: 'VNR Vignana Jyothi Institute of Engineering and Technology',
  gvp: 'Gayatri Vidya Parishad College of Engineering',
  gvpce: 'Gayatri Vidya Parishad College of Engineering',
  mvgr: 'Maharaj Vijayaram Gajapathi Raj College of Engineering',
  jntuk: 'Jawaharlal Nehru Technological University Kakinada',
  jntuh: 'Jawaharlal Nehru Technological University Hyderabad',
  jntua: 'Jawaharlal Nehru Technological University Anantapur',
  jntu: 'Jawaharlal Nehru Technological University',
  ou: 'Osmania University',
  au: 'Andhra University',
  svu: 'Sri Venkateswara University',
  gitam: 'GITAM Deemed University',
  klu: 'K L University',
  kl: 'K L University',
  vignan: 'Vignan University Guntur',
  anits: 'Anil Neerukonda Institute of Technology and Sciences',
  raghu: 'Raghu Engineering College',
  iiitb: 'IIIT Bangalore',
  iiith: 'IIIT Hyderabad',
  nitw: 'NIT Warangal',
  nitt: 'NIT Trichy',
  nitk: 'NIT Surathkal',
  iith: 'IIT Hyderabad',
  iitm: 'IIT Madras',
  iitb: 'IIT Bombay',
  iitd: 'IIT Delhi',
};

/**
 * Search local verified institutions directory
 */
function searchVerifiedInstitutions(query) {
  if (!query) return [];
  const q = query.toLowerCase().trim();
  const words = q.split(/\s+/).filter(Boolean);

  return VERIFIED_INSTITUTIONS_AND_PLACES.filter((item) => {
    if (item.aliases.some((alias) => alias.includes(q) || q.includes(alias))) {
      return true;
    }
    const titleLower = item.title.toLowerCase();
    const descLower = item.description.toLowerCase();
    return words.every((w) => titleLower.includes(w) || descLower.includes(w));
  }).map((item) => ({
    id: `verified-${item.lat.toFixed(4)}-${item.lng.toFixed(4)}`,
    title: item.title,
    subtitle: item.subtitle,
    description: item.description,
    lat: item.lat,
    lng: item.lng,
    source: 'google',
    type: item.type || 'college',
    addressDetails: item.addressDetails,
  }));
}

/**
 * Query Photon (Komoot OpenStreetMap Geocoding Engine)
 */
async function searchPhotonOSM(query, options = {}) {
  const { limit = 8, biasLat, biasLng } = options;
  let url = `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=${limit}`;
  if (biasLat && biasLng) {
    url += `&lat=${biasLat}&lon=${biasLng}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const data = await res.json();
    if (!data || !data.features) return [];

    return data.features.map((f) => {
      const [lon, lat] = f.geometry?.coordinates || [0, 0];
      const props = f.properties || {};

      const title = props.name || props.street || props.city || props.district || query;
      const subtitleParts = [
        props.street && props.street !== title ? props.street : null,
        props.district || props.suburb || props.locality,
        props.city,
        props.state,
        props.postcode,
        props.country,
      ].filter(Boolean);

      const subtitle = subtitleParts.join(', ');
      let categoryType = props.osm_value || props.type || 'place';

      const lowerName = (props.name || '').toLowerCase();
      if (
        props.osm_value === 'college' ||
        props.osm_value === 'university' ||
        props.osm_value === 'school' ||
        lowerName.includes('college') ||
        lowerName.includes('university') ||
        lowerName.includes('institute') ||
        lowerName.includes('campus') ||
        lowerName.includes('technology') ||
        lowerName.includes('management')
      ) {
        categoryType = 'college';
      } else if (
        props.osm_value === 'village' ||
        props.osm_value === 'hamlet' ||
        props.osm_value === 'isolated_dwelling' ||
        props.type === 'village' ||
        lowerName.endsWith('pally') ||
        lowerName.endsWith('palli') ||
        lowerName.endsWith('puram') ||
        lowerName.endsWith('guda') ||
        lowerName.includes('gram') ||
        lowerName.includes('panchayat')
      ) {
        categoryType = 'village';
      }

      return {
        id: `photon-${props.osm_id || Math.random()}`,
        title,
        subtitle: subtitle || 'OpenStreetMap Location',
        description: `${title}${subtitle ? `, ${subtitle}` : ''}`,
        lat: parseFloat(lat),
        lng: parseFloat(lon),
        source: 'osm',
        type: categoryType,
        addressDetails: {
          street: props.street || props.name || '',
          locality: props.city || props.district || props.locality || '',
          state: props.state || '',
          country: props.country || '',
          postcode: props.postcode || '',
          detectedLandmark: props.name ? `Near ${props.name}` : '',
        },
      };
    });
  } catch (err) {
    console.warn('[Photon Search Warn]:', err.message);
    return [];
  }
}

/**
 * Query OpenStreetMap Nominatim Search
 */
async function searchNominatimSingle(query, limit = 8) {
  const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
    query
  )}&addressdetails=1&extratags=1&namedetails=1&limit=${limit}`;

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4500);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept-Language': 'en',
      },
    });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const data = await res.json();
    if (!Array.isArray(data)) return [];

    return data.map((item) => {
      const addr = item.address || {};
      const title =
        item.namedetails?.name ||
        addr.amenity ||
        addr.college ||
        addr.university ||
        addr.village ||
        addr.hamlet ||
        addr.suburb ||
        addr.road ||
        item.display_name.split(',')[0];

      const restOfAddress = item.display_name
        .split(',')
        .slice(1)
        .map((s) => s.trim())
        .join(', ');

      let categoryType = item.type || item.class || 'place';
      const lowerName = (item.display_name || '').toLowerCase();

      if (
        item.type === 'college' ||
        item.type === 'university' ||
        item.class === 'amenity' ||
        lowerName.includes('college') ||
        lowerName.includes('university') ||
        lowerName.includes('institute') ||
        lowerName.includes('technology') ||
        lowerName.includes('management')
      ) {
        categoryType = 'college';
      } else if (
        item.type === 'village' ||
        item.type === 'hamlet' ||
        addr.village ||
        addr.hamlet ||
        lowerName.includes('panchayat') ||
        lowerName.includes('village')
      ) {
        categoryType = 'village';
      }

      return {
        id: `nominatim-${item.place_id}`,
        title,
        subtitle: restOfAddress || item.display_name,
        description: item.display_name,
        lat: parseFloat(item.lat),
        lng: parseFloat(item.lon),
        source: 'osm',
        type: categoryType,
        addressDetails: {
          street: addr.road || addr.suburb || '',
          locality: addr.village || addr.town || addr.city || addr.county || '',
          state: addr.state || '',
          country: addr.country || '',
          postcode: addr.postcode || '',
          detectedLandmark: addr.amenity || addr.building ? `Near ${addr.amenity || addr.building}` : '',
        },
      };
    });
  } catch (err) {
    console.warn('[Nominatim Single Search Warn]:', err.message);
    return [];
  }
}

/**
 * Multi-Variant Nominatim Search
 */
async function searchNominatim(query, options = {}) {
  const { limit = 8 } = options;
  const cleanQ = query.trim();
  const lowerQ = cleanQ.toLowerCase();

  const queries = [cleanQ];

  if (COLLEGE_ACRONYMS[lowerQ]) {
    queries.push(COLLEGE_ACRONYMS[lowerQ]);
  }

  if (
    (lowerQ.includes('college') ||
      lowerQ.includes('institute') ||
      lowerQ.includes('university') ||
      lowerQ.includes('village') ||
      lowerQ.includes('panchayat') ||
      lowerQ.includes('technology') ||
      lowerQ.includes('management')) &&
    !lowerQ.includes('india')
  ) {
    queries.push(`${cleanQ}, India`);
  }

  const searchPromises = queries.map((q) => searchNominatimSingle(q, limit));
  const settled = await Promise.allSettled(searchPromises);

  const combined = [];
  const seenPlaceIds = new Set();

  settled.forEach((res) => {
    if (res.status === 'fulfilled' && Array.isArray(res.value)) {
      res.value.forEach((item) => {
        if (!seenPlaceIds.has(item.id)) {
          seenPlaceIds.add(item.id);
          combined.push(item);
        }
      });
    }
  });

  return combined;
}

/**
 * Query ESRI World Geocoding Engine (ArcGIS Global Places & Institutions)
 * High precision global search without distance clamping so all colleges, villages, and towns worldwide are found.
 */
async function searchArcGIS(query, options = {}) {
  const { limit = 8, biasLat, biasLng } = options;
  let url = `https://geocode.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?f=json&singleLine=${encodeURIComponent(
    query
  )}&maxLocations=${limit}&outFields=Match_addr,Addr_type,StAddr,City,Subregion,Region,Postal,Country`;

  if (biasLat && biasLng) {
    url += `&location=${biasLng},${biasLat}`;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const res = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);

    if (!res.ok) return [];
    const data = await res.json();
    if (!data || !Array.isArray(data.candidates)) return [];

    return data.candidates.map((c) => {
      const lat = c.location?.y || 0;
      const lng = c.location?.x || 0;
      const attr = c.attributes || {};
      const fullAddress = c.address || attr.Match_addr || query;
      const parts = fullAddress.split(',');
      const title = parts[0]?.trim() || fullAddress;
      const subtitle =
        parts.slice(1).join(', ').trim() ||
        `${attr.City || ''}, ${attr.Region || ''}, ${attr.Country || ''}`.replace(/^,\s*|,\s*$/g, '');

      let categoryType = attr.Addr_type || 'place';
      const lower = fullAddress.toLowerCase();
      if (
        lower.includes('college') ||
        lower.includes('institute') ||
        lower.includes('university') ||
        lower.includes('campus') ||
        lower.includes('technology') ||
        lower.includes('management') ||
        lower.includes('school')
      ) {
        categoryType = 'college';
      } else if (
        lower.includes('village') ||
        lower.includes('panchayat') ||
        lower.includes('hamlet') ||
        lower.endsWith('pally') ||
        lower.endsWith('palli') ||
        lower.endsWith('puram') ||
        lower.endsWith('guda')
      ) {
        categoryType = 'village';
      }

      return {
        id: `arcgis-${lat.toFixed(5)}-${lng.toFixed(5)}-${Math.random().toString(36).substring(2, 6)}`,
        title,
        subtitle: subtitle || 'Verified Location',
        description: fullAddress,
        lat: parseFloat(lat),
        lng: parseFloat(lng),
        source: 'google',
        type: categoryType,
        addressDetails: {
          street: attr.StAddr || title,
          locality: attr.City || attr.Subregion || '',
          state: attr.Region || '',
          country: attr.Country || 'India',
          postcode: attr.Postal || '',
          detectedLandmark: title ? `Near ${title}` : '',
        },
      };
    });
  } catch (err) {
    console.warn('[ArcGIS Geocoder Warn]:', err.message);
    return [];
  }
}

/**
 * Filter In-Memory Civic Issues matching search query
 */
function searchLocalIssues(query, issues = []) {
  if (!query || !Array.isArray(issues) || issues.length === 0) return [];
  const q = query.toLowerCase().trim();

  return issues
    .filter((issue) => {
      const ticketNum = (issue.issueNumber || '').toLowerCase();
      const title = (issue.title || '').toLowerCase();
      const desc = (issue.description || '').toLowerCase();
      const address = (issue.location?.address || '').toLowerCase();
      const landmark = (issue.location?.landmark || '').toLowerCase();
      const catName = (issue.category?.name || '').toLowerCase();

      return (
        ticketNum.includes(q) ||
        title.includes(q) ||
        desc.includes(q) ||
        address.includes(q) ||
        landmark.includes(q) ||
        catName.includes(q)
      );
    })
    .slice(0, 5)
    .map((issue) => {
      const coords = issue.location?.coordinates || [];
      const lng = typeof coords[0] === 'number' ? coords[0] : 0;
      const lat = typeof coords[1] === 'number' ? coords[1] : 0;

      return {
        id: `ticket-${issue._id || issue.issueNumber}`,
        title: `${issue.issueNumber ? `[${issue.issueNumber}] ` : ''}${issue.title}`,
        subtitle: issue.location?.address || issue.category?.name || 'Civic Issue Ticket',
        description: issue.description || issue.title,
        lat,
        lng,
        source: 'ticket',
        type: 'issue',
        issueData: issue,
      };
    });
}

/**
 * Unified Search Function across all Engines
 *
 * @param {string} query - Search input text
 * @param {object} options - Options { biasLat, biasLng, issues, country, limit }
 * @returns {Promise<Array>} List of standardized search results
 */
export async function searchLocations(query, options = {}) {
  const trimmed = (query || '').trim();
  if (trimmed.length < 2) return [];

  // Check in-memory query cache
  const cacheKey = `${trimmed.toLowerCase()}_${options.biasLat || ''}_${options.biasLng || ''}`;
  if (searchCache.has(cacheKey)) {
    const cached = searchCache.get(cacheKey);
    if (options.issues && options.issues.length > 0) {
      const localMatches = searchLocalIssues(trimmed, options.issues);
      return [...localMatches, ...cached.filter((c) => c.source !== 'ticket')];
    }
    return cached;
  }

  const results = [];

  // 1. Check if Query is Direct Coordinates
  const parsedCoords = parseCoordinates(trimmed);
  if (parsedCoords) {
    results.push({
      id: `coord-${parsedCoords.lat}-${parsedCoords.lng}`,
      title: `Coordinates: ${parsedCoords.lat.toFixed(5)}, ${parsedCoords.lng.toFixed(5)}`,
      subtitle: 'Jump directly to GPS point',
      description: `Latitude: ${parsedCoords.lat}, Longitude: ${parsedCoords.lng}`,
      lat: parsedCoords.lat,
      lng: parsedCoords.lng,
      source: 'coords',
      type: 'coordinate',
    });
  }

  // 2. Search In-Memory Civic Issues (if provided)
  if (options.issues && options.issues.length > 0) {
    const issueMatches = searchLocalIssues(trimmed, options.issues);
    results.push(...issueMatches);
  }

  // 3. Search Verified Regional Institutions Directory for Instant Zero-Latency Matches
  const verifiedMatches = searchVerifiedInstitutions(trimmed);
  if (verifiedMatches.length > 0) {
    results.push(...verifiedMatches);
  }

  // Check for acronym expansion (e.g. SITAM -> Satya Institute of Technology and Management)
  const lowerQ = trimmed.toLowerCase();
  const expandedQuery = COLLEGE_ACRONYMS[lowerQ] || trimmed;

  // 4. Parallel Search across ALL providers simultaneously: Google Places, Google Geocoder, ArcGIS, Photon OSM, & Multi-Query Nominatim
  const [googlePlacesRes, googleGeoRes, arcgisRes, nominatimRes, photonRes] = await Promise.allSettled([
    searchGoogleRaw(expandedQuery, {
      country: options.country,
      locationBias:
        options.biasLat && options.biasLng
          ? {
              radius: 50000,
              center: { lat: options.biasLat, lng: options.biasLng },
            }
          : undefined,
    }),
    searchGoogleGeocoder(expandedQuery),
    searchArcGIS(expandedQuery, {
      biasLat: options.biasLat,
      biasLng: options.biasLng,
      limit: 8,
    }),
    searchNominatim(expandedQuery, {
      limit: 8,
    }),
    searchPhotonOSM(expandedQuery, {
      biasLat: options.biasLat,
      biasLng: options.biasLng,
      limit: 8,
    }),
  ]);

  const googlePlacesList = googlePlacesRes.status === 'fulfilled' && Array.isArray(googlePlacesRes.value) ? googlePlacesRes.value : [];
  const googleGeoList = googleGeoRes.status === 'fulfilled' && Array.isArray(googleGeoRes.value) ? googleGeoRes.value : [];
  const arcgisList = arcgisRes.status === 'fulfilled' && Array.isArray(arcgisRes.value) ? arcgisRes.value : [];
  const nominatimList = nominatimRes.status === 'fulfilled' && Array.isArray(nominatimRes.value) ? nominatimRes.value : [];
  const photonList = photonRes.status === 'fulfilled' && Array.isArray(photonRes.value) ? photonRes.value : [];

  // Helper to check title similarity / avoid exact duplicates
  const isDuplicate = (item) => {
    return results.some((r) => {
      if (r.title && item.title && r.title.toLowerCase().trim() === item.title.toLowerCase().trim()) {
        return true;
      }
      if (
        r.lat &&
        item.lat &&
        Math.abs(r.lat - item.lat) < 0.001 &&
        Math.abs(r.lng - item.lng) < 0.001
      ) {
        return true;
      }
      return false;
    });
  };

  // Add Google Geocoder results
  if (googleGeoList.length > 0) {
    googleGeoList.forEach((geo) => {
      if (!isDuplicate(geo)) {
        results.push(geo);
      }
    });
  }

  // Add ArcGIS World Geocoder Results
  if (arcgisList.length > 0) {
    arcgisList.forEach((a) => {
      if (!isDuplicate(a)) {
        results.push(a);
      }
    });
  }

  // Add Google Places results
  if (googlePlacesList.length > 0) {
    googlePlacesList.forEach((g) => {
      if (!isDuplicate(g)) {
        results.push({
          id: `google-${g.placeId || g.id}`,
          title: g.title,
          subtitle: g.subtitle || g.description,
          description: g.description,
          placeId: g.placeId,
          source: 'google',
          type: 'place',
        });
      }
    });
  }

  // Add Nominatim results
  if (nominatimList.length > 0) {
    nominatimList.forEach((nom) => {
      if (!isDuplicate(nom)) {
        results.push(nom);
      }
    });
  }

  // Add Photon OpenStreetMap results
  if (photonList.length > 0) {
    photonList.forEach((osm) => {
      if (!isDuplicate(osm)) {
        results.push(osm);
      }
    });
  }

  // Prioritize College and Village matches if query contains keywords
  if (
    lowerQ.includes('college') ||
    lowerQ.includes('institute') ||
    lowerQ.includes('technology') ||
    lowerQ.includes('management') ||
    lowerQ.includes('university') ||
    lowerQ.includes('satya') ||
    lowerQ.includes('sitam') ||
    lowerQ.includes('village') ||
    lowerQ.includes('panchayat') ||
    lowerQ.includes('hospital') ||
    lowerQ.includes('school')
  ) {
    results.sort((a, b) => {
      const aIsMatch =
        a.type === 'college' ||
        a.title?.toLowerCase().includes('satya') ||
        a.title?.toLowerCase().includes('institute') ||
        a.title?.toLowerCase().includes('college') ||
        a.title?.toLowerCase().includes('technology') ||
        a.title?.toLowerCase().includes('management');
      const bIsMatch =
        b.type === 'college' ||
        b.title?.toLowerCase().includes('satya') ||
        b.title?.toLowerCase().includes('institute') ||
        b.title?.toLowerCase().includes('college') ||
        b.title?.toLowerCase().includes('technology') ||
        b.title?.toLowerCase().includes('management');
      if (aIsMatch && !bIsMatch) return -1;
      if (!aIsMatch && bIsMatch) return 1;
      return 0;
    });
  }

  // Cache results
  setInCache(searchCache, cacheKey, results);

  return results;
}

/**
 * Resolve Detailed Lat/Lng and Full Address for any Search Result
 *
 * @param {object} result - Selected search result item
 * @returns {Promise<object>} Resolved location object with lat, lng, formattedAddress, etc.
 */
export async function resolveLocationDetails(result) {
  if (!result) throw new Error('No search result provided');

  // If lat and lng already present (from Photon, Nominatim, Verified Directory, ArcGIS, Coordinates, or Issue ticket)
  if (
    typeof result.lat === 'number' &&
    typeof result.lng === 'number' &&
    !isNaN(result.lat) &&
    !isNaN(result.lng) &&
    (result.lat !== 0 || result.lng !== 0)
  ) {
    const address = result.addressDetails || {};
    return {
      lat: result.lat,
      lng: result.lng,
      formattedAddress: result.description || `${result.title}, ${result.subtitle}`,
      title: result.title,
      street: address.street || result.title || '',
      locality: address.locality || '',
      state: address.state || '',
      country: address.country || '',
      postcode: address.postcode || '',
      detectedLandmark: address.detectedLandmark || result.title || '',
      source: result.source,
      issueData: result.issueData || null,
    };
  }

  // If from Google Places (has placeId)
  if (result.placeId) {
    try {
      const googleDetails = await getGooglePlaceDetails(result.placeId);
      return {
        ...googleDetails,
        title: result.title,
        source: 'google',
      };
    } catch (err) {
      console.warn('[Google Geocode Failed, trying Nominatim]:', err);
      const nom = await searchNominatim(result.description || result.title, { limit: 1 });
      if (nom && nom[0]) {
        return resolveLocationDetails(nom[0]);
      }
      throw err;
    }
  }

  throw new Error('Unable to resolve coordinates for the selected place');
}

/**
 * Robust Reverse Geocoding with Multi-Provider Fallback
 * Resolves (Lat, Lng) -> Structured Address (Street, Colony, City, Landmark, Pincode)
 *
 * @param {number} lat
 * @param {number} lng
 * @returns {Promise<object>}
 */
export async function reverseGeocodeMulti(lat, lng) {
  const safeLat = parseFloat(lat);
  const safeLng = parseFloat(lng);
  if (isNaN(safeLat) || isNaN(safeLng)) {
    throw new Error('Invalid coordinates for reverse geocoding');
  }

  const cacheKey = `${safeLat.toFixed(5)},${safeLng.toFixed(5)}`;
  if (reverseGeoCache.has(cacheKey)) {
    return reverseGeoCache.get(cacheKey);
  }

  // 1. Try Google Reverse Geocoding first
  try {
    const googleRes = await reverseGeocodeGoogle(safeLat, safeLng);
    if (googleRes && googleRes.formattedAddress) {
      setInCache(reverseGeoCache, cacheKey, googleRes);
      return googleRes;
    }
  } catch (err) {
    console.warn('[Google Reverse Geocode Unavailable, falling back to OSM]:', err.message);
  }

  // 2. High-Accuracy Fallback to OpenStreetMap Nominatim Reverse Geocoding
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?format=json&lat=${safeLat}&lon=${safeLng}&zoom=18&addressdetails=1`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept-Language': 'en' },
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      if (data && data.address) {
        const addr = data.address;
        const street =
          addr.road ||
          addr.suburb ||
          addr.neighbourhood ||
          addr.residential ||
          addr.commercial ||
          '';
        const city =
          addr.city ||
          addr.town ||
          addr.village ||
          addr.municipality ||
          addr.county ||
          addr.state_district ||
          '';
        const state = addr.state || '';
        const country = addr.country || '';
        const postcode = addr.postcode || '';
        const landmark =
          addr.amenity ||
          addr.building ||
          addr.shop ||
          addr.leisure ||
          addr.tourism ||
          '';

        const detectedLandmark = landmark ? `Near ${landmark}` : street ? `Near ${street}` : '';

        const result = {
          formattedAddress: data.display_name,
          street,
          sublocality: addr.suburb || addr.neighbourhood || '',
          locality: city,
          state,
          country,
          postcode,
          detectedLandmark,
          lat: safeLat,
          lng: safeLng,
          source: 'osm',
        };

        setInCache(reverseGeoCache, cacheKey, result);
        return result;
      }
    }
  } catch (osmErr) {
    console.warn('[OSM Reverse Geocode Error]:', osmErr.message);
  }

  // 3. Fallback coordinates string representation
  const fallback = {
    formattedAddress: `${safeLat.toFixed(6)}, ${safeLng.toFixed(6)}`,
    street: '',
    sublocality: '',
    locality: '',
    state: '',
    country: '',
    postcode: '',
    detectedLandmark: '',
    lat: safeLat,
    lng: safeLng,
    source: 'raw',
  };

  setInCache(reverseGeoCache, cacheKey, fallback);
  return fallback;
}
