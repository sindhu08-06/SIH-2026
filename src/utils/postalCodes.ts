// Comprehensive Indian Postal PIN code directory focusing on Andhra Pradesh (Kurnool & Ananthapur) and regional hubs
export interface PostalCodeInfo {
  pincode: string;
  area: string;
  city: string;
  district: string;
  state: string;
  lat: number;
  lng: number;
  landmarks: string;
}

export const KNOWN_POSTAL_CODES: PostalCodeInfo[] = [
  // --- KURNOOL, ANDHRA PRADESH ---
  {
    pincode: '518001',
    area: 'N.R. Peta & Raj Vihar',
    city: 'Kurnool',
    district: 'Kurnool',
    state: 'Andhra Pradesh',
    lat: 15.8281,
    lng: 78.0373,
    landmarks: 'Raj Vihar Centre, Cooperative Bhavan, Collectorate, Zilla Parishad',
  },
  {
    pincode: '518002',
    area: 'C-Camp & G. Pulla Reddy Enclave',
    city: 'Kurnool',
    district: 'Kurnool',
    state: 'Andhra Pradesh',
    lat: 15.8150,
    lng: 78.0280,
    landmarks: 'GPREC Campus, C-Camp Rythu Bazaar, Nandyal Road Junction',
  },
  {
    pincode: '518003',
    area: 'Joharapuram & Old Town',
    city: 'Kurnool',
    district: 'Kurnool',
    state: 'Andhra Pradesh',
    lat: 15.8220,
    lng: 78.0480,
    landmarks: 'Konda Reddy Buruju, Tungabhadra Riverfront, Old Bus Stand',
  },
  {
    pincode: '518004',
    area: 'Kallur Industrial Area',
    city: 'Kurnool',
    district: 'Kurnool',
    state: 'Andhra Pradesh',
    lat: 15.8010,
    lng: 78.0190,
    landmarks: 'Kallur Estate, APSRTC Workshop, Bellary Road',
  },
  // --- ANANTHAPUR, ANDHRA PRADESH ---
  {
    pincode: '515001',
    area: 'Clock Tower & Subhash Road',
    city: 'Ananthapur',
    district: 'Ananthapur',
    state: 'Andhra Pradesh',
    lat: 14.6819,
    lng: 77.6006,
    landmarks: 'Historic Clock Tower, Subhash Road, Srikantam Circle, Old Town',
  },
  {
    pincode: '515002',
    area: 'Court Road & Housing Board Colony',
    city: 'Ananthapur',
    district: 'Ananthapur',
    state: 'Andhra Pradesh',
    lat: 14.6738,
    lng: 77.5950,
    landmarks: 'District Court Complex, Pragathi Bhavan, Collector Office, Housing Board Phase 1-2',
  },
  {
    pincode: '515003',
    area: 'JNTU Campus & Engineering College',
    city: 'Ananthapur',
    district: 'Ananthapur',
    state: 'Andhra Pradesh',
    lat: 14.6540,
    lng: 77.6110,
    landmarks: 'JNTUA University, Arts College, Bangalore Highway Cross',
  },
  {
    pincode: '515004',
    area: 'Kovur Nagar & Rudrampeta',
    city: 'Ananthapur',
    district: 'Ananthapur',
    state: 'Andhra Pradesh',
    lat: 14.6920,
    lng: 77.5890,
    landmarks: 'Kovur Nagar Main Road, NH-44 Bypass, Industrial Growth Centre',
  },
  // --- REGIONAL HUBS ---
  {
    pincode: '411005',
    area: 'Shivajinagar',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    lat: 18.5314,
    lng: 73.8446,
    landmarks: 'Sancheti Hospital, Agricultural College, Simla Office, CoEP',
  },
  {
    pincode: '411038',
    area: 'Kothrud',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    lat: 18.5074,
    lng: 73.8077,
    landmarks: 'Karve Road, Paud Road, MIT Campus, Vanaz',
  },
  {
    pincode: '411004',
    area: 'Deccan Gymkhana',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    lat: 18.5167,
    lng: 73.8417,
    landmarks: 'Fergusson College Road, Prabhat Road, Goodluck Chowk',
  },
  {
    pincode: '411007',
    area: 'Aundh',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    lat: 18.5580,
    lng: 73.8075,
    landmarks: 'Spicer College, Bremen Chowk, Pune University West',
  },
  {
    pincode: '411045',
    area: 'Baner',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    lat: 18.5590,
    lng: 73.7868,
    landmarks: 'High Street, Pancard Club Road, Balewadi Link',
  },
  {
    pincode: '411057',
    area: 'Hinjewadi & Wakad',
    city: 'Pune / PCMC',
    district: 'Pune',
    state: 'Maharashtra',
    lat: 18.5913,
    lng: 73.7389,
    landmarks: 'Rajiv Gandhi Infotech Park Phase 1-3, Wakad Bridge, Dutta Mandir',
  },
  {
    pincode: '411006',
    area: 'Kalyani Nagar & Yerawada',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    lat: 18.5463,
    lng: 73.9033,
    landmarks: 'Joggers Park, Nagar Road, Koregaon Park North Bridge',
  },
  {
    pincode: '411014',
    area: 'Viman Nagar',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    lat: 18.5679,
    lng: 73.9143,
    landmarks: 'Phoenix Marketcity, Symbiosis Campus, Lohegaon Road',
  },
  {
    pincode: '411028',
    area: 'Hadapsar & Magarpatta City',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    lat: 18.5089,
    lng: 73.9260,
    landmarks: 'Cybercity Magarpatta, Amanora Park Town, Solapur Road',
  },
  {
    pincode: '411042',
    area: 'Swargate & Shukrawar Peth',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    lat: 18.5018,
    lng: 73.8586,
    landmarks: 'Jedhe Chowk Bus Terminus, Sarasbaug, Parvati Foot',
  },
  {
    pincode: '411046',
    area: 'Katraj & Ambegaon',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    lat: 18.4575,
    lng: 73.8587,
    landmarks: 'Bharati Vidyapeeth, Katraj Snake Park, Pune-Satara Road',
  },
  {
    pincode: '411001',
    area: 'Pune Station & Camp',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    lat: 18.5289,
    lng: 73.8744,
    landmarks: 'Pune Junction, MG Road, Sassoon Hospital, Bund Garden',
  },
  {
    pincode: '411018',
    area: 'Pimpri Colony',
    city: 'Pimpri-Chinchwad',
    district: 'Pune',
    state: 'Maharashtra',
    lat: 18.6279,
    lng: 73.8009,
    landmarks: 'PCMC Municipal Headquarters, Finolex Chowk, Delhi Gate',
  },
  {
    pincode: '411033',
    area: 'Chinchwad & Thergaon',
    city: 'Pimpri-Chinchwad',
    district: 'Pune',
    state: 'Maharashtra',
    lat: 18.6298,
    lng: 73.7997,
    landmarks: 'Chinchwad Station, Chaphekar Chowk, Dange Chowk',
  },
  {
    pincode: '411027',
    area: 'Sangvi & Pimple Gurav',
    city: 'Pimpri-Chinchwad',
    district: 'Pune',
    state: 'Maharashtra',
    lat: 18.5772,
    lng: 73.8217,
    landmarks: 'Dinosaur Garden, Old Sangvi Bridge, PCMC Link',
  },
  {
    pincode: '411061',
    area: 'Pimple Saudagar',
    city: 'Pimpri-Chinchwad',
    district: 'Pune',
    state: 'Maharashtra',
    lat: 18.5987,
    lng: 73.7972,
    landmarks: 'Govind Garden, Kunal Icon Road, Roseland Residency',
  },
  {
    pincode: '411052',
    area: 'Karve Nagar & Hingne Khurd',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    lat: 18.4897,
    lng: 73.8193,
    landmarks: 'Cummins College, Canal Road, Rajaram Bridge',
  },
  {
    pincode: '411041',
    area: 'Vadgaon Budruk & Sinhagad Road',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    lat: 18.4682,
    lng: 73.8209,
    landmarks: 'Sinhgad Institutes, Manik Baug, Anand Nagar',
  },
  {
    pincode: '411048',
    area: 'Kondhwa & NIBM Road',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    lat: 18.4770,
    lng: 73.8938,
    landmarks: 'NIBM Undri Link Road, Salunke Vihar, Clover Highlands',
  },
  {
    pincode: '412207',
    area: 'Wagholi',
    city: 'Pune',
    district: 'Pune',
    state: 'Maharashtra',
    lat: 18.5800,
    lng: 73.9800,
    landmarks: 'Bakori Road, Raisoni College, Nagar Highway Junction',
  },
  {
    pincode: '400001',
    area: 'Fort & CST',
    city: 'Mumbai',
    district: 'Mumbai City',
    state: 'Maharashtra',
    lat: 18.9322,
    lng: 72.8360,
    landmarks: 'Chhatrapati Shivaji Maharaj Terminus, Reserve Bank, Flora Fountain',
  },
  {
    pincode: '400028',
    area: 'Dadar West',
    city: 'Mumbai',
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    lat: 19.0178,
    lng: 72.8478,
    landmarks: 'Shivaji Park, Sena Bhavan, Plaza Cinema, Portuguese Church',
  },
  {
    pincode: '400050',
    area: 'Bandra West',
    city: 'Mumbai',
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    lat: 19.0596,
    lng: 72.8295,
    landmarks: 'Hill Road, Linking Road, Bandstand, Mount Mary',
  },
  {
    pincode: '400069',
    area: 'Andheri East',
    city: 'Mumbai',
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    lat: 19.1136,
    lng: 72.8697,
    landmarks: 'MIDC Industrial Area, Chakala, Western Express Highway Station',
  },
  {
    pincode: '400076',
    area: 'Powai',
    city: 'Mumbai',
    district: 'Mumbai Suburban',
    state: 'Maharashtra',
    lat: 19.1176,
    lng: 72.9060,
    landmarks: 'Hiranandani Gardens, IIT Bombay, Powai Lake',
  },
  {
    pincode: '400601',
    area: 'Thane West',
    city: 'Thane',
    district: 'Thane',
    state: 'Maharashtra',
    lat: 19.1970,
    lng: 72.9720,
    landmarks: 'Thane Station, Gokhale Road, Talao Pali, Teen Hath Naka',
  },
  {
    pincode: '400703',
    area: 'Vashi',
    city: 'Navi Mumbai',
    district: 'Thane',
    state: 'Maharashtra',
    lat: 19.0770,
    lng: 72.9986,
    landmarks: 'Sector 17 Market, Inorbit Mall, Vashi Station Complex',
  },
];

// Helper to look up PIN code locally or via India Post API
export async function lookupPostalCode(
  pincode: string
): Promise<PostalCodeInfo | null> {
  const cleanPin = pincode.replace(/\D/g, '').trim();
  if (cleanPin.length !== 6) return null;

  // 1. First check local rich database
  const localMatch = KNOWN_POSTAL_CODES.find((p) => p.pincode === cleanPin);
  if (localMatch) {
    return localMatch;
  }

  // 2. Fetch from India Post Open Postal PIN API
  try {
    const res = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`);
    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.Status === 'Success' && data[0]?.PostOffice?.length > 0) {
        const po = data[0].PostOffice[0];
        
        // Approximate coordinates based on District or fallback
        const districtName = (po.District || '').toLowerCase();
        const stateName = (po.State || '').toLowerCase();
        let approxLat = 15.8281;
        let approxLng = 78.0373;
        if (districtName.includes('kurnool')) {
          approxLat = 15.8281;
          approxLng = 78.0373;
        } else if (districtName.includes('ananthapur') || districtName.includes('anantapur')) {
          approxLat = 14.6819;
          approxLng = 77.6006;
        } else if (districtName.includes('nandyal')) {
          approxLat = 15.4886;
          approxLng = 78.4836;
        } else if (districtName.includes('kadapa') || districtName.includes('ysr')) {
          approxLat = 14.4673;
          approxLng = 78.8242;
        } else if (districtName.includes('tirupati') || districtName.includes('chittoor')) {
          approxLat = 13.6288;
          approxLng = 79.4192;
        } else if (districtName.includes('mumbai') || districtName.includes('suburban')) {
          approxLat = 19.076;
          approxLng = 72.8777;
        } else if (districtName.includes('pune')) {
          approxLat = 18.5204;
          approxLng = 73.8567;
        }

        return {
          pincode: cleanPin,
          area: po.Name || po.Block || po.District,
          city: po.District || 'Kurnool',
          district: po.District || 'Kurnool',
          state: po.State || 'Andhra Pradesh',
          lat: approxLat,
          lng: approxLng,
          landmarks: `${po.Division || ''} Division, ${po.Circle || ''} Circle`,
        };
      }
    }
  } catch (err) {
    console.warn('India Post API lookup fallback:', err);
  }

  return null;
}
