export type Locale = 'uk' | 'ru' | 'en';

export type HeroSlideType = 'image' | 'video';

export interface HeroSlide {
  id: string;
  type: HeroSlideType;
  url: string;
  mobileUrl?: string;
  posterUrl?: string;
  cloudinaryPublicId?: string;
  durationMs?: number;
  overlayOpacity?: number;
  objectPosition?: string;
  enabled?: boolean;
  badge?: string;
  badge_uk?: string;
  badge_en?: string;
  title?: string;
  title_uk?: string;
  title_en?: string;
  subtitle?: string;
  subtitle_uk?: string;
  subtitle_en?: string;
  ctaPrimaryText?: string;
  ctaPrimaryText_uk?: string;
  ctaPrimaryText_en?: string;
  ctaPrimaryLink?: string;
  ctaSecondaryText?: string;
  ctaSecondaryText_uk?: string;
  ctaSecondaryText_en?: string;
  ctaSecondaryLink?: string;
}

export type CaseMediaType = 'image' | 'youtube' | 'vimeo' | 'video';

export interface CaseMediaItem {
  id: string;
  type: CaseMediaType;
  url: string;
  thumbnailUrl?: string;
  storagePath?: string; // legacy Firebase Storage path
  cloudinaryPublicId?: string;
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
  updatedAt?: number;
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

export type ContactPageSectionId = 'hero' | 'channels' | 'main' | 'faq';
export type ContactRightPanelId = 'workingHours' | 'locations' | 'legal';
export type ContactCardKind = 'phone' | 'telegram' | 'email' | 'whatsapp' | 'custom';
export type ContactIconKey = 'phone' | 'mail' | 'message' | 'globe' | 'building' | 'truck';

export interface ContactPageLayout {
  sectionOrder: ContactPageSectionId[];
  sectionEnabled: Record<ContactPageSectionId, boolean>;
  mainEnabled: Record<'form' | ContactRightPanelId, boolean>;
  rightPanelOrder: ContactRightPanelId[];
}

export interface ContactCardContent {
  id: string;
  kind: ContactCardKind;
  icon: ContactIconKey;
  title: string;
  subtitle: string;
  badge: string;
  valueOverride: string;
  hrefOverride: string;
}

export interface ContactChoiceContent {
  id: string;
  label: string;
}

export interface ContactWorkingHoursRow {
  id: string;
  label: string;
  value: string;
  tone: 'default' | 'indigo' | 'emerald';
}

export interface ContactLocationContent {
  id: string;
  icon: ContactIconKey;
  city: string;
  address: string;
  description: string;
  type: string;
  mapUrl: string;
}

export interface ContactLegalItem {
  id: string;
  title: string;
  description: string;
}

export interface ContactFaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface ContactPageLocaleContent {
  hero: {
    badge: string;
    title: string;
    accent: string;
    description: string;
    phoneButtonPrefix: string;
    telegramButton: string;
  };
  contactCards: ContactCardContent[];
  form: {
    badge: string;
    title: string;
    description: string;
    nameLabel: string;
    namePlaceholder: string;
    phoneLabel: string;
    phonePlaceholder: string;
    preferredContactLabel: string;
    preferredContacts: ContactChoiceContent[];
    serviceLabel: string;
    services: ContactChoiceContent[];
    locationLabel: string;
    locationPlaceholder: string;
    defaultLocation: string;
    dateLabel: string;
    datePlaceholder: string;
    emailLabel: string;
    emailPlaceholder: string;
    messageLabel: string;
    messagePlaceholder: string;
    privacyText: string;
    submitText: string;
    submittingText: string;
    requiredError: string;
    submitError: string;
    eventTypeLabel: string;
    cameraCountText: string;
    successTitle: string;
    successDescription: string;
    successButton: string;
  };
  workingHours: {
    title: string;
    subtitle: string;
    rows: ContactWorkingHoursRow[];
  };
  locations: {
    title: string;
    items: ContactLocationContent[];
  };
  legal: {
    title: string;
    items: ContactLegalItem[];
  };
  faq: {
    title: string;
    subtitle: string;
    items: ContactFaqItem[];
  };
}

export interface ContactPageConfig {
  version: 2;
  layout: ContactPageLayout;
  ru: ContactPageLocaleContent;
  uk: ContactPageLocaleContent;
  en: ContactPageLocaleContent;
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
  heroSlides?: HeroSlide[];
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
  contactsPage?: ContactPageConfig;
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
