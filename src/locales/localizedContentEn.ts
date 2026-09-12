import { CaseStudy, Testimonial, BackstageItem } from '../types';

export const CASE_TRANSLATIONS_EN: Record<string, Partial<CaseStudy>> = {
  'case-girtech': {
    title: 'Advertising — Girtech Bravo: Wood-Fired Ovens & Family Grill',
    categoryLabel: 'Product Advertising & Food Styling',
    description: 'A staged commercial for compact wood-fired ovens. Macro cinematography of Neapolitan pizza and juicy steak, live fire, and the warm atmosphere of a family getaway.',
    challenge: 'Make the food look irresistible while preserving the texture of the crisp dough and the heat of a live flame without clipping the cinema camera sensor.',
    solution: 'Shot on Sony cinema cameras in 10-bit S-Log3 with macro cinema lenses, Aputure studio lighting, an on-set food stylist, and precise color grading in DaVinci Resolve.',
    result: 'The commercial was adapted for TV, YouTube, and international marketplaces including Amazon and Rozetka, with a substantial increase in direct pre-orders recorded after launch.',
    metrics: [
      { label: 'Color Pipeline', value: '4K 10-bit 4:2:2' },
      { label: 'Formats', value: '16:9 + 9:16 Reels' },
      { label: 'Conversion', value: '+38% orders' },
    ],
  },
  'case-doors': {
    title: 'Ministry of Doors Factory: Automated Manufacturing Promo',
    categoryLabel: 'Industrial Production',
    description: 'A large-scale brand film covering the full entrance-door manufacturing cycle: laser cutting of rolled steel, robotic welding, powder-coating lines, and geometry quality control.',
    challenge: 'Show the scale of the factory and the precision of its high-tech processes while production continued uninterrupted in loud industrial workshops.',
    solution: 'A combination of high-speed FPV drone flights through production lines, Ronin stabilizers, layered industrial sound design, and professional voice-over.',
    result: 'The film became a key presentation asset at EU construction trade shows and supported expansion of the dealer network into four new regions.',
    metrics: [
      { label: 'Location', value: '12,000 m² of workshops' },
      { label: 'FPV Aerial Filming', value: 'Inside production halls' },
      { label: 'Audience', value: 'Dealers & developers' },
    ],
  },
  'case-live-boxing': {
    title: 'International Combat Sports Tournament: 8 Cameras, 4K Broadcast & Live Replay',
    categoryLabel: 'Sports Television Broadcast',
    description: 'A live multicamera broadcast of the headline title fight with synchronized score graphics, instant Super Slow-Mo knockdown replays, and a dedicated commentary audio path.',
    challenge: 'The remote sports venue had no stable fiber connection, while broadcasters required a resilient low-latency live signal.',
    solution: 'We deployed a mobile vMix 4K OB setup, Starlink Gen 2 bonded with 4G LiveU, eight SDI cameras over optical runs up to 300 meters, and a dedicated replay station.',
    result: 'A fully stable uninterrupted broadcast to YouTube and OTT platforms reached more than 520,000 viewers without a single outage.',
    metrics: [
      { label: 'Cameras', value: '8 SDI cameras' },
      { label: 'Connectivity', value: 'Starlink + LiveU' },
      { label: 'Audience', value: '520k+ Live' },
    ],
  },
  'case-timelapse-bartolomeo': {
    title: 'Bartolomeo Resort Town: Two-Year 4K Timelapse at 90 m & 3D Panoramas',
    categoryLabel: 'Construction Monitoring & 3D',
    description: 'Long-term continuous monitoring of premium residential towers on the Dnipro riverfront using all-weather cameras with heated glass and monthly aerial surveys of facade progress.',
    challenge: 'Protect the optical systems from extreme wind, rain, construction dust, and power interruptions at high elevation.',
    solution: 'IP67 heated enclosures with glass-cleaning systems were mounted on lighting masts and tower cranes, with autonomous 4G connectivity for daily uploads to the client cloud server.',
    result: 'The project produced a striking final timelapse film for investors, while interactive apartment-view panoramas helped accelerate penthouse sales.',
    metrics: [
      { label: 'Monitoring Period', value: '24 months' },
      { label: 'Capture Interval', value: 'Every 10 min' },
      { label: 'Timelapse Quality', value: 'Clean 4K HDR' },
    ],
  },
  'case-medical-forum': {
    title: 'Ukrainian Surgical Congress: Teleconference, 3 Halls & Live Operating-Room Feed',
    categoryLabel: 'Medical Broadcasts',
    description: 'A complex hybrid medical-congress broadcast with a live surgery feed over a 4K optical path capable of showing fine tissue structures in detail.',
    challenge: 'Strict operating-room sterility requirements, silent equipment operation, and crystal-clear endoscopic image reproduction.',
    solution: 'Remotely controlled Sony 4K PTZ cameras on medical consoles kept operators outside the sterile zone, while the laparoscope video output was integrated directly into the production switcher.',
    result: 'More than 3,800 surgeons from 14 countries joined the stream and asked the operating professor questions in real time with synchronized audio.',
    metrics: [
      { label: 'Parallel Venues', value: '3 halls + operating room' },
      { label: 'Online Participants', value: '3,800+ doctors' },
      { label: 'Signal Latency', value: '< 0.3 sec' },
    ],
  },
  'case-smart-showroom': {
    title: 'Interactive 3D Virtual Tour of a Business-Class Showroom',
    categoryLabel: '3D Scans & Matterport',
    description: 'A high-accuracy digital twin of residential interiors with interactive material information points, floor-plan views, and VR-headset support.',
    challenge: 'Eliminate scanning artifacts caused by mirrored and glossy surfaces when using infrared LiDAR systems.',
    solution: 'LiDAR spatial scanning was combined with manual HDR photography in difficult backlight and post-production geometry cleanup.',
    result: 'Clients could select finishes and furnishings remotely, while average website session time increased from 1.5 to 8.2 minutes.',
    metrics: [
      { label: 'Measurement Accuracy', value: 'Up to 1 cm' },
      { label: 'Scan Positions', value: '142 locations' },
      { label: 'Engagement', value: '8.2 min on site' },
    ],
  },
};

export const TESTIMONIALS_TRANSLATIONS_EN: Record<string, Partial<Testimonial>> = {
  'test-1': {
    author: 'Serhii Kovalchuk',
    role: 'Vice President',
    company: 'Sports & Combat Federation',
    project: 'Three-day national tournament broadcast (6 cameras, replays)',
    quote: 'There are no second takes in sport. Alexander Pitel’s team delivered at a top television standard: instant replays of decisive knockdowns, clean commentary audio, and rock-solid streaming even during venue connectivity issues thanks to their Starlink backup.',
  },
  'test-2': {
    author: 'Olena Voropaieva',
    role: 'Chief Operating Officer',
    company: 'EventHub Global Conferences',
    project: 'Hybrid business forum across 3 halls with 3,500 online participants',
    quote: 'The main advantage of working with LIVE & VIDEO is complete peace of mind for the organizer. We handed over the technical requirements for streaming, sound, and screens and did not have to worry about the production. Speakers from London connected smoothly and the presentations looked excellent in 4K.',
  },
  'test-3': {
    author: 'Dmytro Melnyk',
    role: 'Marketing Director',
    company: 'Investment & Development Group',
    project: '18 months of construction aerial filming, timelapse, and 3D showroom tours',
    quote: 'For a developer, having one reliable contractor for the entire construction cycle is critical. Alexander and his team consistently delivered impressive 4K footage, while their interactive 3D tour increased apartment sales to clients from other cities by 38%.',
  },
};

export const BACKSTAGE_TRANSLATIONS_EN: Record<string, Partial<BackstageItem>> = {
  'bs-1': {
    title: 'Mobile vMix 4K Pro OB Control Room',
    category: 'Production Control',
    tech: '12G-SDI / Blackmagic ATEM / Elgato StreamDeck XL',
    description: 'The heart of the live broadcast: eight ProRes recording channels, live graphics, a three-display multiview system, and instant director communication with every camera operator.',
  },
  'bs-2': {
    title: 'Starlink Gen 2 Satellite Terminal + Bonding',
    category: 'Internet Redundancy',
    tech: 'Starlink Maritime / 4x 4G LTE LiveU Bonding',
    description: 'Even if venue power or the wired ISP fails, the stream remains protected by satellite backup and aggregation of multiple mobile networks.',
  },
  'bs-3': {
    title: 'Sony Cinema Line Camera Rigs',
    category: 'Cameras',
    tech: 'Sony FX6 / FX3 / Cine Lenses / Teradek Bolt 4K',
    description: 'Wireless transmission of uncompressed 4K video with near-zero latency at distances up to 300 meters, allowing camera operators to move freely around a hall or stadium.',
  },
  'bs-4': {
    title: 'Super Slow-Mo Replay Station',
    category: 'Instant Replay',
    tech: 'vMix Replay / Blackmagic HyperDeck / JLCooper Controller',
    description: 'Capture from up to four independent angles at 120 fps, with key moments ready for replay on air within seconds of the action.',
  },
  'bs-5': {
    title: 'Hollyland Solidcom C1 Pro Wireless Intercom',
    category: 'Intercom',
    tech: 'Full-Duplex Intercom / ENC Noise Cancellation',
    description: 'Clear two-way radio communication between the director, sound engineer, and camera operators at stadiums and loud festivals over distances up to 350 meters.',
  },
  'bs-6': {
    title: 'Online Double-Conversion Backup Power',
    category: 'Power Redundancy',
    tech: 'Pure Sine Wave UPS 6kVA + EcoFlow Pro',
    description: 'Zero transfer time during voltage fluctuations or utility outages. Switchers, broadcast servers, and network equipment remain protected by guaranteed backup power.',
  },
};
