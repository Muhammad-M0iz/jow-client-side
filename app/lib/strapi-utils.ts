import type { MediaRelation, StrapiMedia } from '../types/strapi-sections';
export type LocaleKey = 'en' | 'ur';

export const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337';
export const DEFAULT_REVALIDATE = 300;
export const fallbackLocale: LocaleKey = 'en';
export const rtlLocales = ['ur', 'ar', 'fa'];

export const resolveMediaUrl = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${STRAPI_URL}${url}`;
};

export const isExternalUrl = (url?: string | null) => !!url && /^https?:\/\//i.test(url);

export const formatDate = (value?: string | null, locale: LocaleKey = 'en') => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat(locale === 'ur' ? 'ur-PK' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(value));
  } catch {
    return value ?? '';
  }
};

export const formatTime = (value?: string | null, locale: LocaleKey = 'en') => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat(locale === 'ur' ? 'ur-PK' : 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '';
  }
};

export const formatDisplayDate = (value?: string | null, locale: LocaleKey = 'en') => {
  if (!value) return null;
  try {
    return new Intl.DateTimeFormat(locale === 'ur' ? 'ur-PK' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(value));
  } catch {
    return value;
  }
};

export const resolveDirection = (locale: LocaleKey, contentLocale?: string | null) => {
  const resolved = (contentLocale || locale).toLowerCase();
  return rtlLocales.some((entry) => resolved.startsWith(entry)) ? 'rtl' : 'ltr';
};

export const normalizeLocale = (value?: string | null): LocaleKey => {
  if (!value) return 'en';
  const lowered = value.toLowerCase();
  if (lowered.startsWith('ur')) {
    return 'ur';
  }
  return 'en';
};

export const extractMedia = (media?: MediaRelation): StrapiMedia | null => {
  if (!media || typeof media !== 'object') {
    return null;
  }

  if ('url' in media && typeof media.url === 'string') {
    return media as StrapiMedia;
  }

  const nested = (media as { data?: { attributes?: StrapiMedia | null } | null }).data?.attributes;
  if (nested && typeof nested.url === 'string') {
    return nested;
  }

  return null;
};
