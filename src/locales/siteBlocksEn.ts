import { SiteBlock } from '../types';

export const DEFAULT_SITE_BLOCKS_EN: SiteBlock[] = [
  {
    id: 'block-stats',
    title: 'Key Studio Metrics',
    type: 'stats_counter',
    order: 1,
    isActive: true,
    page: 'home',
    config: {
      heading: 'Reliability Facts & Figures',
      subheading: 'Real quality metrics from 7 years of production at major venues across the country',
      style: 'dark',
      items: [
        { value: '450+', title: 'Live Broadcasts', description: 'Sports, business forums, concerts' },
        { value: '0 sec', title: 'Broadcast Downtime', description: 'Protected by dual redundancy' },
        { value: '4K 60fps', title: 'Broadcast Standard', description: 'Clean digital 12G-SDI signal path' },
        { value: '100 Mbps', title: 'Starlink Uplink', description: 'Autonomous streaming from virtually any location' },
      ],
    },
  },
  {
    id: 'block-tech-advantage',
    title: 'Technical Advantage',
    type: 'text_image',
    order: 2,
    isActive: true,
    page: 'home',
    config: {
      badge: 'Broadcast Engineering',
      heading: 'Why Our Broadcasts Stay On Air',
      content: 'Every deployment includes guaranteed backup power with an online pure-sine-wave UPS, a Starlink Gen 2 satellite terminal, and 4G multibonding across four independent mobile operators. Even if venue power or wired internet fails, the audience stays connected without a visible interruption.',
      imageUrl: 'https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?auto=format&fit=crop&q=80',
      imagePosition: 'right',
      buttonText: 'Configure Your OB Setup',
      buttonLink: '/live#calc-section',
      style: 'light',
    },
  },
  {
    id: 'block-faq',
    title: 'Frequently Asked Questions',
    type: 'faq',
    order: 3,
    isActive: true,
    page: 'home',
    config: {
      heading: 'Frequently Asked Questions',
      subheading: 'Everything you need to know before booking a live broadcast, video production, or 3D tour',
      style: 'light',
      faqItems: [
        {
          question: 'How much time is required to set up the OB production system on location?',
          answer: 'A standard load-in, control-room setup, protected cable routing, and camera configuration takes approximately 3–5 hours before the event starts. For major festivals and tournaments, we normally complete the technical check-in the evening before.',
        },
        {
          question: 'What happens if the venue loses power completely?',
          answer: 'Our production control system and critical cameras are powered through industrial online double-conversion UPS units. If utility power fails, equipment continues on batteries immediately while the autonomous generator is brought online.',
        },
        {
          question: 'Can you stream simultaneously to YouTube, Facebook, and a private Zoom session or corporate platform?',
          answer: 'Yes. Our media server supports simultaneous multistreaming to multiple destinations without reducing the source bitrate, including protected corporate portals and authenticated CDN endpoints.',
        },
        {
          question: 'Does the production crew travel to other cities and countries?',
          answer: 'Yes. We regularly work in Kyiv, Dnipro, Lviv, Odesa, Kharkiv, and across Europe with a complete set of certified production equipment.',
        },
      ],
    },
  },
  {
    id: 'block-cta-banner',
    title: 'Project Call-to-Action Banner',
    type: 'cta',
    order: 4,
    isActive: true,
    page: 'home',
    config: {
      heading: 'Planning an Event or Production?',
      subheading: 'Receive a detailed technical rider and preliminary estimate within 30 minutes.',
      buttonText: 'Contact Alexander Pitel',
      buttonLink: '#contact-cta',
      secondaryButtonText: 'Open the LIVE Calculator',
      secondaryButtonLink: '/live',
      style: 'indigo',
    },
  },
];
