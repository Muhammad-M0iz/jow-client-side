import type { CarouselItem } from '../../components/common/Carousel';
import type { FeaturedNewsCard, AnnouncementLinkItem } from '../../components/common/FeaturedNews';
import type { CalendarEvent } from '../../components/common/EventCalendar';
import type {
  AnnouncementEntry,
  AnnouncementsWidgetSection,
  CarouselSection,
  DynamicSection,
  EventsWidgetSection,
  ImportantLinksSection,
  ItemGridSection,
  ItemGridEntry,
  LifeItem,
  MessageSection,
  NewsFeedSection,
  ProgramEntry,
  StatisticsSection,
} from '../../types/strapi-sections';
import { extractMedia, formatDate, formatTime, isExternalUrl, resolveMediaUrl, type LocaleKey } from '../strapi-utils';

export type AnnouncementCard = {
  id: string | number;
  title?: string | null;
  description?: string | null;
  dateLabel?: string | null;
};

export type LifeGalleryItem = {
  id: string | number;
  title?: string | null;
  subtitle?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  href?: string | null;
  isExternal?: boolean;
};

export const isCarouselSection = (section: DynamicSection): section is CarouselSection =>
  section.__component === 'home-page-widgets.carousel-widget';

export const isNewsSection = (section: DynamicSection): section is NewsFeedSection =>
  section.__component === 'home-page-widgets.news-feed-widget';

export const isMessageSection = (section: DynamicSection): section is MessageSection =>
  section.__component === 'home-page-widgets.message-widget';

export const isStatisticsSection = (section: DynamicSection): section is StatisticsSection =>
  section.__component === 'home-page-widgets.statistics-widget';

export const isItemGridSection = (section: DynamicSection): section is ItemGridSection =>
  section.__component === 'page-sections.item-grid-block';

export const isEventsSection = (section: DynamicSection): section is EventsWidgetSection =>
  section.__component === 'home-page-widgets.events-widget';

export const isImportantLinksSection = (section: DynamicSection): section is ImportantLinksSection =>
  section.__component === 'page-sections.important-links-widget';

export const isAnnouncementsWidgetSection = (section: DynamicSection): section is AnnouncementsWidgetSection =>
  section.__component === 'home-page-widgets.announcements';

export const parseCarouselItems = (section?: CarouselSection): CarouselItem[] => {
  if (!section?.slides?.length) return [];
  return section.slides.map((slide, index) => {
    const imageCandidate = Array.isArray(slide.image) ? slide.image[0] : slide.image;
    return {
      id: slide.id ?? slide.documentId ?? slide.title ?? `slide-${index}`,
      title: slide.title ?? '',
      description: slide.description ?? slide.link ?? null,
      imageUrl: resolveMediaUrl(imageCandidate?.url ?? null),
      imageAlt: imageCandidate?.alternativeText ?? slide.title ?? undefined,
    } satisfies CarouselItem;
  });
};

export const mapAnnouncements = (entries: AnnouncementEntry[] | undefined, locale: LocaleKey): AnnouncementCard[] => {
  if (!entries?.length) {
    return [];
  }

  return entries.map((entry, index) => ({
    id: entry.id ?? entry.documentId ?? entry.title ?? `announcement-${index}`,
    title: entry.title ?? null,
    description: entry.subtitle ?? null,
    dateLabel: formatDate(entry.date, locale),
  }));
};

export const mapFeaturedNewsSection = (
  section: NewsFeedSection | undefined,
  locale: LocaleKey,
): {
  newsTitle: string | null;
  announcementsTitle: string | null;
  cards: FeaturedNewsCard[];
  announcementLinks: AnnouncementLinkItem[];
} => {
  if (!section) {
    return {
      newsTitle: null,
      announcementsTitle: null,
      cards: [],
      announcementLinks: [],
    };
  }

  const cards: FeaturedNewsCard[] = (section.featured_news ?? []).map((news, index) => {
    const cover = extractMedia(news.cover_image);
    return {
    id: news.id ?? news.documentId ?? `news-${index}`,
    title: news.title ?? null,
    dateLabel: formatDate(news.date, locale),
    linkHref: news.slug ? `/news/${news.slug}` : null,
    isExternal: false,
      imageUrl: resolveMediaUrl(cover?.url ?? null),
      imageAlt: cover?.alternativeText ?? news.title ?? null,
    } satisfies FeaturedNewsCard;
  });

  const announcementLinks: AnnouncementLinkItem[] = (section.announcements_links ?? []).map((link, index) => ({
    id: link.id ?? `announcement-${index}`,
    label: link.label ?? link.url ?? null,
    href: link.url ?? null,
    isExternal: isExternalUrl(link.url),
  }));

  return {
    newsTitle: section.title ?? null,
    announcementsTitle: section.announcements_title ?? null,
    cards,
    announcementLinks,
  };
};

export const mapStats = (section: StatisticsSection | undefined): StatisticsSection['stats'] =>
  section?.stats?.filter(Boolean) ?? [];

export const mapProgramItems = (sections: ItemGridSection[]): ProgramEntry[] =>
  sections.flatMap((section) => section.featured_programs ?? []);

const isLifeItem = (item: ItemGridEntry | LifeItem): item is LifeItem => 'photo' in item;

export const mapLifeItems = (sections: ItemGridSection[]): LifeGalleryItem[] => {
  const blocks = sections.filter((section) => Array.isArray(section.items) && section.items.length);
  return blocks.flatMap((section) =>
    (section.items ?? []).map((item, index) => {
      const lifeItem = isLifeItem(item) ? item : (item as LifeItem);
      return {
        id: lifeItem.id ?? lifeItem.item_title ?? `life-${index}`,
        title: lifeItem.item_title ?? null,
        subtitle: lifeItem.item_subtitle ?? null,
        imageUrl: resolveMediaUrl(lifeItem.photo?.url ?? null),
        imageAlt: lifeItem.photo?.alternativeText ?? lifeItem.item_title ?? null,
        href: lifeItem.item_link ?? null,
        isExternal: isExternalUrl(lifeItem.item_link),
      } satisfies LifeGalleryItem;
    }),
  );
};

export const mapUpcomingEvents = (section: EventsWidgetSection | undefined, locale: LocaleKey): CalendarEvent[] => {
  if (!section?.featured_events?.length) {
    return [];
  }

  return section.featured_events.map((event, index) => ({
    id: event.id ?? event.documentId ?? event.title ?? `event-${index}`,
    title: event.title ?? '',
    date: event.event_date ?? '',
    time: event.event_date ? formatTime(event.event_date, locale) : '',
    location: event.location ?? '',
  }));
};

export const mapImportantLinks = (section: ImportantLinksSection | undefined) => {
  const links = section?.links ?? [];
  return links.map((link, index) => ({
    id: link.id ?? link.label ?? `link-${index}`,
    label: link.label ?? link.title ?? null,
    url: link.url ?? null,
    isExternal: link.isExternal ?? link.is_external ?? isExternalUrl(link.url),
  }));
};
