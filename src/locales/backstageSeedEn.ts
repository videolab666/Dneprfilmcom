import { BackstageItem } from '../types';

export const BACKSTAGE_SEED_EN: Record<string, Partial<BackstageItem>> = {
  'backstage-1': {
    title: 'Mobile OB Production Control Room',
    category: 'Control Room',
    tech: 'vMix Pro 4K + Blackmagic ATEM Constellation',
    description: 'The broadcast control center: a 16-source multiviewer, Slow Motion replay station, and dedicated graphics server.',
  },
  'backstage-2': {
    title: 'Camera Crew at the Ring and Stadium',
    category: 'Camera Operators',
    tech: 'Sony FX6 / FX9 + G Master Telephoto Cinema Optics',
    description: 'Camera operators work with wireless follow-focus systems and zero-latency intercom communication with the director.',
  },
  'backstage-3': {
    title: '12G-SDI Signal Routing & Redundancy',
    category: 'Signal Routing',
    tech: 'Armored Fiber-Optic Cables + Neutrik Converters',
    description: 'Protected cable ramps keep participants safe while the digital signal path remains clean and free from interference.',
  },
  'backstage-4': {
    title: 'Autonomous Connectivity Station & Starlink',
    category: 'Connectivity & Power',
    tech: 'Starlink Gen 2 + LiveU / Peplink Multi-SIM Bonding',
    description: 'A stable 50+ Mbps uplink even at stadiums and remote outdoor locations without wired internet access.',
  },
};
