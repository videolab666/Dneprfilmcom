import type { PageItemText } from '../data/pageContent';

/**
 * Curated English copy for legacy/default page CMS items that predate explicit
 * `en` fields. Runtime CMS `item.en` always wins over these fallbacks.
 */
export const PAGE_ITEM_EN_BY_ID: Record<string, PageItemText> = {
  // Video — hero / headings / FAQ
  'video-hero': {
    badge: 'Commercial & Corporate Production',
    title: 'Video that',
    meta1: 'communicates the value',
    meta2: 'of your business',
    description: 'We create premium commercials, presentation films for factories and enterprises, content for international exhibitions such as Dubai Expo, and dynamic promotional videos. From concept and storyboard to DaVinci color grading and 3D graphics.',
    meta3: 'Estimate video production',
    items: ['400+|Video projects produced', '4K 10-bit|Sony Cinema Line', '10–20 days|Full-cycle production', '100%|On-time delivery'],
  },
  'video-heading-works': {
    badge: 'Real work from our studio portfolio',
    title: 'Selected commercial & promotional projects',
    description: 'Every video solves a specific business task: entering export markets, attracting dealers, increasing website conversion, or building a strong brand image.',
  },
  'video-heading-faq': { badge: 'Questions & answers', title: 'Video production FAQ' },
  'video-faq-1': {
    title: 'How long does a commercial or brand film take to produce?',
    description: 'A standard commercial or industrial promo takes 10–20 business days. When a project is urgent for an exhibition or event, we can deliver in 5–7 days by assigning two editing stations in parallel.',
  },
  'video-faq-2': {
    title: 'What equipment do you use for video production?',
    description: 'We work with professional cinema and broadcast equipment: Sony Cinema Line cameras (FX9, FX6, FX3) with 10-bit 4:2:2 color, fast cinema lenses, Ronin stabilizers, conventional and FPV drones, Aputure lighting, and Sennheiser/Rode wireless microphones.',
  },
  'video-faq-3': {
    title: 'Can you help with the idea, script and casting?',
    description: 'Yes. We provide a complete turnkey production cycle: 2–3 creative concepts, script and voice-over copy, casting of professional actors or models, location scouting, and the required production permissions.',
  },
  'video-faq-4': {
    title: 'How is the video adapted for Instagram Reels, TikTok and YouTube?',
    description: 'Editing is planned for every target platform. You receive a 16:9 4K master for web, TV and YouTube, plus optimized 9:16 vertical versions with platform-aware framing and animated captions for social media.',
  },

  // Video — portfolio
  girtech: {
    title: 'Advertising — Girtech Bravo',
    meta1: 'Girtech (Wood-Fired Ovens & Grills)',
    meta2: 'Product Advertising & Food Styling',
    description: 'A staged commercial for compact Girtech Bravo ovens: macro shots of Neapolitan pizza and steak preparation, live fire, and the atmosphere of a warm family getaway.',
    items: ['Cinema lenses', 'Macro filming', 'Food stylist', 'DaVinci color grading'],
    result: 'A high-converting campaign asset for international marketplaces and social media.',
  },
  'ministry-doors': {
    title: 'Ministry of Doors — Factory Promo',
    meta1: 'Ministry of Doors Factory',
    meta2: 'Brand Film & Industrial Production',
    description: 'A dynamic film about high-tech entrance-door manufacturing: robotic welding, laser metal cutting, automated paint lines, and strict five-stage quality control.',
    items: ['FPV drone inside the factory', '4K 10-bit', 'Ronin stabilizers', 'Industrial sound design'],
    result: 'A sales tool for dealers and export partners at construction exhibitions.',
  },
  'ulka-dubai': {
    title: 'ULKA — Dubai Expo Presentation',
    meta1: 'ULKA (Beauty Equipment)',
    meta2: 'International Exhibitions & Export',
    description: 'A premium presentation film for a Dubai Expo booth, showcasing equipment for beauty professionals with an emphasis on form, ergonomics and European certification.',
    items: ['Gloss & minimalism', 'Aputure lighting', 'English voice-over', 'Motion graphics'],
    result: 'New distributor leads across the Middle East and Europe.',
  },
  'helios-medical': {
    title: 'Helios Center — Medical Promo',
    meta1: 'Helios Family Health & Rehabilitation Center',
    meta2: 'Medical Video Production',
    description: 'A warm, technology-focused rehabilitation-center promo showing robotic training systems, attentive medical care, and a clean cinematic image with soft lighting.',
    items: ['Doctor interviews', 'Filming in clinical areas', 'Soft lighting', 'Emotional storytelling'],
    result: 'More first-consultation bookings and stronger patient trust.',
  },
  'hyamax-conf': {
    title: 'HYAMAX Conference — Large-Scale Business Event',
    meta1: 'HYAMAX Aesthetic Academy',
    meta2: 'Event Film & Production',
    description: 'A dynamic report from an international aesthetic-medicine conference: masterclasses by leading plastic surgeons, authentic audience reactions, speaker interviews and the evening show program.',
    items: ['3 camera operators', 'Wireless-mic interviews', 'Fast-turnaround editing', '24-hour highlight video'],
    result: 'Immediate social reach and advance ticket sales for the following year.',
  },
  fit4you: {
    title: 'Fit4you — Energy in Motion',
    meta1: 'Fit4you Fitness Club Network',
    meta2: 'Dynamic Retail & Fitness Promo',
    description: 'An energetic promo focused on movement, modern strength equipment, personal training and Pole Dance group programs, edited tightly to a high-impact soundtrack.',
    items: ['Speed ramping', '120 fps slow motion', 'Neon lighting', 'Dynamic editing'],
    result: 'A seasonal membership campaign that exceeded the sales target.',
  },
  'video-step-1': { badge: '01', title: 'Pre-production', subtitle: 'The foundation of the film', description: 'Creative concept development, shot-by-shot script and director treatment, storyboard, location scouting, casting and an accurate production schedule and estimate.' },
  'video-step-2': { badge: '02', title: 'Production', subtitle: 'Work on set', description: 'A production crew with Sony FX9 / FX3 cinema cameras, cinema lenses, Aputure/Nanlite lighting, location sound, an FPV-drone operator and coordinated direction.' },
  'video-step-3': { badge: '03', title: 'Post-production', subtitle: 'Editing, polish and finishing', description: 'Rough and final editing, professional color grading in DaVinci Resolve, multichannel sound design, studio voice-over, and 2D/3D motion graphics.' },
  'video-step-4': { badge: '04', title: 'Adaptation & Delivery', subtitle: 'Ready formats for every channel', description: 'Final ProRes / 4K H.265 masters and platform adaptations: 16:9 for TV and YouTube, 9:16 for Reels/TikTok and 1:1 for social, plus an archived project backup.' },

  // Construction — hero / headings
  'construction-hero': {
    badge: 'Engineering media monitoring for developers',
    title: 'Construction media monitoring',
    meta1: '& 4K aerial monitoring',
    description: 'Autonomous 4K timelapse 24/7 in IP67 weatherproof housings, repeatable GPS drone flights, 3D aerial panoramas from future apartment window heights, and video reports for investors and banks.',
    items: ['IP67 housings (-25°C to +50°C)', 'Repeatable GPS flight paths', 'Cloud access for technical supervision', 'Full-project media archive'],
  },
  'construction-heading-solutions': { badge: 'Integrated service', title: 'Media monitoring tools' },
  'construction-heading-works': { badge: 'Field practice', title: 'Construction monitoring projects' },
  'construction-heading-workflow': { badge: 'Process', title: 'How site monitoring is launched' },
  'construction-heading-faq': { badge: 'Questions', title: 'Construction monitoring FAQ' },

  // Construction — solutions
  timelapse: {
    title: 'Autonomous 4K Timelapse 24/7', subtitle: 'Continuous monitoring through months and seasons', badge: '24/7',
    description: 'Professional high-resolution cameras installed in IP67 thermal housings with heated glass and protection from construction dust, precipitation and crane vibration.',
    items: ['4K Ultra HD frames every 5–15 minutes, around the clock', '220V power with autonomous UPS backup', '4G/LTE upload to a cloud dashboard', 'A dynamic 2–3 minute construction film from day one to completion'],
  },
  'drone-inspection': {
    title: 'Scheduled GPS Drone Monitoring', subtitle: 'High-precision aerial progress capture', badge: '1–2 times per month',
    description: 'The site is flown on programmed GPS coordinates so camera position, altitude and angle remain consistent across visits for accurate visual comparison of progress.',
    items: ['Experienced pilots and required flight approvals', 'Cinematic orbit flights and orthophoto plans', 'Seamless before/after transitions for marketing', 'Video inspection of hard-to-reach roof and facade areas'],
  },
  'panoramas-360': {
    title: '3D Aerial Panoramas from Future Windows', subtitle: 'A powerful sales tool for residential projects', badge: 'For sales teams',
    description: 'Interactive 360-degree aerial panoramas captured at the exact height of future floors, even while the project is still at foundation or structural-frame stage.',
    items: ['Buyers see the real bedroom-window view years before handover', 'Show sunrises, sunsets, parks and the city skyline', 'Embed on the developer website and sales tablets', 'Increase conversion for upper-floor apartment reservations'],
  },
  'bank-audit': {
    title: 'Video Audit for Investors & Banks', subtitle: 'Independent visual evidence of progress', badge: 'Supervision & Banking',
    description: 'Structured monthly video reports with infographics and verified quantities of completed work.',
    items: ['Track compliance with the general contractor schedule', 'Formal reporting for bank credit committees', 'Photo/video archive of concealed works', 'Protect the developer in contractor disputes'],
  },
  'marketing-reels': {
    title: 'Marketing Videos for Social Media', subtitle: 'Fresh content for Instagram, YouTube & TikTok', badge: 'SMM & Advertising',
    description: 'Monthly production of vertical Reels/Shorts and horizontal videos to sustain buyer interest and support the developer’s social channels.',
    items: ['Energetic editing to current audio trends', 'Progress-status titles and special-offer graphics', 'Facade filming during premium evening light', 'Formats for mobile screens and city LED billboards'],
  },
  'live-stream': {
    title: 'Live Construction Stream for Your Website', subtitle: 'Transparency that builds investor trust', badge: 'Live stream',
    description: 'A stable protected video feed from the construction site embedded into the residential project website or investor portal.',
    items: ['Ad-free adaptive-bitrate player', 'Compatible with common CMS platforms and mobile browsers', 'Internet redundancy through 4G/LTE modems', 'Higher buyer confidence through transparent progress'],
  },
  'construction-workflow-1': { badge: '01', title: 'Engineering site survey', description: 'On-site survey to choose camera mounting points such as tower cranes, adjacent buildings or masts, measure viewing angles and verify power sources.' },
  'construction-workflow-2': { badge: '02', title: 'Weatherproof installation & channel launch', description: 'Install sealed IP67 equipment, protected cabling, autonomous controllers and redundant cloud storage for captured frames.' },
  'construction-workflow-3': { badge: '03', title: 'GPS flight-point calibration', description: 'Define precise coordinates for recurring drone flights and save repeatable trajectories for identical viewpoints throughout the project.' },
  'construction-workflow-4': { badge: '04', title: 'Monthly media package', description: 'Deliver ready assets to marketing and technical supervision: accelerated monthly timelapse, high-resolution photo report, aerial video and finished Reels.' },
  'construction-faq-1': { title: 'What happens to the timelapse camera during a site power outage?', description: 'Our systems include UPS backup. Short outages do not interrupt capture; during a long outage the system safely preserves its buffer and automatically resumes recording and cloud synchronization when power returns.' },
  'construction-faq-2': { title: 'How does the equipment handle frost, rain and cement dust?', description: 'Cameras are installed in industrial IP67 thermal housings with automatic front-glass heating and weather shields. The operating range is -25°C to +50°C.' },
  'construction-faq-3': { title: 'Are drone flights legal and do you have the required permissions?', description: 'Our UAV operators have the required qualifications and field experience. Before every flight we coordinate procedures with site management and security and follow current aviation requirements.' },
  'construction-faq-4': { title: 'How does the sales team receive the 3D aerial window-view panoramas?', description: 'We provide an interactive HTML5 widget that can be embedded into the development website or opened on a sales manager’s iPad. Buyers can rotate 360°, zoom and switch between floors.' },
  'construction-faq-5': { title: 'How often does the marketing team receive finished videos?', description: 'The standard schedule is once per month, delivered 2–3 days after the planned shoot. Urgent releases can be delivered within 24 hours when required.' },

  // Construction — projects
  'case-riverside': {
    title: 'Construction Monitoring & 3D Panoramas — Riverside Residence', meta1: '24-storey comfort-class residential complex', meta2: 'Grand House Development Group', meta3: '24 months of monitoring, from excavation to handover',
    description: 'Year-round monitoring of a 24-storey monolithic-frame complex using two autonomous 4K timelapse cameras on tower cranes, monthly GPS drone flights and virtual 3D panoramas from future apartment windows.',
    items: ['2 timelapse points 24/7', 'GPS-referenced drone flights', '3D views from floors 5–24', 'Monthly Reels'], result: '+35% remote apartment sales during the structural stage, supported by interactive view panoramas.',
  },
  'case-logistics': {
    title: 'West Gate Hub Logistics Complex', meta1: 'Class A industrial & warehouse park (35,000 m²)', meta2: 'Logistics Capital Investment Group', meta3: '14 months of active construction',
    description: 'Video audit of steel erection, sandwich-panel installation and concrete flooring, with progress tracking for the bank’s credit committee.',
    items: ['IP67 housings on masts', 'Roof orthophoto plans', 'General contractor schedule control', '4K timelapse film'], result: 'Full transparency for the financing bank and anchor tenants attracted before commissioning.',
  },
  'case-cottage': {
    title: 'Green Hills Gated Cottage Community', meta1: 'Premium community: 42 homes plus infrastructure', meta2: 'Green Hills Development', meta3: '18 months',
    description: 'Media coverage of utilities, road construction and villa development, plus landscaping and amenity visualization for the premium sales team.',
    items: ['Golden-hour aerial filming', 'FPV fly-throughs between homes', 'Interactive plot map', 'Investor presentation film'], result: 'The first phase sold out within six months of the advertising campaign launch.',
  },

  // Photo — hero / headings
  'photo-hero': {
    badge: 'Professional Photography • Alexander Pitel', title: 'Impeccable images for business, interiors and life',
    description: 'From precise geometry in premium interiors and appetizing restaurant photography to genuine family emotion and cinematic weddings. Full-frame optics, mobile lighting and deep color grading.',
    meta1: 'View photo gallery', meta2: 'Estimate photography cost',
    items: ['Preview within 48 hours', 'Sony G-Master & lighting', 'Accurate architectural geometry', 'COMBO: Video + Photo'],
  },
  'photo-heading-gallery': { title: 'Selected photography', description: 'Choose a category to evaluate our color treatment, composition and level of detail.' },
  'photo-heading-packages': { title: 'Photography packages & pricing' },
  'photo-heading-booking': { title: 'Book a shoot' },

  // Photo — gallery
  'photo-int-1': { title: 'Penthouse Living Room with Panoramic Glazing', meta1: 'Interiors & Architecture', meta2: 'Riverside Residence', description: 'Interior photography in natural light, retaining detail in the exterior view and the textures of wood and marble.', badge: 'Sony A7 IV + 16-35mm GM, HDR Bracketing' },
  'photo-int-2': { title: 'Saffron Signature-Cuisine Restaurant', meta1: 'Interiors & Architecture', meta2: 'City Center', description: 'Evening restaurant ambience with accent lighting, warm intimate atmosphere and carefully corrected vertical geometry.', badge: 'Tripod shooting, long exposure' },
  'photo-int-3': { title: 'Minimalist Villa at Sunset', meta1: 'Interiors & Architecture', meta2: 'Cottage Development', description: 'Architectural exterior photography during blue hour with landscape lighting and reflections in the pool.', badge: 'Golden Hour + DJI Mavic 3 Cine' },
  'photo-int-4': { title: 'Minimalist Bedroom with Walk-In Wardrobe', meta1: 'Interiors & Architecture', meta2: 'Private Design Project', description: 'Soft diffused morning light with emphasis on textiles, linen and natural oak textures.', badge: 'Polarizing Filter, 24-70mm GM' },
  'photo-food-1': { title: 'Dry-Aged Ribeye over Charcoal', meta1: 'Food Photography & Menu', meta3: 'Steakhouse & Grill', description: 'Macro detail of a caramelized crust, fresh rosemary, coarse sea salt and the natural sheen of the steak.', badge: '90mm Macro f/2.8, Profoto stripbox' },
  'photo-food-2': { title: 'Neapolitan Pizza from a Wood-Fired Oven', meta1: 'Food Photography & Menu', meta3: 'Girtech BBQ & Ovens', description: 'Leopard-spotted crust, fresh basil, melted mozzarella di bufala and live fire in the background.', badge: 'Strobe lighting with rim reflector' },
  'photo-food-3': { title: 'Pavlova with Forest Berries', meta1: 'Food Photography & Menu', meta3: 'Pastry Studio', description: 'Crisp meringue, airy mascarpone cream, berry coulis and fresh mint for a seasonal menu.', badge: 'Soft octabox, texture accent lighting' },
  'photo-food-4': { title: 'Craft Cocktail with a Citrus Twist', meta1: 'Food Photography & Menu', meta3: 'Cocktail Bar', description: 'Crystal-clear ice, condensation on the glass and rich amber tones in the drink.', badge: 'Backlit contour lighting' },
  'photo-kids-1': { title: 'Blowing Out the Candles at a Fifth Birthday', meta1: "Children's Events", meta2: 'Kids Club', description: 'Authentic emotion, candlelight, birthday cake and the excitement of the birthday child.', badge: 'Fast eye autofocus, f/1.8' },
  'photo-kids-2': { title: 'Bubble Show & Confetti', meta1: "Children's Events", meta2: 'Amusement Park', description: 'A dynamic documentary frame: rainbow bubbles in motion, children smiling and live entertainment.', badge: '1/1000s shutter, instant action capture' },
  'photo-kids-3': { title: 'Family Session in an Apple Orchard', meta1: "Children's Events", meta2: 'Outdoor Location', description: 'Warm natural family interaction in golden sunset light without stiff posing.', badge: '85mm f/1.4 GM, artistic bokeh' },
  'photo-wed-1': { title: 'Sunset Ceremony by the Water', meta1: 'Weddings & Love Story', meta2: 'Riverside Yacht Club', description: 'An emotional exchange of vows, a floral arch and the golden light of sunset.', badge: 'Two-camera setup, fast lenses' },
  'photo-wed-2': { title: 'Bridal Morning: Soft Light & Dress Details', meta1: 'Weddings & Love Story', meta2: 'Grand Palace Hotel', description: 'Soft window light, lace texture, wedding rings and genuine anticipation before the ceremony.', badge: '50mm f/1.2 GM, natural light' },
  'photo-wed-3': { title: 'First Dance under Spark Fountains', meta1: 'Weddings & Love Story', meta2: 'Banquet Hall', description: 'Cold spark fountains, low fog, a romantic first dance and documentary reactions from guests.', badge: 'Radio-triggered flash setup' },
  'photo-corp-1': { title: 'Executive Portrait in the Office', meta1: 'Business & Event Coverage', meta2: 'Sky Business Center', description: 'A confident, approachable business portrait for the company website, Forbes and business publications.', badge: 'Mobile softbox, natural background' },
  'photo-corp-2': { title: 'Speaker at a Business Forum', meta1: 'Business & Event Coverage', meta2: 'Conference Hall', description: 'Documentary coverage of a keynote with stage screens, audience reaction and authentic speaker emotion.', badge: '70-200mm f/2.8 GM II, no flash' },

  // Photo — packages
  'pack-interior': { title: 'Interiors & Architecture', subtitle: 'For hotels, restaurants, developers and designers', meta1: 'from ₴4,000', meta2: 'per property, up to 15–25 angles', badge: 'Popular in real estate', items: ['Ultra-wide photography without distortion', 'Vertical alignment and perspective correction', 'HDR bracketing to preserve window views', 'Capture One color grading + detailed retouching', 'Photos ready within 48 hours', 'Commercial usage rights included'] },
  'pack-food': { title: 'Food Photography & Menu', subtitle: 'For restaurants, delivery services and marketplaces', meta1: 'from ₴4,500', meta2: 'per session, up to 20 dishes', badge: 'For HoReCa', items: ['Mobile studio lighting on location', 'Macro capture of texture and ingredient freshness', 'Shooting synchronized with the chef’s plating', 'Deep color grading and background cleanup', 'Formats for menus, delivery platforms and advertising', 'First 5 photos delivered on the shooting day'] },
  'pack-events': { title: "Children's Events & Celebrations", subtitle: 'Birthdays, anniversaries, corporate events and graduations', meta1: 'from ₴2,000', meta2: 'per shooting hour, minimum 2 hours', badge: 'Real emotion', items: ['Fast documentary coverage of authentic emotion', 'All key moments: cake, entertainment and shows', 'Family group portraits with guests', 'Color grading of all successful frames, typically 80–100 per hour', 'Private online gallery for guests', '15-photo preview within 24 hours'] },
  'pack-wedding': { title: 'Wedding Day & Love Story', subtitle: 'Full-day coverage or an intimate ceremony', meta1: 'from ₴12,000', meta2: 'package from preparations through the cake', badge: 'A special day', items: ['Timeline and location consultation', 'Preparations, ceremony, reception and dancing', 'Full-frame cinema lenses with beautiful bokeh', '500+ edited photographs with signature color', 'Delicate editorial retouching for key portraits', 'Branded online gallery hosted for one year'] },
  'pack-combo': { title: 'COMBO: Video + Photo in One Day', subtitle: 'Complete media coverage without duplicated costs', meta1: 'from ₴14,000', meta2: 'special bundled rate', badge: 'Chosen by 75% of clients', items: ['Coordinated camera and photo crews without conflicts', 'Unified color profile across video and photography', 'Save up to 25% versus separate bookings', 'Dynamic Full HD / 4K video plus photo series', 'Vertical Reels/Shorts included', 'One contract and one responsible producer'] },

  // About
  'about-heading-milestones': { badge: 'History', title: 'Dneprfilm milestones' },
  'about-heading-principles': { badge: 'Principles', title: 'How we work' },
  'about-2012': { badge: '2012', title: 'Launch of film and documentary production', description: 'First commercial films, music videos and documentary projects, with the initial professional equipment base established.' },
  'about-2016': { badge: '2016', title: 'Own mobile broadcast unit introduced', description: 'Transition to television-grade live production, including multicamera broadcasts for boxing, MMA and basketball leagues.' },
  'about-2019': { badge: '2019', title: 'Expansion into industrial & construction media', description: 'Construction Media launched: year-round tower-crane timelapse, 3D orthophoto plans and promotional films for industrial facilities.' },
  'about-2022-2026': { badge: '2022–2026', title: 'Starlink autonomy & international broadcasting', description: 'Full power and connectivity independence for mobile production, with shoots and hybrid broadcasts across Ukraine, the EU and the UAE, including Dubai Expo.' },
  'principle-zero-failure': { title: 'Zero Failure Protocol', description: 'There is no second take in a live broadcast. Every critical node — power, internet, production control and recording — is fully redundant.' },
  'principle-cinema': { title: 'Broadcast reliability with a cinematic image', description: 'We do more than place cameras: we design lighting, select cinema optics and build a deliberate sound environment.' },
  'principle-owner': { title: 'Personal producer responsibility', description: 'Alexander Pitel personally oversees every project, from the first call and estimate approval to the final master.' },
  'principle-nda': { title: 'Data protection & NDA', description: 'Strict confidentiality is built into the workflow. Restricted industrial and defense-related facilities remain protected under agreed access and disclosure rules.' },
};
