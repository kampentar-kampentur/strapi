"use strict";

/**
 * TVPro Metro Hubs and Service Centers
 * Maximum standard service radius: 55 miles from center.
 */
const METRO_HUBS = [
  {
    slug: "austin",
    name: "Austin",
    state: "TX",
    label: "Austin, TX",
    coords: [{ lat: 30.2672, lng: -97.7431 }],
  },
  {
    slug: "houston",
    name: "Houston",
    state: "TX",
    label: "Houston, TX",
    coords: [{ lat: 29.7604, lng: -95.3698 }],
  },
  {
    slug: "dallas",
    name: "Dallas",
    state: "TX",
    label: "Dallas, TX",
    coords: [
      { lat: 32.7767, lng: -96.797 }, // Dallas
      { lat: 32.7555, lng: -97.3308 }, // Fort Worth
    ],
  },
  {
    slug: "san-antonio",
    name: "San Antonio",
    state: "TX",
    label: "San Antonio, TX",
    coords: [{ lat: 29.4241, lng: -98.4936 }],
  },
  {
    slug: "mcallen",
    name: "McAllen",
    state: "TX",
    label: "McAllen, TX",
    coords: [{ lat: 26.2034, lng: -98.23 }],
  },
  {
    slug: "las-vegas",
    name: "Las Vegas",
    state: "NV",
    label: "Las Vegas, NV",
    coords: [{ lat: 36.1699, lng: -115.1398 }],
  },
  {
    slug: "irvine",
    name: "Irvine",
    state: "CA",
    label: "Irvine, CA",
    coords: [
      { lat: 33.6846, lng: -117.8265 }, // Irvine / Orange County
      { lat: 34.0522, lng: -118.2437 }, // Los Angeles
    ],
  },
  {
    slug: "miami",
    name: "Miami",
    state: "FL",
    label: "Miami, FL",
    coords: [
      { lat: 26.1224, lng: -80.1373 }, // Fort Lauderdale
      { lat: 25.7617, lng: -80.1918 }, // Miami
    ],
  },
  {
    slug: "tampa",
    name: "Tampa",
    state: "FL",
    label: "Tampa, FL",
    coords: [
      { lat: 27.9506, lng: -82.4572 }, // Tampa
      { lat: 27.7676, lng: -82.6403 }, // St. Petersburg
    ],
  },
  {
    slug: "jacksonville",
    name: "Jacksonville",
    state: "FL",
    label: "Jacksonville, FL",
    coords: [{ lat: 30.3322, lng: -81.6557 }],
  },
  {
    slug: "chicago",
    name: "Chicago",
    state: "IL",
    label: "Chicago, IL",
    coords: [{ lat: 41.8781, lng: -87.6298 }],
  },
  {
    slug: "charlotte",
    name: "Charlotte",
    state: "NC",
    label: "Charlotte, NC",
    coords: [{ lat: 35.2271, lng: -80.8431 }],
  },
  {
    slug: "philadelphia",
    name: "Philadelphia",
    state: "PA",
    label: "Philadelphia, PA",
    coords: [{ lat: 39.9526, lng: -75.1652 }],
  },
  {
    slug: "new-york",
    name: "New York",
    state: "NY",
    label: "New York, NY",
    coords: [{ lat: 40.7128, lng: -74.006 }],
  },
  {
    slug: "new-jersey",
    name: "New Jersey",
    state: "NJ",
    label: "New Jersey, NJ",
    coords: [
      { lat: 40.7357, lng: -74.1724 }, // Newark
      { lat: 40.7178, lng: -74.0431 }, // Jersey City
    ],
  },
  {
    slug: "kansas-city",
    name: "Kansas City",
    state: "MO",
    label: "Kansas City, MO",
    coords: [{ lat: 39.0997, lng: -94.5786 }],
  },
  {
    slug: "boise",
    name: "Boise",
    state: "ID",
    label: "Boise, ID",
    coords: [{ lat: 43.615, lng: -116.2023 }],
  },
];

/**
 * Standard Phone Area Code (NPA) to Metro Hub mapping
 */
const AREA_CODE_TO_METRO = {
  // Austin, TX
  "512": "austin",
  "737": "austin",

  // San Antonio, TX
  "210": "san-antonio",
  "726": "san-antonio",
  "830": "san-antonio",

  // Houston, TX
  "713": "houston",
  "281": "houston",
  "832": "houston",
  "346": "houston",

  // Dallas / Fort Worth, TX
  "214": "dallas",
  "469": "dallas",
  "972": "dallas",
  "817": "dallas",
  "682": "dallas",

  // McAllen / RGV, TX
  "956": "mcallen",

  // Las Vegas, NV
  "702": "las-vegas",
  "725": "las-vegas",

  // Irvine / Los Angeles / Orange County, CA
  "949": "irvine",
  "714": "irvine",
  "657": "irvine",
  "562": "irvine",
  "310": "irvine",
  "424": "irvine",
  "323": "irvine",
  "213": "irvine",
  "818": "irvine",
  "626": "irvine",

  // Miami / Fort Lauderdale / South Florida
  "305": "miami",
  "786": "miami",
  "954": "miami",
  "754": "miami",
  "561": "miami",

  // Tampa / St. Petersburg, FL
  "813": "tampa",
  "727": "tampa",
  "656": "tampa",

  // Jacksonville, FL
  "904": "jacksonville",

  // Chicago, IL
  "312": "chicago",
  "773": "chicago",
  "872": "chicago",
  "630": "chicago",
  "847": "chicago",
  "224": "chicago",
  "331": "chicago",
  "708": "chicago",

  // Charlotte, NC
  "704": "charlotte",
  "980": "charlotte",

  // Philadelphia, PA
  "215": "philadelphia",
  "267": "philadelphia",
  "445": "philadelphia",
  "610": "philadelphia",
  "484": "philadelphia",

  // New York, NY
  "212": "new-york",
  "646": "new-york",
  "332": "new-york",
  "718": "new-york",
  "347": "new-york",
  "929": "new-york",
  "917": "new-york",
  "516": "new-york",
  "631": "new-york",
  "914": "new-york",

  // New Jersey, NJ
  "201": "new-jersey",
  "551": "new-jersey",
  "862": "new-jersey",
  "973": "new-jersey",
  "908": "new-jersey",
  "732": "new-jersey",
  "848": "new-jersey",
  "856": "new-jersey",
  "609": "new-jersey",
  "640": "new-jersey",

  // Kansas City, MO/KS
  "816": "kansas-city",
  "913": "kansas-city",

  // Boise, ID
  "208": "boise",
  "986": "boise",
};

/**
 * Direct Suburb -> Metro Hub Dictionary
 */
const SUBURB_TO_METRO = {
  // Austin, TX & suburbs
  austin: "austin",
  jarrell: "austin",
  "round-rock": "austin",
  "cedar-park": "austin",
  georgetown: "austin",
  pflugerville: "austin",
  leander: "austin",
  "san-marcos": "austin",
  buda: "austin",
  kyle: "austin",
  "liberty-hill": "austin",
  hutto: "austin",
  manor: "austin",
  lakeway: "austin",
  "bee-cave": "austin",
  "dripping-springs": "austin",
  bastrop: "austin",
  elgin: "austin",
  taylor: "austin",

  // Las Vegas, NV & suburbs
  "las-vegas": "las-vegas",
  "north-las-vegas": "las-vegas",
  henderson: "las-vegas",
  enterprise: "las-vegas",
  paradise: "las-vegas",
  springvalley: "las-vegas",
  "spring-valley": "las-vegas",
  summerlin: "las-vegas",
  "summerlin-south": "las-vegas",
  sunrisemanor: "las-vegas",
  "sunrise-manor": "las-vegas",
  whitney: "las-vegas",
  winchester: "las-vegas",
  bouldercity: "las-vegas",
  "boulder-city": "las-vegas",

  // Irvine / Los Angeles / Orange County, CA
  irvine: "irvine",
  "long-beach": "irvine",
  "newport-beach": "irvine",
  "costa-mesa": "irvine",
  "lake-forest": "irvine",
  tustin: "irvine",
  "mission-viejo": "irvine",
  "laguna-niguel": "irvine",
  "laguna-hills": "irvine",
  "laguna-beach": "irvine",
  "aliso-viejo": "irvine",
  "huntington-beach": "irvine",
  "santa-ana": "irvine",
  orange: "irvine",
  anaheim: "irvine",
  "foothill-ranch": "irvine",
  "san-clemente": "irvine",
  "dana-point": "irvine",
  fullerton: "irvine",
  "garden-grove": "irvine",
  yorbalinda: "irvine",
  "yorba-linda": "irvine",
  brea: "irvine",
  placentia: "irvine",
  buenapark: "irvine",
  "buena-park": "irvine",
  cypress: "irvine",
  westminster: "irvine",
  fontana: "irvine",
  torrance: "irvine",
  glendale: "irvine",
  pasadena: "irvine",
  "los-angeles": "irvine",

  // Houston, TX & suburbs
  houston: "houston",
  "the-woodlands": "houston",
  conroe: "houston",
  "sugar-land": "houston",
  pearland: "houston",
  "league-city": "houston",
  katy: "houston",
  spring: "houston",
  humble: "houston",
  tomball: "houston",
  cypress: "houston",
  richmond: "houston",
  rosenberg: "houston",
  friendswood: "houston",
  missouricity: "houston",
  "missouri-city": "houston",
  folshear: "houston",
  fulshear: "houston",

  // San Antonio, TX & suburbs
  "san-antonio": "san-antonio",
  "new-braunfels": "san-antonio",
  schertz: "san-antonio",
  cibolo: "san-antonio",
  boerne: "san-antonio",
  "universal-city": "san-antonio",
  converse: "san-antonio",
  "live-oak": "san-antonio",
  selma: "san-antonio",
  helotes: "san-antonio",
  "alamo-heights": "san-antonio",
  "leon-valley": "san-antonio",
  "fair-oaks-ranch": "san-antonio",
  "timberwood-park": "san-antonio",
  bulverde: "san-antonio",
  "canyon-lake": "san-antonio",
  seguin: "san-antonio",
  castroville: "san-antonio",

  // Dallas / Fort Worth, TX & suburbs
  dallas: "dallas",
  "fort-worth": "dallas",
  plano: "dallas",
  frisco: "dallas",
  mckinney: "dallas",
  arlington: "dallas",
  irving: "dallas",
  garland: "dallas",
  richardson: "dallas",
  denton: "dallas",
  carrollton: "dallas",
  allen: "dallas",
  prosper: "dallas",
  celina: "dallas",
  forney: "dallas",
  rockwall: "dallas",
  mansfield: "dallas",
  grapevine: "dallas",
  southlake: "dallas",

  // McAllen, TX & suburbs
  mcallen: "mcallen",
  edinburg: "mcallen",
  mission: "mcallen",
  pharr: "mcallen",
  "san-juan": "mcallen",
  alamo: "mcallen",
  donna: "mcallen",
  weslaco: "mcallen",
  mercedes: "mcallen",
  "la-feria": "mcallen",
  harlingen: "mcallen",
  alton: "mcallen",

  // Tampa, FL & suburbs
  tampa: "tampa",
  "st-petersburg": "tampa",
  clearwater: "tampa",
  brandon: "tampa",
  riverview: "tampa",
  lutz: "tampa",
  "wesley-chapel": "tampa",
  lakeland: "tampa",
  valrico: "tampa",
  plantcity: "tampa",
  "plant-city": "tampa",
  landolakes: "tampa",
  "land-o-lakes": "tampa",
  largo: "tampa",
  "palm-harbor": "tampa",
  dunedin: "tampa",

  // Miami / Fort Lauderdale, FL & suburbs
  miami: "miami",
  "fort-lauderdale": "miami",
  "boca-raton": "miami",
  hollywood: "miami",
  "pembroke-pines": "miami",
  miramar: "miami",
  "coral-gables": "miami",
  aventura: "miami",
  kendall: "miami",
  homestead: "miami",
  hialeah: "miami",
  "miami-beach": "miami",
  doral: "miami",
  "pompano-beach": "miami",
  davie: "miami",
  sunrise: "miami",
  plantation: "miami",
  "deerfield-beach": "miami",
  "boynton-beach": "miami",
  "delray-beach": "miami",
  "west-palm-beach": "miami",

  // Jacksonville, FL & suburbs
  jacksonville: "jacksonville",
  "jacksonville-beach": "jacksonville",
  "orange-park": "jacksonville",
  "st-augustine": "jacksonville",
  "ponte-vedra": "jacksonville",

  // Chicago, IL & suburbs
  chicago: "chicago",
  naperville: "chicago",
  aurora: "chicago",
  joliet: "chicago",
  "arlington-heights": "chicago",
  evanston: "chicago",
  schaumburg: "chicago",
  "oak-brook": "chicago",
  "orland-park": "chicago",
  palatine: "chicago",
  elgin: "chicago",
  waukegan: "chicago",
  cicero: "chicago",
  "des-plaines": "chicago",

  // Charlotte, NC & suburbs
  charlotte: "charlotte",
  concord: "charlotte",
  gastonia: "charlotte",
  "rock-hill": "charlotte",
  huntersville: "charlotte",
  kannapolis: "charlotte",
  matthews: "charlotte",
  pineville: "charlotte",
  mooresville: "charlotte",
  waxhaw: "charlotte",

  // Philadelphia, PA & suburbs
  philadelphia: "philadelphia",
  camden: "philadelphia",
  cherryhill: "philadelphia",
  "cherry-hill": "philadelphia",
  norristown: "philadelphia",
  chester: "philadelphia",
  bensalem: "philadelphia",

  // New York, NY & suburbs
  "new-york": "new-york",
  brooklyn: "new-york",
  queens: "new-york",
  manhattan: "new-york",
  bronx: "new-york",
  "staten-island": "new-york",
  yonkers: "new-york",
  "white-plains": "new-york",
  hempstead: "new-york",

  // New Jersey, NJ & suburbs
  "new-jersey": "new-jersey",
  newark: "new-jersey",
  "jersey-city": "new-jersey",
  paterson: "new-jersey",
  elizabeth: "new-jersey",
  edison: "new-jersey",
  woodbridge: "new-jersey",
  trenton: "new-jersey",
  clifton: "new-jersey",

  // Kansas City, MO/KS & suburbs
  "kansas-city": "kansas-city",
  overlandpark: "kansas-city",
  "overland-park": "kansas-city",
  olathe: "kansas-city",
  independence: "kansas-city",
  leesummit: "kansas-city",
  "lee-s-summit": "kansas-city",
  shawnee: "kansas-city",

  // Boise, ID & suburbs
  boise: "boise",
  meridian: "boise",
  eagle: "boise",
  star: "boise",
  "garden-city": "boise",
  kuna: "boise",
  nampa: "boise",
  caldwell: "boise",
  middleton: "boise",
  "hidden-springs": "boise",
  marsing: "boise",
};

/**
 * Great-circle distance between two points in miles (Haversine formula)
 */
function calculateDistanceMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8; // Radius of Earth in miles
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function normalizeKey(str) {
  if (!str) return "";
  return String(str)
    .toLowerCase()
    .trim()
    .replace(/^\/+|\/+$/g, "")
    .replace(/[,\s_]+/g, "-");
}

function formatProperCase(str) {
  if (!str) return "";
  let clean = decodeURIComponent(str).trim();
  if (clean.includes("-") && !clean.includes(" ")) {
    clean = clean.replace(/-/g, " ");
  }
  return clean
    .replace(/\b[a-z]/g, (c) => c.toUpperCase())
    .replace(/[<>"']/g, "");
}

/**
 * Main Lead Location Resolver
 *
 * Combines:
 * 1. Cloudflare GPS coords (lat, lng) -> exact distance in miles to TVPro Metro Hubs
 * 2. Suburb dictionary & Strapi database
 * 3. US Phone area code (NPA)
 * 4. Page path / query parameters
 */
function resolveLeadLocation(params = {}) {
  const {
    city: rawCity,
    state: rawState,
    page: rawPage,
    lat: rawLat,
    lng: rawLng,
    phone: rawPhone,
    source,
  } = params;

  // 1. Resolve and format Page
  let page = rawPage || "";
  if (!page && source) {
    if (source.includes("estimate")) page = "/estimate";
    else if (source.includes("book-now")) page = "/book-now";
    else if (source.includes("quiz") || source.includes("best-quote")) page = "/quiz";
  }
  if (page && !page.startsWith("/")) {
    page = `/${page}`;
  }
  if (!page) {
    page = "/";
  }

  // 2. Parse City and State
  let cityName = "";
  let stateCode = (rawState || "").trim().toUpperCase();

  if (rawCity) {
    const parts = String(rawCity).split(",");
    cityName = formatProperCase(parts[0].trim());
    if (parts.length > 1 && !stateCode) {
      stateCode = parts[1].trim().toUpperCase();
    }
  }

  const cleanPhone = (rawPhone || "").replace(/\D/g, "");
  const phoneAreaCode =
    cleanPhone.length >= 10
      ? cleanPhone.startsWith("1") && cleanPhone.length === 11
        ? cleanPhone.slice(1, 4)
        : cleanPhone.slice(0, 3)
      : "";

  let matchedMetro = null;
  let minDistance = null;

  // 3. Signal A: GPS Distance (Haversine) if lat & lng are present
  const latNum = parseFloat(rawLat);
  const lngNum = parseFloat(rawLng);
  if (!isNaN(latNum) && !isNaN(lngNum) && latNum !== 0 && lngNum !== 0) {
    let closestMetro = null;
    let closestDist = Infinity;

    for (const hub of METRO_HUBS) {
      for (const coord of hub.coords) {
        const dist = calculateDistanceMiles(latNum, lngNum, coord.lat, coord.lng);
        if (dist < closestDist) {
          closestDist = dist;
          closestMetro = hub;
        }
      }
    }

    if (closestMetro) {
      minDistance = Math.round(closestDist);
      // Service radius is up to 55 miles
      if (closestDist <= 55) {
        matchedMetro = closestMetro;
      }
    }
  }

  // 4. Signal B: Suburb / City Name Lookup
  if (!matchedMetro && cityName) {
    const slugKey = normalizeKey(cityName);
    const metroSlug = SUBURB_TO_METRO[slugKey];
    if (metroSlug) {
      matchedMetro = METRO_HUBS.find((h) => h.slug === metroSlug) || null;
    }
  }

  // 5. Signal C: Page Slug (e.g. /san-antonio/, /dallas/)
  if (!matchedMetro && page) {
    const cleanPath = normalizeKey(page);
    const metroSlug = SUBURB_TO_METRO[cleanPath];
    if (metroSlug) {
      matchedMetro = METRO_HUBS.find((h) => h.slug === metroSlug) || null;
    }
  }

  // 6. Signal D: Phone Area Code fallback
  if (!matchedMetro && phoneAreaCode) {
    const metroSlug = AREA_CODE_TO_METRO[phoneAreaCode];
    if (metroSlug) {
      matchedMetro = METRO_HUBS.find((h) => h.slug === metroSlug) || null;
    }
  }

  // If state is still missing, infer from matched metro
  if (!stateCode && matchedMetro) {
    stateCode = matchedMetro.state;
  }

  // If cityName is still empty, infer from page slug if page is a city page
  if (!cityName && page) {
    const cleanPath = normalizeKey(page);
    if (
      cleanPath &&
      ![
        "estimate",
        "book-now",
        "quiz",
        "b",
        "blog",
        "see-you-soon",
        "privacy-policy",
        "terms",
        "careers",
        "index",
      ].includes(cleanPath)
    ) {
      cityName = formatProperCase(cleanPath);
    }
  }

  // If cityName is still empty, infer from matched metro
  if (!cityName && matchedMetro) {
    cityName = matchedMetro.name;
  }
  if (!cityName) {
    cityName = "Houston";
    stateCode = stateCode || "TX";
  }

  const cityWithState = stateCode ? `${cityName}, ${stateCode}` : cityName;

  // Format Area / Metro Area
  let metroAreaLabel = "";
  if (matchedMetro) {
    const isSameCity =
      normalizeKey(cityName) === normalizeKey(matchedMetro.name);
    if (isSameCity) {
      metroAreaLabel = matchedMetro.label;
    } else if (minDistance !== null && minDistance > 0) {
      metroAreaLabel = `${matchedMetro.label} (~${minDistance} mi)`;
    } else {
      metroAreaLabel = matchedMetro.label;
    }
  } else if (minDistance !== null && minDistance > 55) {
    metroAreaLabel = `⚠️ Outside service area (~${minDistance} mi to nearest hub)`;
  } else {
    metroAreaLabel = stateCode ? `${cityName}, ${stateCode}` : cityName;
  }

  return {
    page,
    cityName,
    stateCode,
    cityWithState,
    metroArea: metroAreaLabel,
    metroSlug: matchedMetro ? matchedMetro.slug : null,
    distanceMiles: minDistance,
  };
}

module.exports = {
  METRO_HUBS,
  SUBURB_TO_METRO,
  AREA_CODE_TO_METRO,
  calculateDistanceMiles,
  resolveLeadLocation,
};
