export interface SocialLink {
  id: string;
  platform: 'facebook' | 'instagram' | 'twitter' | 'linkedin' | 'youtube' | 'whatsapp' | 'telegram' | 'tiktok' | 'github' | 'website' | 'custom';
  title: string;
  subtitle?: string;
  url: string;
  icon?: string;
  active: boolean;
}

export interface QuickActions {
  phone?: string;
  email?: string;
  sms?: string;
  whatsapp?: string;
}

export interface ThemeConfig {
  id: string;
  name: string;
  primaryColor: string;
  backgroundColor: string;
  backgroundStyle: 'solid' | 'gradient' | 'pattern' | 'dark' | 'image';
  backgroundImageUrl?: string;
  cardBgColor: string;
  textColor: string;
  subtextColor: string;
  buttonRadius: 'rounded-lg' | 'rounded-xl' | 'rounded-2xl' | 'rounded-full';
  quickActionBg: string;
  quickActionIconColor: string;
}

export interface CardProfile {
  id: string;
  username: string; // Used in URL slug: e.g. /c/joshua
  fullName: string;
  jobTitle: string;
  company?: string;
  bio?: string;
  avatarUrl: string;
  coverImageUrl?: string;
  quickActions: QuickActions;
  links: SocialLink[];
  theme: ThemeConfig;
  vcardData: {
    workPhone?: string;
    mobilePhone?: string;
    email?: string;
    website?: string;
    address?: string;
    organization?: string;
  };
  stats: {
    totalTaps: number;
    lastTappedAt?: string;
    linkClicks: Record<string, number>;
  };
  isActive: boolean;
  createdAt: string;
}

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  cardId: string;
  createdAt: string;
  lastLogin?: string;
}

export interface AdminAccount {
  id: string;
  username: string;
  email: string;
  role: 'super_admin' | 'admin';
  createdAt: string;
}

export interface AuthSession {
  user: {
    id: string;
    username: string;
    email: string;
    role: 'user' | 'admin';
    cardId?: string;
  };
  card?: CardProfile;
  token: string;
}
