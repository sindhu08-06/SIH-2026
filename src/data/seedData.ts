import {
  CooperativeSociety,
  WorkerProfile,
  CustomerProfile,
  Booking,
  PaymentLedgerItem,
  DemandForecast,
} from '../types';

export const initialSocieties: CooperativeSociety[] = [
  {
    id: 'soc-1',
    name: 'Kurnool Central Artisans & Electrical Cooperative Society',
    nameHi: 'कर्नूल सेंट्रल आर्टिसन्स एंड इलेक्ट्रिकल कोऑपरेटिव',
    registrationNumber: 'AP/KNL/CS/4812/2015',
    federationId: 'fed-ap-01',
    district: 'Kurnool Urban',
    address: 'Cooperative Bhavan, N.R. Peta, Near Raj Vihar, Kurnool, Andhra Pradesh 518001',
    coordinates: { lat: 15.8281, lng: 78.0373 },
    establishedYear: 2015,
    presidentName: 'Shri P. Venkata Ramana',
    contactPhone: '+91 8518 221040',
    activeWorkersCount: 54,
    totalBookingsHandled: 1420,
    welfareFundBalance: 512000,
    primarySectors: ['Electrical', 'Appliance Repair', 'Solar Pump Systems'],
  },
  {
    id: 'soc-2',
    name: 'Ananthapur District Mechanical & Plumbing Sahakara Sangham',
    nameHi: 'अनंतपुर जिला मैकेनिकल एवं प्लंबिंग सहकार संघ',
    registrationNumber: 'AP/ATP/CS/3920/2016',
    federationId: 'fed-ap-01',
    district: 'Ananthapur Urban',
    address: 'Artisan Seva Kendram, Subhash Road, Clock Tower Center, Ananthapur, Andhra Pradesh 515001',
    coordinates: { lat: 14.6819, lng: 77.6006 },
    establishedYear: 2016,
    presidentName: 'Smt. K. Lakshmi Devi',
    contactPhone: '+91 8554 241920',
    activeWorkersCount: 46,
    totalBookingsHandled: 1180,
    welfareFundBalance: 384000,
    primarySectors: ['Plumbing', 'Borewell & Motor Services', 'Sanitation', 'Pipeline Maintenance'],
  },
  {
    id: 'soc-3',
    name: 'Kurnool Industrial & Solar Technicians Cooperative Guild',
    nameHi: 'कर्नूल इंडस्ट्रियल एवं सोलर तकनीशियन कोऑपरेटिव गिल्ड',
    registrationNumber: 'AP/KNL/CS/5621/2018',
    federationId: 'fed-ap-01',
    district: 'Kurnool (C-Camp / Joharapuram)',
    address: 'Sahakara Soudha, C-Camp Centre, Near G. Pulla Reddy Enclave, Kurnool, Andhra Pradesh 518002',
    coordinates: { lat: 15.8150, lng: 78.0280 },
    establishedYear: 2018,
    presidentName: 'Shri M. Surendra Reddy',
    contactPhone: '+91 8518 245890',
    activeWorkersCount: 60,
    totalBookingsHandled: 1780,
    welfareFundBalance: 620000,
    primarySectors: ['Industrial Electrical', 'Rooftop Solar Installation', 'Inverters & Batteries'],
  },
  {
    id: 'soc-4',
    name: 'Ananthapur Craftsmen, Carpentry & Construction Seva Collective',
    nameHi: 'अनंतपुर शिल्पी, बढ़ईगीरी एवं निर्माण सेवा कलेक्टिव',
    registrationNumber: 'AP/ATP/CS/7115/2020',
    federationId: 'fed-ap-01',
    district: 'Ananthapur (Court Road / Housing Board)',
    address: 'Pragathi Bhavan, Near Collectorate, Court Road, Ananthapur, Andhra Pradesh 515001',
    coordinates: { lat: 14.6738, lng: 77.5950 },
    establishedYear: 2020,
    presidentName: 'Shri T. Narayana Swamy',
    contactPhone: '+91 8554 278110',
    activeWorkersCount: 48,
    totalBookingsHandled: 990,
    welfareFundBalance: 340000,
    primarySectors: ['Carpentry', 'Masonry', 'Deep Cleaning', 'Painting & Waterproofing'],
  },
  {
    id: 'soc-5',
    name: 'Rayalaseema Andhra Pradesh Integrated Artisan Federation Hub',
    nameHi: 'रायलसीमा आंध्र प्रदेश इंटीग्रेटेड कारीगर फेडरेशन हब',
    registrationNumber: 'AP/FED/CS/1004/2013',
    federationId: 'fed-ap-01',
    district: 'Andhra Pradesh (Rayalaseema Apex)',
    address: 'Apex Cooperative Complex, Old Bus Stand Road, Kurnool, Andhra Pradesh 518001',
    coordinates: { lat: 15.8320, lng: 78.0340 },
    establishedYear: 2013,
    presidentName: 'Shri B. Chandrasekhar Reddy',
    contactPhone: '+91 8518 223500',
    activeWorkersCount: 72,
    totalBookingsHandled: 2350,
    welfareFundBalance: 890000,
    primarySectors: ['Multi-trade Emergency Governance', 'Apprentice Training', 'Welfare Fund Management'],
  },
];

// No pre-existing workers; populated exclusively when skilled workers register
export const initialWorkers: WorkerProfile[] = [];

// No pre-existing bookings; populated exclusively through customer requests
export const initialBookings: Booking[] = [];

// No pre-existing settlement ledgers
export const initialPaymentLedgers: PaymentLedgerItem[] = [];

export const initialDemandForecast: DemandForecast = {
  summary:
    'Cooperative telemetry monitors emergency electrical, plumbing, borewell motor servicing, and rooftop solar maintenance requests across Kurnool and Ananthapur districts, Andhra Pradesh.',
  projectedDemandSpikePercentage: 32,
  highDemandZones: [
    {
      zoneName: 'Zone Kurnool Central (Raj Vihar / N.R. Peta)',
      riskLevel: 'High',
      expectedIncrease: '+38%',
      primaryCategory: 'Electrical & Inverter Repair',
      rationale:
        'Summer & monsoon transitions causing grid voltage fluctuations and heavy commercial inverter loads.',
    },
    {
      zoneName: 'Zone Ananthapur Central (Clock Tower / Subhash Road)',
      riskLevel: 'Moderate',
      expectedIncrease: '+26%',
      primaryCategory: 'Plumbing & Borewell Services',
      rationale:
        'Municipal water supply variations prompting borewell submerged pump motor checks and pipeline repairs.',
    },
    {
      zoneName: 'Zone Kurnool Industrial (C-Camp & Kallur Corridor)',
      riskLevel: 'Moderate',
      expectedIncrease: '+22%',
      primaryCategory: 'Solar & Inverter Servicing',
      rationale:
        'Rooftop solar panel inspections and heavy-duty battery maintenance across residential colonies.',
    },
  ],
  recommendedWorkerAllocations: [
    {
      society: 'Kurnool Central Artisans & Electrical Cooperative Society',
      action: 'Deploy 12 standby certified electricians on rapid response roster for N.R. Peta & Raj Vihar.',
      expectedImpact: 'Reduces emergency blackout arrival time to under 18 minutes.',
    },
    {
      society: 'Ananthapur District Mechanical & Plumbing Sahakara Sangham',
      action: 'Pre-position 8 mobile plumbing squads equipped with motor spares near Clock Tower center.',
      expectedImpact: 'Maintains 98% resolution compliance for residential drinking water motor outages.',
    },
  ],
  welfareAdvisory:
    'Andhra Pradesh Cooperative Federation Board provides direct emergency welfare coverage and heat/storm allowances from the Cooperative Welfare Fund.',
  generatedAt: '2026-09-14 08:00 UTC',
  source: 'Andhra Pradesh Cooperative Operations Desk',
};
