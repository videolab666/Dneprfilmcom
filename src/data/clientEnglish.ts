export interface ClientEnglishCopy {
  name?: string;
  shortName?: string;
  industryLabel: string;
  workDone: string;
  scope: string;
  location: string;
  quote?: string;
  quoteAuthor?: string;
}

export const CLIENTS_EN: Record<string, ClientEnglishCopy> = {
  'client-doors': {
    name: 'Ministry of Doors',
    shortName: 'MD',
    industryLabel: 'Industry & Export',
    workDone: '12,000 m² factory brand film',
    scope: 'FPV drone, Sony FX6 cinema cameras, sound design',
    location: 'Dnipro / EU export',
    quote: 'Filming inside an operating robotic workshop was completed without stopping the production line. The film helped secure four new dealer contracts in the EU.',
    quoteAuthor: 'Marketing Department',
  },
  'client-girtech': {
    industryLabel: 'Product Brand',
    workDone: 'Commercial for Bravo wood-fired ovens',
    scope: 'Food styling, macro cinematography, 4K 10-bit S-Log3',
    location: 'Kyiv / International sales',
    quote: 'After the campaign launched, pre-orders for the ovens increased by 38%. The fire and food textures were reproduced with excellent color accuracy.',
    quoteAuthor: 'E-commerce Lead',
  },
  'client-grandhouse': {
    industryLabel: 'Development & Residential',
    workDone: '24/7 construction monitoring of Riverside residential complex',
    scope: 'Heated weatherproof housing, crane-mounted timelapse, aerial panoramas',
    location: 'Dnipro riverfront',
    quote: 'The timelapse camera operated through two winters without a failure. Video reports increased remote sales at the excavation stage by 35%.',
    quoteAuthor: 'Lead Project Developer',
  },
  'client-ulka': {
    industryLabel: 'Export & Trade Shows',
    workDone: 'Presentation video for Dubai Expo',
    scope: 'Macro product filming, Aputure studio lighting, English voice-over',
    location: 'UAE, Dubai / Ukraine',
    quote: 'At our Dubai stand, the video attracted buyers from across the Middle East. The visual quality matched a European production standard.',
    quoteAuthor: 'Head of Global Sales',
  },
  'client-boxing-league': {
    industryLabel: 'Sports Broadcasts',
    workDone: 'Live boxing tournament broadcast (8 cameras)',
    scope: 'vMix OB production, Starlink + 4G bonding, Super Slow-Mo replay',
    location: 'Kyiv / YouTube Live',
    quote: 'The venue had no wired internet, yet the broadcast reached 520,000 viewers without freezes or connectivity failures.',
    quoteAuthor: 'League Executive Producer',
  },
  'client-helios': {
    name: 'Helios Health Center',
    industryLabel: 'Healthcare & Rehabilitation',
    workDone: 'Brand film about robotics and rehabilitation',
    scope: 'Sony FX3, silent operating-room filming, interviews',
    location: 'Dnipro',
    quote: 'The crew worked very discreetly without disturbing patients in intensive care. Appointment conversion increased by 42%.',
    quoteAuthor: 'Clinic Chief Physician',
  },
  'client-hyamax': {
    industryLabel: 'International Forums',
    workDone: 'Multicamera congress production and LED-screen live feed',
    scope: '10×4 m screen output with <50 ms latency, telephoto lenses',
    location: 'Parkovy Convention and Exhibition Center, Kyiv',
    quote: 'Detailed close-ups of complex injections were delivered clearly to 400 doctors in the hall. The recap film was ready within 24 hours.',
    quoteAuthor: 'Congress Organizing Committee',
  },
  'client-fit4you': {
    industryLabel: 'Sports & Fitness',
    workDone: 'Dynamic advertising promo for a fitness-club network',
    scope: '120fps slow motion, electronic stabilizers, contrast LED lighting',
    location: 'Network of 4 clubs',
    quote: 'The campaign performed strongly on Instagram and paid social. Membership sales beat the monthly target by 27%.',
    quoteAuthor: 'Commercial Director',
  },
  'client-playlist': {
    industryLabel: 'Concerts & Shows',
    workDone: 'Six-camera television multicam production',
    scope: 'Camera crane, 32-channel multitrack recording',
    location: 'Opera and Ballet Theatre',
    quote: 'The live sound mix was excellent, while the crane shots gave the production the feel of a polished European television show.',
    quoteAuthor: 'Artistic Director',
  },
  'client-agrotech': {
    industryLabel: 'Agribusiness & Grain Elevators',
    workDone: 'Presentation of a grain-elevator complex and harvesting campaign',
    scope: 'DJI Mavic 3 Cine aerial filming, field production',
    location: 'Central Ukraine',
    quote: 'We filmed the harvest across thousands of hectares. Golden-hour drone footage became part of the holding company investor presentation.',
    quoteAuthor: 'Holding Press Office',
  },
  'client-westgate': {
    industryLabel: 'Logistics & Class-A Warehouses',
    workDone: 'Aerial monitoring and promo of a 45,000 m² distribution center',
    scope: '3D orthophoto maps, roof inspection, presentation film',
    location: 'M-04 Highway',
    quote: 'High-quality media coverage of the logistics hub attracted international tenants before the second phase was commissioned.',
    quoteAuthor: 'Management Company',
  },
  'client-itcluster': {
    industryLabel: 'IT & Business Forums',
    workDone: 'Hybrid forum broadcast across 3 parallel streams',
    scope: 'Zoom room integration, simultaneous interpretation, 1080p60 streaming',
    location: 'Menorah Conference Center',
    quote: 'The complex three-hall setup with simultaneous English interpretation ran like clockwork.',
    quoteAuthor: 'Summit Coordinator',
  },
};

export const CLIENT_STATS_EN = [
  'Corporate clients',
  'Years of continuous production',
  'Successful live broadcasts',
  'Cashless corporate payments',
] as const;
