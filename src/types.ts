export type Locale = 'uk' | 'ru' | 'en';

export type CaseMediaType = 'image' | 'youtube' | 'vimeo' | 'video';

export interface CaseMediaItem {
  id: string;
  type: CaseMediaType;
  url: string;
  thumbnailUrl?: string;
  storagePath?: string;
  title?: string;
  title_uk?: string;
  title_en?: string;
  caption?: string;
  caption_uk?: string;
  caption_en?: string;
  alt?: string;
  alt_uk?: string;
  alt_en?: string;
}

export interface CaseStudy {
  id: string;
  slug?: string;
  title: string;
  title_uk?: string;
  title_en?: string;
  category: 'LIVE' | 'VIDEO' | 'CONSTRUCTION' | 'OTHER';
  client: string;
  categoryLabel?: string;
  categoryLabel_uk?: string;
  categoryLabel_en?: string;
  problem?: string;
  problem_uk?: string;
  problem_en?: string;
  challenge?: string;
  challenge_uk?: string;
  challenge_en?: string;
  solution?: string;
  solution_uk?: string;
  solution_en?: string;
  result?: string;
  result_uk?: string;
  result_en?: string;
  description: string;
  description_uk?: string;
  description_en?: string;
  metrics?: { label: string; value: string }[];
  metrics_uk?: { label: string; value: string }[];
  metrics_en?: { label: string; value: string }[];
  year?: string;
  location?: string;
  location_uk?: string;
  location_en?: string;
  imageUrl?: string;
  videoUrl?: string;
  videoBadge?: string;
  media?: CaseMediaItem[];
  published?: boolean;
  featured?: boolean;
  featuredOrder?: number;
  createdAt: number;
}

export type ArticleCategory = 'live' | 'video' | 'construction' | 'photo' | 'tech';

export interface ArticleTranslation {
  title: string;
  categoryLabel: string;
  readTime: string;
  date: string;
  author: string;
  summary: string;
  content: string[];
  keyTakeaways: string[];
}

export interface Article {
  id: string;
  slug: string;
  category: ArticleCategory;
  coverImage: string;
  published: boolean;
  publishedAt: number;
  createdAt: number;
  updatedAt?: number;
  ru: ArticleTranslation;
  uk: ArticleTranslation;
  en?: ArticleTranslation;
}

export interface Lead {
  id?: string;
  name: string;
  phone: string;
  email?: string;
  eventType?: string;
  service?: string;
  cameraCount?: string;
  location?: string;
  hasStarlink?: boolean;
  additionalServices?: string[];
  estimatedCost?: number;
  calculatedCost?: number;
  calculatorDetails?: {
    cameras?: number;
    days?: number;
    starlink?: boolean;
    slowMotion?: boolean;
    drone?: boolean;
  };
  message?: string;
  status?: 'new' | 'contacted' | 'in_progress' | 'estimate_sent' | 'completed' | 'archived';
  notes?: string;
  createdAt: number;
}

export interface SiteSetting {
  id?: string;
  studioName: string;
  studioName_uk?: string;
  studioName_en?: string;
  phone: string;
  email: string;
  telegram: string;
  whatsapp: string;
  address: string;
  address_uk?: string;
  address_en?: string;
  workingHours: string;
  workingHours_uk?: string;
  workingHours_en?: string;
  heroBadge: string;
  heroBadge_uk?: string;
  heroBadge_en?: string;
  heroTitle: string;
  heroTitle_uk?: string;
  heroTitle_en?: string;
  heroSubtitle: string;
  heroSubtitle_uk?: string;
  heroSubtitle_en?: string;
  heroCtaPrimaryText: string;
  heroCtaPrimaryText_uk?: string;
  heroCtaPrimaryText_en?: string;
  heroCtaPrimaryLink: string;
  heroCtaSecondaryText: string;
  heroCtaSecondaryText_uk?: string;
  heroCtaSecondaryText_en?: string;
  heroCtaSecondaryLink: string;
  heroBgImage: string;
  founderName: string;
  founderName_uk?: string;
  founderName_en?: string;
  founderRole: string;
  founderRole_uk?: string;
  founderRole_en?: string;
  founderQuote: string;
  founderQuote_uk?: string;
  founderQuote_en?: string;
  founderBio: string;
  founderBio_uk?: string;
  founderBio_en?: string;
  founderPhoto: string;
  announcementEnabled: boolean;
  announcementText: string;
  announcementText_uk?: string;
  announcementText_en?: string;
  announcementLink: string;
  youtubeUrl: string;
  instagramUrl: string;
  facebookUrl: string;
  updatedAt?: number;
}

export type BlockType =
  | 'cta'
  | 'text_image'
  | 'features_grid'
  | 'stats_counter'
  | 'faq'
  | 'video_embed'
  | 'partners';

export interface SiteBlock {
  id: string;
  title: string;
  title_uk?: string;
  title_en?: string;
  type: BlockType;
  order: number;
  isActive: boolean;
  page: 'home' | 'all';
  config: {
    badge?: string;
    heading?: string;
    subheading?: string;
    content?: string;
    imageUrl?: string;
    imagePosition?: 'left' | 'right';
    buttonText?: string;
    buttonLink?: string;
    secondaryButtonText?: string;
    secondaryButtonLink?: string;
    style?: 'dark' | 'light' | 'indigo' | 'gradient';
    items?: Array<{
      title: string;
      description?: string;
      value?: string;
      iconName?: string;
    }>;
    faqItems?: Array<{
      question: string;
      answer: string;
    }>;
    videoUrl?: string;
    videoCaption?: string;
    partnerNames?: string[];
  };
  config_uk?: Partial<SiteBlock['config']>;
  config_en?: Partial<SiteBlock['config']>;
  updatedAt?: number;
}

export interface Testimonial {
  id: string;
  author: string;
  author_uk?: string;
  author_en?: string;
  role: string;
  role_uk?: string;
  role_en?: string;
  company: string;
  company_uk?: string;
  company_en?: string;
  project: string;
  project_uk?: string;
  project_en?: string;
  quote: string;
  quote_uk?: string;
  quote_en?: string;
  avatar: string;
  rating?: number;
  createdAt?: number;
}

export interface BackstageItem {
  id: string;
  title: string;
  title_uk?: string;
  title_en?: string;
  category: string;
  category_uk?: string;
  category_en?: string;
  tech: string;
  tech_uk?: string;
  tech_en?: string;
  imageUrl: string;
  description: string;
  description_uk?: string;
  description_en?: string;
  createdAt?: number;
}
