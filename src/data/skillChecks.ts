export interface SkillQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  conceptTag: string;
}

export interface TradeSkillCheck {
  trade: string;
  passingScorePercentage: number;
  totalQuestions: number;
  timeEstimate: string;
  questions: SkillQuestion[];
}

export interface CredentialDocumentType {
  id: string;
  name: string;
  authority: string;
  description: string;
  badge: string;
}

export const CREDENTIAL_DOCUMENT_TYPES: CredentialDocumentType[] = [
  {
    id: 'iti_diploma',
    name: 'National Trade Certificate (NTC / ITI)',
    authority: 'Directorate General of Training (DGT / NCVT)',
    description: 'Govt. 2-year technical diploma verifying formal vocational craftsmanship',
    badge: 'NCVT Certified',
  },
  {
    id: 'wireman_license',
    name: 'State Wireman / Electrician License',
    authority: 'Public Works Department (PWD) / Electrical Inspectorate',
    description: 'Official statutory state authorization to execute electrical installations',
    badge: 'PWD Licensed',
  },
  {
    id: 'skill_india_nsdc',
    name: 'Skill India / NSDC Certificate of Competence',
    authority: 'National Skill Development Corporation (NSDC)',
    description: 'National Skills Qualifications Framework (NSQF Level 3-5) accredited trade card',
    badge: 'Skill India',
  },
  {
    id: 'authorized_brand_cert',
    name: 'OEM Authorized Brand Service Specialist',
    authority: 'Leading Brands (Voltas, Daikin, Havells, Jaquar, Godrej)',
    description: 'Direct manufacturer technical training certification for specialized diagnostics',
    badge: 'OEM Certified',
  },
  {
    id: 'trade_guild_card',
    name: 'Cooperative Federation Master Artisan Card',
    authority: 'District Central Cooperative Federation',
    description: 'Peer-reviewed senior craftsman guild validation with 5+ years field history',
    badge: 'Coop Master',
  },
];

export const TRADE_SKILL_CHECKS: Record<string, TradeSkillCheck> = {
  Electrical: {
    trade: 'Electrical',
    passingScorePercentage: 66,
    totalQuestions: 3,
    timeEstimate: '2 mins',
    questions: [
      {
        id: 'el-1',
        question: 'Which minimum copper wire gauge is mandated for a 16A heavy appliance outlet (Water Geyser / 1.5T AC)?',
        options: [
          '1.0 sq mm copper wire',
          '2.5 sq mm copper wire',
          '4.0 sq mm copper wire',
          '0.75 sq mm flexible twin wire',
        ],
        correctIndex: 2,
        explanation: 'Under Indian Standard IS 732, continuous 16A heating and compressor loads mandate a minimum 4.0 sq mm copper conductor to prevent thermal overload and insulation melting.',
        conceptTag: 'Cable Sizing & IS 732',
      },
      {
        id: 'el-2',
        question: 'What is the primary lifesaving safety role of an RCCB (Residual Current Circuit Breaker) rated at 30mA?',
        options: [
          'Protects against high household voltage spikes',
          'Detects minute earth leakage currents (30mA) within 30ms to prevent fatal human electrocution',
          'Increases total power drawing capacity of the residence',
          'Replaces the physical copper earth ground pit',
        ],
        correctIndex: 1,
        explanation: 'A 30mA RCCB monitors Phase and Neutral balance; if leakage to ground exceeds 30mA (the human ventricular fibrillation threshold), it trips within milliseconds to save lives.',
        conceptTag: 'Earth Leakage & Shock Protection',
      },
      {
        id: 'el-3',
        question: 'Before replacing an MCB or main isolator in a distribution board, what is the mandatory safety step?',
        options: [
          'Wear thin cotton gloves and work with left hand only',
          'Isolate upstream main power switch and verify zero voltage on all terminals using a calibrated tester',
          'Leave main switch on and work rapidly on one live conductor at a time',
          'Spray solvent cleaner across the terminals',
        ],
        correctIndex: 1,
        explanation: 'Lockout/Tagout: always disconnect the upstream main supply, de-energize the board, and verify zero voltage with an insulated multimeter or certified tester.',
        conceptTag: 'Zero Energy Isolation Protocol',
      },
    ],
  },
  Plumbing: {
    trade: 'Plumbing',
    passingScorePercentage: 66,
    totalQuestions: 3,
    timeEstimate: '2 mins',
    questions: [
      {
        id: 'pl-1',
        question: 'What is the standard recommended fall gradient (slope) for residential wastewater drainage lines?',
        options: [
          '1:10 (very steep)',
          '1:40 to 1:50 (approx. 2 cm drop per meter of pipe)',
          'Completely level / flat (0% slope)',
          '1:200 (minimal slope)',
        ],
        correctIndex: 1,
        explanation: 'A gradient of 1:40 to 1:50 (2-2.5%) maintains ideal self-cleansing velocity (0.75 m/s) so water carries solid waste along without settling.',
        conceptTag: 'Drainage Hydraulics',
      },
      {
        id: 'pl-2',
        question: 'What is the essential function of a water seal in a P-trap or floor nahani trap?',
        options: [
          'Slows down discharge water to reduce pipe noise',
          'Forms a water barrier that stops hazardous, toxic sewer gases and foul odours from entering living spaces',
          'Filters hard water minerals and limescale',
          'Increases water pressure inside the fixture',
        ],
        correctIndex: 1,
        explanation: 'The trapped standing water forms a physical barrier that prevents lethal sewer methane (CH4) and hydrogen sulfide (H2S) gases from venting into residential bathrooms and kitchens.',
        conceptTag: 'Trap Seals & Gas Prevention',
      },
      {
        id: 'pl-3',
        question: 'Before plastering or tiling over newly installed concealed CPVC water supply pipelines, what is mandatory?',
        options: [
          'Turn on the city tap for 30 seconds to check flow',
          'Conduct hydrostatic pressure testing at 10–12 bar for minimum 1 to 2 hours to confirm zero concealed joint weeping',
          'Tap joints with a small wrench to test glue strength',
          'Blow air through the line with a hand pump',
        ],
        correctIndex: 1,
        explanation: 'Hydrostatic pressure testing at 1.5x operating pressure for 1-2 hours confirms CPVC solvent cement joints have chemically welded and will not leak inside brickwork.',
        conceptTag: 'Hydrostatic Pressure Testing',
      },
    ],
  },
  'Appliance Repair': {
    trade: 'Appliance Repair',
    passingScorePercentage: 66,
    totalQuestions: 3,
    timeEstimate: '2 mins',
    questions: [
      {
        id: 'ap-1',
        question: 'When repairing refrigerators or inverter ACs charged with R600a or R32 refrigerant, what is the critical rule?',
        options: [
          'Use an open oxy-acetylene torch directly on the sealed filter drier',
          'Ensure continuous room ventilation, never use open flame on charged system, and purge thoroughly with dry nitrogen',
          'Vent the entire charge into the room immediately',
          'Heat compressor housing with heat gun while running',
        ],
        correctIndex: 1,
        explanation: 'R600a (isobutane) and R32 (difluoromethane) are highly flammable A2L/A3 refrigerants. Never weld or de-braze without recovering gas and nitrogen purging.',
        conceptTag: 'Flammable Refrigerant Safety',
      },
      {
        id: 'ap-2',
        question: 'How should a high-voltage capacitor in a microwave oven or inverter motor drive board be discharged before inspection?',
        options: [
          'Touch the terminals together with bare pliers',
          'Safely discharge through a high-wattage power resistor (e.g., 20kΩ 5W) or rated discharge tool with insulated probe',
          'Wait 10 seconds after unplugging the wall socket',
          'Wash the capacitor in water to dissipate charge',
        ],
        correctIndex: 1,
        explanation: 'Microwave capacitors store over 2,000 Volts DC even when unplugged. A direct short can spark violently or damage circuitry; a bleeding resistor ensures safe discharge.',
        conceptTag: 'High-Voltage Capacitor Bleeding',
      },
      {
        id: 'ap-3',
        question: 'If a front-load inverter washing machine shows a motor drive error, what is the correct diagnostic flow?',
        options: [
          'Immediately declare the motor dead and demand full replacement',
          'Check drum spin freedom, wiring harness continuity, and test 3-phase stator winding resistances for balance',
          'Bypass all safety pressure switches with jumper wires',
          'Run machine on maximum spin speed empty',
        ],
        correctIndex: 1,
        explanation: 'Direct drive inverter motors have 3 identical stator winding resistances (typically 5–15Ω) and hall effect rotation sensors; checking balance pinpoints true fault.',
        conceptTag: 'BLDC Inverter Diagnostics',
      },
    ],
  },
  Carpentry: {
    trade: 'Carpentry',
    passingScorePercentage: 66,
    totalQuestions: 3,
    timeEstimate: '2 mins',
    questions: [
      {
        id: 'cp-1',
        question: 'Which joinery method provides superior load-bearing structural strength for solid wood door and cabinet frames?',
        options: [
          'Simple surface butt joint held by standard glue',
          'Mortise and Tenon or precision dowelled joint with proper glue surface area',
          'Edge staples and corrugated steel fasteners',
          'Pocket screws with no glue',
        ],
        correctIndex: 1,
        explanation: 'Mortise and tenon interlocks the wood grain mechanically, providing massive surface area for adhesive and preventing frame sagging over decades.',
        conceptTag: 'Structural Joinery',
      },
      {
        id: 'cp-2',
        question: 'Why must solid timber panel doors be designed with floating panel expansion gaps in the stiles and rails?',
        options: [
          'To reduce the total weight of the door assembly',
          'Because natural wood expands and contracts across its grain in response to seasonal humidity shifts',
          'To make the door flexible during installation',
          'To allow wood glue to overflow cleanly',
        ],
        correctIndex: 1,
        explanation: 'Wood cells absorb moisture during monsoon and lose it in dry summers, expanding perpendicular to grain. A floating panel inside a groove prevents the outer frame from splitting.',
        conceptTag: 'Wood Hygroscopy & Movement',
      },
      {
        id: 'cp-3',
        question: 'When using a circular saw or table saw on solid hardwood, what is mandatory for operator safety?',
        options: [
          'Remove the riving knife and blade guard for better line of sight',
          'Wear eye protection goggles, use a push stick for narrow stock, and never stand directly in the kickback line',
          'Push material through using bare fingers within 2 inches of blade',
          'Wear loose, hanging long sleeves and cotton gloves',
        ],
        correctIndex: 1,
        explanation: 'Table saw kickback occurs when wood pinches the blade; a riving knife prevents pinching, a push stick protects fingers, and goggles shield from high-speed wood chips.',
        conceptTag: 'Power Tool Safety & PPE',
      },
    ],
  },
  Painting: {
    trade: 'Painting',
    passingScorePercentage: 66,
    totalQuestions: 3,
    timeEstimate: '2 mins',
    questions: [
      {
        id: 'pt-1',
        question: 'What is the maximum permissible moisture level in freshly plastered masonry walls before primer application?',
        options: [
          'Up to 35% moisture is acceptable',
          'Below 10% to 12% as measured by a digital moisture meter',
          'Surface dry to touch within 2 hours is adequate',
          'Moisture level does not matter if waterproof paint is used',
        ],
        correctIndex: 1,
        explanation: 'Trapping moisture > 12% behind paint film causes blisters, mold formation, paint peeling, and efflorescence (shora) as vapor attempts to escape.',
        conceptTag: 'Substrate Moisture & Curing',
      },
      {
        id: 'pt-2',
        question: 'Why is an alkali-resistant primer essential before applying premium emulsion over fresh cement plaster?',
        options: [
          'Adds glossy shine to the top finish',
          'Neutralizes the strong free lime alkalinity (pH 12-13) of fresh cement to prevent color patchy bleaching and saponification',
          'Makes the wall fireproof',
          'Reduces the need for wall putty',
        ],
        correctIndex: 1,
        explanation: 'Portland cement cures with high alkaline free lime. Alkali-resistant primer seals this chemistry, preserving vibrant emulsion pigments and adhesive bonding.',
        conceptTag: 'Alkali Sealing & Efflorescence',
      },
      {
        id: 'pt-3',
        question: 'When power sanding acrylic wall putty or enamel surfaces, what safety gear is non-negotiable?',
        options: [
          'Cotton wristbands only',
          'N95 particulate respirator mask and snug safety goggles to protect lungs and eyes from micro-silica dust',
          'Heavy leather welding gloves',
          'Waterproof gumboots',
        ],
        correctIndex: 1,
        explanation: 'Putty dust contains fine respirable silica particles that cause chronic lung irritation; N95 dust masks and eye goggles prevent respiratory and corneal injury.',
        conceptTag: 'Respiratory Protection',
      },
    ],
  },
  Masonry: {
    trade: 'Masonry',
    passingScorePercentage: 66,
    totalQuestions: 3,
    timeEstimate: '2 mins',
    questions: [
      {
        id: 'ms-1',
        question: 'What is the standard cement:sand volumetric mortar ratio for internal and external wall plastering?',
        options: [
          '1:1 (Pure cement paste)',
          '1:4 to 1:6 with well-graded screened sand',
          '1:12 (very lean mix)',
          'Any ratio as long as water is plentiful',
        ],
        correctIndex: 1,
        explanation: 'A 1:4 to 1:6 ratio balances compressive strength, shrinkage control, and workable adhesiveness without excessive shrinkage cracking associated with over-rich mixes.',
        conceptTag: 'Mortar Proportioning',
      },
      {
        id: 'ms-2',
        question: 'Why must porous red clay bricks be soaked in clean water before laying in cement mortar?',
        options: [
          'To cool the ambient temperature on the scaffold',
          'To prevent dry bricks from rapidly absorbing water from the wet mortar, which starves cement hydration and causes weak joints',
          'To increase the physical density of the wall',
          'To remove factory dust only',
        ],
        correctIndex: 1,
        explanation: 'Dry porous bricks have high capillary suction; if not pre-saturated, they steal hydration water from mortar, leaving the mortar powdery and brittle.',
        conceptTag: 'Hydration & Brick Pre-soaking',
      },
      {
        id: 'ms-3',
        question: 'What is the standard minimum water curing duration required for cement masonry and plaster in Indian weather?',
        options: [
          '1 hour after finishing',
          'Minimum 7 to 14 days of regular water spraying to allow full cement hydration strength development',
          'No curing required if covered with plastic sheeting',
          '24 hours is completely sufficient',
        ],
        correctIndex: 1,
        explanation: 'Cement gains 70% of its ultimate strength during the first 7 days of moist curing; inadequate curing leads to surface crazing, low strength, and hollow plaster.',
        conceptTag: 'Curing Standards & Compressive Strength',
      },
    ],
  },
  'Solar Installation': {
    trade: 'Solar Installation',
    passingScorePercentage: 66,
    totalQuestions: 3,
    timeEstimate: '2 mins',
    questions: [
      {
        id: 'sl-1',
        question: 'What extreme electrical danger arises if an installer uncouples an MC4 solar connector while the PV string is carrying DC load?',
        options: [
          'AC breaker trips in the distribution panel',
          'Violent sustained DC electric arc flash that does not self-extinguish, causing severe burns and fire',
          'Solar panels immediately enter sleep mode safely',
          'Inverter switches to battery power seamlessly',
        ],
        correctIndex: 1,
        explanation: 'DC voltage does not have a zero-crossing like AC; disconnecting live high-voltage DC (up to 600-1000V) creates an intense plasma arc that can melt connectors and cause fatal flash burns.',
        conceptTag: 'DC Arc Flash Hazard',
      },
      {
        id: 'sl-2',
        question: 'What is the maximum permissible earth resistance value for solar rooftop frame structures and lightning arrestors?',
        options: [
          '50 to 100 ohms',
          'Less than 5 ohms (ideally < 1 ohm) with chemical earthing compound',
          'Solar panels do not require grounding because they are on the roof',
          '10 ohms',
        ],
        correctIndex: 1,
        explanation: 'Under MNRE guidelines, solar structure grounding and surge arrestors require a low-impedance path (< 5 ohms, ideally < 1 ohm) to safely route lightning strikes and leakage currents into ground.',
        conceptTag: 'Earthing & Lightning Protection',
      },
      {
        id: 'sl-3',
        question: 'Before commissioning a grid-tied rooftop solar system, what vital inverter safety test is required?',
        options: [
          'Anti-islanding protection test (inverter must shut down within 2 seconds of grid power failure to protect utility workers)',
          'Check if solar panels can charge mobile phones directly',
          'Verify inverter beeps every 5 minutes',
          'Maximum tilt angle measurement',
        ],
        correctIndex: 0,
        explanation: 'Anti-islanding ensures the solar system stops feeding electricity into the grid during a power outage; otherwise, lineworkers working on supposed "dead" lines could be fatally electrocuted.',
        conceptTag: 'Anti-Islanding & Grid Synchronization',
      },
    ],
  },
  'Sanitation & Drainage': {
    trade: 'Sanitation & Drainage',
    passingScorePercentage: 66,
    totalQuestions: 3,
    timeEstimate: '2 mins',
    questions: [
      {
        id: 'sn-1',
        question: 'Before opening deep septic tanks or underground inspection chambers, what lethal hazard must be addressed?',
        options: [
          'Low water temperature',
          'Lethal concentrations of sewer gases: Hydrogen Sulfide (H2S), Methane (CH4), and Oxygen deficiency',
          'Static electricity in drainage pipes',
          'High water turbidity',
        ],
        correctIndex: 1,
        explanation: 'Anaerobic decomposition produces toxic H2S (paralyzes olfactory nerve in seconds) and flammable Methane. Confined space entry without mechanical ventilation and gas testing is strictly prohibited.',
        conceptTag: 'Toxic Sewer Gas Hazards',
      },
      {
        id: 'sn-2',
        question: 'What is the mandatory protocol when cleaning residential society grease interceptor chambers?',
        options: [
          'Send an artisan into the pit without safety harness',
          'Forced mechanical air ventilation, gas meter clearance check, safety body harness with lifeline, and top surface observer',
          'Pour chemical acids and ignite grease scum',
          'Work in darkness to prevent bacteria growth',
        ],
        correctIndex: 1,
        explanation: 'Safe work procedures require 15-minute continuous mechanical air blower purging, tripod winch harness, and a trained standby watcher on the surface at all times.',
        conceptTag: 'Confined Space & Lifeline Protocol',
      },
      {
        id: 'sn-3',
        question: 'When operating high-pressure water jetting equipment on choked underground sewer lines, which nozzle design pulls the hose forward?',
        options: [
          'Nozzle with 100% forward-facing single needle jet',
          'Retro-jet nozzle with rearward-angled high-velocity water jets providing forward hydraulic thrust and backward debris flush',
          'Nozzle with side-only spray holes',
          'Oscillating fan spray nozzle',
        ],
        correctIndex: 1,
        explanation: 'Rearward-facing high-pressure jets (at 30° to 45°) propel the heavy hose forward deep into the drain pipe while the high-velocity water washes broken silt and grease cakes backward out of the chamber.',
        conceptTag: 'Hydro-Jetting Mechanics',
      },
    ],
  },
};

export function getTradeSkillCheck(trade: string): TradeSkillCheck {
  return TRADE_SKILL_CHECKS[trade] || TRADE_SKILL_CHECKS['Electrical'];
}

export function generateDigitalSeal(workerId: string, trade: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const tradeCode = (trade.slice(0, 3) || 'ART').toUpperCase();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  return `COOP-SEAL-${tradeCode}-${timestamp}-${randomSuffix}`;
}
