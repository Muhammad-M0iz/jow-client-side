import type { Metadata } from 'next';
import type { BlocksContent } from '@strapi/blocks-react-renderer';
import type { ContentPageProps, FeaturedNewsWidgetData } from '../../components/page/ContentPage';
import type { EventsCalendarData } from '../../components/page/EventTypes';
import { STRAPI_URL, DEFAULT_REVALIDATE } from './config';

export type LocaleKey = 'en' | 'ur';

const fallbackLocale: LocaleKey = 'en';

const newsCopy: Record<LocaleKey, {
  newsLinkLabel: string;
  announcementLinkLabel: string;
  announcementsTitle: string;
  noAnnouncements: string;
}> = {
  en: {
    newsLinkLabel: 'Read more',
    announcementLinkLabel: 'View details',
    announcementsTitle: 'Announcements',
    noAnnouncements: 'Nothing to share right now.',
  },
  ur: {
    newsLinkLabel: 'مزید پڑھیں',
    announcementLinkLabel: 'تفصیل دیکھیں',
    announcementsTitle: 'اعلانات',
    noAnnouncements: 'اس وقت کوئی اعلان نہیں۔',
  },
};

type DynamicSection = {
  id?: number;
  __component?: string;
  [key: string]: unknown;
};

type StrapiMedia = {
  url?: string | null;
  alternativeText?: string | null;
};

type PageEntry = {
  id: number;
  documentId?: string;
  title?: string | null;
  slug?: string | null;
  locale?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  content_sections?: DynamicSection[];
  children?: DynamicComponentChild[];
  forms?: PageFormEntry[] | null;
};

type DynamicComponentChild = {
  id?: number;
  documentId?: string;
  title?: string | null;
  slug?: string | null;
  description?: string | null;
};

type StrapiCollection<T> = {
  data?: T[];
};

type FeaturedImageSection = DynamicSection & {
  __component: 'page-sections.featured-image';
  image?: StrapiMedia | null;
  caption?: string | null;
};

type RichTextSection = DynamicSection & {
  __component: 'page-sections.rich-text-block';
  body?: BlocksContent | string | null;
};

type GetInTouchSection = DynamicSection & {
  __component: 'page-sections.get-in-touch-widget';
  title?: string | null;
  contact_number?: string | null;
  email?: string | null;
  button_link?: string | null;
  button_label?: string | null;
};

type QuickLinksSection = DynamicSection & {
  __component: 'page-sections.quick-links';
  title?: string | null;
  menu_items?: QuickLinksEntry[];
};

type QuickLinksEntry = {
  id?: number;
  label?: string | null;
  url?: string | null;
  page_link?: {
    slug?: string | null;
    title?: string | null;
    data?: {
      attributes?: {
        slug?: string | null;
        title?: string | null;
      } | null;
    } | null;
  } | null;
  isExternal?: boolean | null;
  is_external?: boolean | null;
};

type ImportantLinksSection = DynamicSection & {
  __component: 'page-sections.important-links-widget';
  title?: string | null;
  links?: ImportantLinkEntry[];
};

type ImportantLinkEntry = {
  id?: number;
  label?: string | null;
  title?: string | null;
  url?: string | null;
  isExternal?: boolean | null;
  is_external?: boolean | null;
};

type FacultyWidgetSection = DynamicSection & {
  __component: 'page-sections.faculty-widget';
  title?: string | null;
  subtitle?: string | null;
  faculty_members?: FacultyMemberEntry[];
};

type FacultyMemberEntry = {
  id?: number;
  documentId?: string;
  name?: string | null;
  designation?: string | null;
  subtitle?: string | null;
  photo?: StrapiMedia | { data?: { attributes?: StrapiMedia | null } | null } | null;
  departments?: FacultyDepartmentEntry[];
};

type FacultyDepartmentEntry = {
  id?: number;
  name?: string | null;
};

type NewsFeedSection = DynamicSection & {
  __component: 'home-page-widgets.news-feed-widget';
  title?: string | null;
  announcements_title?: string | null;
  featured_news?: NewsArticleEntry[];
  announcements_links?: AnnouncementLinkEntry[];
};

type NewsArticleEntry = {
  id?: number;
  documentId?: string;
  title?: string | null;
  slug?: string | null;
  date?: string | null;
  category?: string | null;
  body?: BlocksContent | string | null;
  cover_image?: StrapiMedia | null;
};

type AnnouncementLinkEntry = {
  id?: number;
  label?: string | null;
  url?: string | null;
};

type ItemGridSection = DynamicSection & {
  __component: 'page-sections.item-grid-block';
  title?: string | null;
  items?: ItemGridEntry[];
};

type ItemGridEntry = {
  id?: number;
  item_title?: string | null;
  item_subtitle?: string | null;
  item_link?: string | null;
};

type QuickLinkResult = NonNullable<ContentPageProps['quickLinks']>[number];
type FormSectionResult = NonNullable<ContentPageProps['forms']>[number];
type FormFieldResult = FormSectionResult['fields'][number];

type VideoSection = DynamicSection & {
  __component: 'page-sections.video';
  title?: string | null;
  videos?: VideoEntry[];
};

type VideoEntry = {
  id?: number;
  documentId?: string;
  title?: string | null;
  description?: string | null;
  video_file?: VideoFile | null;
};

type VideoFile = {
  id?: number;
  url?: string | null;
  name?: string | null;
};

type PhotoAlbumWidgetSection = DynamicSection & {
  __component: 'page-sections.photo-album-widget';
  title?: string | null;
  photo_albums?: PhotoAlbumEntry[];
};

type PhotoAlbumEntry = {
  id?: number;
  documentId?: string;
  title?: string | null;
  slug?: string | null;
  description?: string | null;
  photos?: PhotoMediaEntry[];
};

type PhotoMediaEntry = {
  id?: number;
  documentId?: string;
  url?: string | null;
  alternativeText?: string | null;
  caption?: string | null;
};

type DownloadSection = DynamicSection & {
  __component: 'page-sections.downloads';
  title?: string | null;
  downloads?: DownloadEntry[];
};

type DownloadEntry = {
  id?: number;
  documentId?: string;
  title?: string | null;
  file?: DownloadFile | null;
};

type DownloadFile = {
  id?: number;
  url?: string | null;
  name?: string | null;
};

type TestimonialsSection = DynamicSection & {
  __component: 'page-sections.testimonials-widget';
  title?: string | null;
  testimonials?: TestimonialEntry[];
};

type TestimonialEntry = {
  id?: number;
  documentId?: string;
  author_name?: string | null;
  designation?: string | null;
  body?: string | null;
  photo?: StrapiMedia | { data?: { attributes?: StrapiMedia | null } | null } | null;
};

type EventsWidgetSection = DynamicSection & {
  __component: 'home-page-widgets.events-widget';
  title?: string | null;
  featured_events?: EventsWidgetEntry[];
};

type EventsWidgetEntry = {
  id?: number;
  documentId?: string;
  title?: string | null;
  subtitle?: string | null;
  slug?: string | null;
  event_date?: string | null;
  location?: string | null;
  body?: BlocksContent | string | null;
  featured_image?: StrapiMedia | { data?: { attributes?: StrapiMedia | null } | null } | null;
};

type PageFormEntry = {
  id?: number;
  documentId?: string;
  name?: string | null;
  slug?: string | null;
  fields?: PageFormFieldEntry[] | null;
};

type PageFormFieldEntry = {
  id?: string | null;
  type?: string | null;
  label?: string | null;
  placeholder?: string | null;
  required?: boolean | null;
  options?: Array<string | { label?: string | null; value?: string | null }> | null;
  validation?: {
    options?: string[];
    allowedTypes?: string[];
    pattern?: string;
  } | null;
  childFields?: PageFormFieldEntry[] | null;
};

const normalizeLocale = (value?: string | null): LocaleKey => {
  if (!value) return 'en';
  const lowered = value.toLowerCase();
  if (lowered.startsWith('ur')) {
    return 'ur';
  }
  return 'en';
};

const resolveMediaUrl = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${STRAPI_URL}${url}`;
};

const formatDisplayDate = (value?: string | null, locale: LocaleKey = 'en') => {
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

const isFeaturedImageSection = (section: DynamicSection): section is FeaturedImageSection =>
  section.__component === 'page-sections.featured-image';

const isRichTextSection = (section: DynamicSection): section is RichTextSection =>
  section.__component === 'page-sections.rich-text-block';

const isGetInTouchSection = (section: DynamicSection): section is GetInTouchSection =>
  section.__component === 'page-sections.get-in-touch-widget';

const isQuickLinksSection = (section: DynamicSection): section is QuickLinksSection =>
  section.__component === 'page-sections.quick-links';

const isImportantLinksSection = (section: DynamicSection): section is ImportantLinksSection =>
  section.__component === 'page-sections.important-links-widget';

const isFacultyWidgetSection = (section: DynamicSection): section is FacultyWidgetSection =>
  section.__component === 'page-sections.faculty-widget';

const isItemGridSection = (section: DynamicSection): section is ItemGridSection =>
  section.__component === 'page-sections.item-grid-block';

const isNewsFeedSection = (section: DynamicSection): section is NewsFeedSection =>
  section.__component === 'home-page-widgets.news-feed-widget';

const isVideoSection = (section: DynamicSection): section is VideoSection =>
  section.__component === 'page-sections.video';

const isPhotoAlbumSection = (section: DynamicSection): section is PhotoAlbumWidgetSection =>
  section.__component === 'page-sections.photo-album-widget';

const isDownloadSection = (section: DynamicSection): section is DownloadSection =>
  section.__component === 'page-sections.downloads';

const isTestimonialsSection = (section: DynamicSection): section is TestimonialsSection =>
  section.__component === 'page-sections.testimonials-widget';

const isEventsWidgetSection = (section: DynamicSection): section is EventsWidgetSection =>
  section.__component === 'home-page-widgets.events-widget';

const buildQueryString = (slug: string, locale: LocaleKey) => {
  const params = new URLSearchParams();
  params.set('filters[slug][$eq]', slug);
  params.set('locale', locale);
  params.set('populate[content_sections][populate]', 'deep');
  params.set('populate[children]', 'true');
  params.set('populate[forms][populate]', 'deep');
  params.set('pagination[pageSize]', '1');
  return params.toString();
};

async function fetchPageEntry(slug: string, locale: LocaleKey): Promise<PageEntry | null> {
  const query = buildQueryString(slug, locale);
  const response = await fetch(`${STRAPI_URL}/api/pages?${query}`, {
    next: { revalidate: DEFAULT_REVALIDATE },
  });

  if (!response.ok) {
    console.error('Failed to fetch page', await response.text());
    return null;
  }

  const payload = (await response.json()) as StrapiCollection<PageEntry>;
  const data = payload.data ?? [];
  if (!data.length) {
    return null;
  }

  return data[0];
}

const mapFeaturedImage = (section?: FeaturedImageSection | null): ContentPageProps['featuredImage'] => {
  if (!section) return null;
  const url = resolveMediaUrl(section.image?.url);
  return {
    id: section.id,
    url,
    alt: section.image?.alternativeText ?? undefined,
    caption: section.caption ?? undefined,
  };
};

const mapRichTextBlocks = (sections: RichTextSection[]): ContentPageProps['richTextBlocks'] =>
  sections.map((section, index) => ({
    id: section.id ?? `rich-text-${index}`,
    body: section.body ?? null,
  }));

const mapContactWidgets = (sections: GetInTouchSection[]): ContentPageProps['contactWidgets'] =>
  sections.map((section, index) => ({
    id: section.id ?? `contact-${index}`,
    title: section.title ?? null,
    contact_number: section.contact_number ?? null,
    email: section.email ?? null,
    button_link: section.button_link ?? null,
    button_label: section.button_label ?? null,
    buttonLabel: (section as { buttonLabel?: string | null }).buttonLabel ?? null,
  }));

const mapChildPages = (children?: DynamicComponentChild[]): ContentPageProps['childPages'] => {
  if (!children?.length) return [];
  return children.map((child, index) => ({
    id: child.id ?? child.documentId ?? `child-${index}`,
    title: child.title ?? null,
    slug: child.slug ?? null,
    description: child.description ?? null,
  }));
};

const normalizeItemLink = (href?: string | null): { href: string | null; isExternal: boolean } => {
  if (!href) return { href: null, isExternal: false };
  const trimmed = href.trim();
  if (!trimmed) return { href: null, isExternal: false };
  if (/^https?:\/\//i.test(trimmed)) {
    return { href: trimmed, isExternal: true };
  }
  if (trimmed.startsWith('/')) {
    return { href: trimmed, isExternal: false };
  }
  return { href: `/${trimmed}`, isExternal: false };
};

const mapChildPagesFromItemGrid = (
  sections: ItemGridSection[],
): { items: ContentPageProps['childPages']; heading: string | null } => {
  if (!sections.length) return { items: [], heading: null };
  const items = sections.flatMap((section) => {
    const entries = Array.isArray(section.items) ? section.items : [];
    return entries.map((item, index) => {
      const { href, isExternal } = normalizeItemLink(item.item_link ?? null);
      return {
        id: item.id ?? `item-grid-${index}`,
        title: item.item_title ?? null,
        description: item.item_subtitle ?? null,
        href,
        isExternal,
      };
    });
  });

  const heading = sections.find((section) => !!section.title)?.title ?? sections[0].title ?? null;
  return { items, heading };
};

const mapImportantLinks = (sections: ImportantLinksSection[]): ContentPageProps['importantLinks'] => {
  if (!sections.length) return [];
  return sections.flatMap((section) => {
    const links = Array.isArray(section.links) ? section.links : [];
    return links.map((link, index) => ({
      id: link.id ?? `important-link-${index}`,
      label: link.label ?? link.title ?? null,
      url: link.url ?? null,
      isExternal: link.isExternal ?? link.is_external ?? null,
    }));
  });
};

const mapQuickLinks = (sections: QuickLinksSection[]): ContentPageProps['quickLinks'] => {
  if (!sections.length) return [];
  return sections.flatMap((section) => {
    const items = Array.isArray(section.menu_items) ? section.menu_items : [];
    return items
      .map((item, index) => {
        const attributes = item.page_link?.data?.attributes;
        const rawSlug = item.page_link?.slug ?? attributes?.slug ?? null;
        const hrefCandidate = rawSlug
          ? rawSlug.startsWith('/')
            ? rawSlug
            : `/${rawSlug}`
          : item.url ?? null;
        const label = item.label ?? item.page_link?.title ?? attributes?.title ?? hrefCandidate;
        if (!label && !hrefCandidate) {
          return null;
        }
        const quickLink: QuickLinkResult = {
          id: item.id ?? `quick-link-${index}`,
          label,
          href: hrefCandidate,
          isExternal: item.isExternal ?? item.is_external ?? /^https?:\/\//i.test(hrefCandidate ?? ''),
        };
        return quickLink;
      })
      .filter((link): link is QuickLinkResult => Boolean(link));
  });
};

type MediaLike =
  | StrapiMedia
  | { data?: { attributes?: StrapiMedia | null } | null }
  | null
  | undefined;

const extractMedia = (media?: MediaLike): StrapiMedia | null => {
  if (!media || typeof media !== 'object') {
    return null;
  }

  if ('url' in (media as StrapiMedia) && typeof (media as StrapiMedia).url === 'string') {
    return media as StrapiMedia;
  }

  const nested = (media as { data?: { attributes?: StrapiMedia | null } | null }).data?.attributes;
  if (nested && typeof nested.url === 'string') {
    return nested;
  }

  return null;
};

const mapFacultyWidget = (sections: FacultyWidgetSection[]): ContentPageProps['facultyWidget'] => {
  if (!sections.length) return null;

  const members = sections.flatMap((section) => {
    const entries = Array.isArray(section.faculty_members) ? section.faculty_members : [];
    return entries.map((member, index) => {
      const media = extractMedia(member.photo);
      return {
        id: member.id ?? member.documentId ?? `faculty-${index}`,
        name: member.name ?? null,
        designation: member.designation ?? null,
        subtitle: member.subtitle ?? null,
        photo: media?.url ? { url: media.url } : null,
        departments: Array.isArray(member.departments)
          ? member.departments.map((dept, deptIndex) => ({
              id: typeof dept.id === 'number' ? dept.id : deptIndex,
              name: dept.name ?? null,
            }))
          : [],
        profileUrl: null,
      };
    });
  });

  if (!members.length && !sections.some((section) => section.title || section.subtitle)) {
    return null;
  }

  return {
    title: sections.find((section) => !!section.title)?.title ?? sections[0].title ?? null,
    subtitle: sections.find((section) => !!section.subtitle)?.subtitle ?? sections[0].subtitle ?? null,
    members,
  };
};

const mapNewsWidget = (sections: NewsFeedSection[], locale: LocaleKey): FeaturedNewsWidgetData | null => {
  if (!sections.length) return null;

  const featuredNews = sections.flatMap((section) => {
    const entries = Array.isArray(section.featured_news) ? section.featured_news : [];
    return entries.map((news, index) => ({
      id: news.id ?? news.documentId ?? `news-${index}`,
      title: news.title ?? null,
      dateLabel: formatDisplayDate(news.date, locale),
      linkHref: news.slug ? `/news/${news.slug}` : null,
      isExternal: false,
      imageUrl: resolveMediaUrl(news.cover_image?.url),
      imageAlt: news.cover_image?.alternativeText ?? news.title ?? null,
    }));
  });

  const announcementLinks = sections.flatMap((section) => {
    const links = Array.isArray(section.announcements_links) ? section.announcements_links : [];
    return links.map((link, index) => {
      const { href, isExternal } = normalizeItemLink(link.url ?? null);
      return {
        id: link.id ?? `announcement-${index}`,
        label: link.label ?? link.url ?? null,
        href,
        isExternal,
      };
    });
  });

  if (!featuredNews.length && !announcementLinks.length) {
    return null;
  }

  const localeCopy = newsCopy[locale];
  const newsTitle = sections.find((section) => !!section.title)?.title ?? sections[0].title ?? null;
  const announcementsTitle =
    sections.find((section) => !!section.announcements_title)?.announcements_title ??
    sections[0].announcements_title ??
    localeCopy.announcementsTitle;

  return {
    newsTitle,
    announcementsTitle,
    fallbackTitle: localeCopy.announcementsTitle,
    newsLinkLabel: localeCopy.newsLinkLabel,
    announcementLinkLabel: localeCopy.announcementLinkLabel,
    emptyAnnouncementsCopy: localeCopy.noAnnouncements,
    featuredNews,
    announcementLinks,
  } satisfies FeaturedNewsWidgetData;
};

const mapNewsDetailSection = (sections: NewsFeedSection[]): ContentPageProps['newsDetailSection'] => {
  if (!sections.length) {
    return null;
  }

  const articles = sections.flatMap((section, sectionIndex) => {
    const entries = Array.isArray(section.featured_news) ? section.featured_news : [];

    return entries.map((news, newsIndex) => {
      const coverMedia = extractMedia(news.cover_image);
      return {
        id: news.id ?? news.documentId ?? `news-detail-${sectionIndex}-${newsIndex}`,
        title: news.title ?? null,
        slug: news.slug ?? null,
        category: news.category ?? null,
        date: news.date ?? null,
        coverImage: coverMedia?.url
          ? {
              url: resolveMediaUrl(coverMedia.url),
              alt: coverMedia.alternativeText ?? news.title ?? undefined,
            }
          : null,
        body: news.body ?? null,
      };
    });
  });

  const filteredArticles = articles.filter((article) => article.title || article.body);

  if (!filteredArticles.length) {
    return null;
  }

  return {
    title: sections.find((section) => !!section.title)?.title ?? sections[0].title ?? null,
    articles: filteredArticles,
  };
};

const mapVideoSections = (sections: VideoSection[]): ContentPageProps['videoSections'] =>
  sections.reduce((acc, section, sectionIndex) => {
    const entries = Array.isArray(section.videos) ? section.videos : [];
    const videos = entries.reduce<NonNullable<ContentPageProps['videoSections']>[number]['videos']>((videoAcc, video, videoIndex) => {
      const url = resolveMediaUrl(video.video_file?.url ?? null);
      if (!url) {
        return videoAcc;
      }
      videoAcc.push({
        id: video.id ?? video.documentId ?? `video-${sectionIndex}-${videoIndex}`,
        title: video.title ?? video.video_file?.name ?? null,
        description: video.description ?? null,
        url,
        filename: video.video_file?.name ?? null,
      });
      return videoAcc;
    }, []);

    if (!videos.length) {
      return acc;
    }

    acc.push({
      id: section.id ?? `video-section-${sectionIndex}`,
      title: section.title ?? null,
      videos,
    });
    return acc;
  }, [] as NonNullable<ContentPageProps['videoSections']>);

const mapPhotoAlbumSections = (sections: PhotoAlbumWidgetSection[]): ContentPageProps['photoAlbumSections'] =>
  sections.reduce((acc, section, sectionIndex) => {
    const albumEntries = Array.isArray(section.photo_albums) ? section.photo_albums : [];
    const albums = albumEntries.reduce<NonNullable<ContentPageProps['photoAlbumSections']>[number]['albums']>((albumAcc, album, albumIndex) => {
      const photoEntries = Array.isArray(album.photos) ? album.photos : [];
      const photos = photoEntries.reduce<NonNullable<ContentPageProps['photoAlbumSections']>[number]['albums'][number]['photos']>((photoAcc, photo, photoIndex) => {
        const url = resolveMediaUrl(photo.url ?? null);
        if (!url) {
          return photoAcc;
        }
        photoAcc.push({
          id: photo.id ?? photo.documentId ?? `photo-${sectionIndex}-${albumIndex}-${photoIndex}`,
          url,
          alt: photo.alternativeText ?? null,
          caption: photo.caption ?? null,
        });
        return photoAcc;
      }, []);

      if (!photos.length) {
        return albumAcc;
      }

      albumAcc.push({
        id: album.id ?? album.documentId ?? `album-${sectionIndex}-${albumIndex}`,
        title: album.title ?? null,
        description: album.description ?? null,
        slug: album.slug ?? null,
        photos,
      });
      return albumAcc;
    }, []);

    if (!albums.length) {
      return acc;
    }

    acc.push({
      id: section.id ?? `photo-section-${sectionIndex}`,
      title: section.title ?? null,
      albums,
    });
    return acc;
  }, [] as NonNullable<ContentPageProps['photoAlbumSections']>);

const mapDownloadSections = (sections: DownloadSection[]): ContentPageProps['downloadSections'] =>
  sections.reduce((acc, section, sectionIndex) => {
    const entries = Array.isArray(section.downloads) ? section.downloads : [];
    const downloads = entries.reduce<NonNullable<ContentPageProps['downloadSections']>[number]['downloads']>((downloadAcc, download, downloadIndex) => {
      const fileUrl = resolveMediaUrl(download.file?.url ?? null);
      if (!fileUrl) {
        return downloadAcc;
      }
      downloadAcc.push({
        id: download.id ?? download.documentId ?? `download-${sectionIndex}-${downloadIndex}`,
        title: download.title ?? download.file?.name ?? null,
        fileName: download.file?.name ?? null,
        fileUrl,
      });
      return downloadAcc;
    }, []);

    if (!downloads.length) {
      return acc;
    }

    acc.push({
      id: section.id ?? `downloads-section-${sectionIndex}`,
      title: section.title ?? null,
      downloads,
    });
    return acc;
  }, [] as NonNullable<ContentPageProps['downloadSections']>);

const mapTestimonialsSections = (sections: TestimonialsSection[]): ContentPageProps['testimonialsSections'] =>
  sections.reduce((acc, section, sectionIndex) => {
    const entries = Array.isArray(section.testimonials) ? section.testimonials : [];
    const testimonials = entries.reduce<NonNullable<ContentPageProps['testimonialsSections']>[number]['testimonials']>((itemAcc, testimonial, testimonialIndex) => {
      const media = extractMedia(testimonial.photo);
      itemAcc.push({
        id: testimonial.id ?? testimonial.documentId ?? `testimonial-${sectionIndex}-${testimonialIndex}`,
        author: testimonial.author_name ?? null,
        designation: testimonial.designation ?? null,
        body: testimonial.body ?? null,
        photoUrl: media?.url ? resolveMediaUrl(media.url) : null,
        photoAlt: media?.alternativeText ?? testimonial.author_name ?? null,
      });
      return itemAcc;
    }, []);

    if (!testimonials.length) {
      return acc;
    }

    acc.push({
      id: section.id ?? `testimonials-section-${sectionIndex}`,
      title: section.title ?? 'Testimonials',
      testimonials,
    });
    return acc;
  }, [] as NonNullable<ContentPageProps['testimonialsSections']>);

const mapEventsWidget = (sections: EventsWidgetSection[]): EventsCalendarData | null => {
  if (!sections.length) {
    return null;
  }

  const events = sections.flatMap((section, sectionIndex) => {
    const entries = Array.isArray(section.featured_events) ? section.featured_events : [];

    return entries.map((event, eventIndex) => {
      const media = extractMedia(event.featured_image);
      return {
        id: event.id ?? event.documentId ?? `events-${sectionIndex}-${eventIndex}`,
        title: event.title ?? null,
        subtitle: event.subtitle ?? null,
        date: event.event_date ?? null,
        location: event.location ?? null,
        slug: event.slug ?? null,
        body: event.body ?? null,
        imageUrl: resolveMediaUrl(media?.url),
        imageAlt: media?.alternativeText ?? event.title ?? undefined,
      };
    });
  });

  const filteredEvents = events.filter((event) => event.title || event.date);

  if (!filteredEvents.length) {
    return null;
  }

  return {
    title: sections.find((section) => !!section.title)?.title ?? sections[0].title ?? null,
    events: filteredEvents,
  } satisfies EventsCalendarData;
};

const sanitizeFieldOptions = (
  options?: Array<string | { label?: string | null; value?: string | null }> | null,
): Array<string | { label?: string | null; value?: string | null }> | null => {
  if (!Array.isArray(options)) {
    return null;
  }

  return options.reduce<Array<string | { label?: string | null; value?: string | null }>>((acc, option) => {
    if (typeof option === 'string') {
      const trimmed = option.trim();
      if (trimmed) {
        acc.push(trimmed);
      }
      return acc;
    }

    if (option && typeof option === 'object') {
      const value = option.value ?? option.label ?? '';
      if (value) {
        acc.push({
          label: option.label ?? option.value ?? value,
          value,
        });
      }
    }

    return acc;
  }, []);
};

const mapForms = (forms?: PageFormEntry[] | null): ContentPageProps['forms'] => {
  if (!forms?.length) {
    return [];
  }

  // Helper to map child fields recursively (for Sections AND Repeaters)
  const mapChildFields = (
    formIndex: number, 
    fieldIndex: number, 
    childFields?: PageFormFieldEntry[] | null
  ): FormFieldResult['childFields'] => {
    if (!childFields?.length) return null;

    return childFields
      .map((child, childIndex) => {
        // Create a unique ID if one doesn't exist
        const childId = child.id ?? `child-field-${formIndex}-${fieldIndex}-${childIndex}`;
        if (!childId) return null;

        return {
          id: childId,
          type: child.type ?? 'text',
          label: child.label ?? null,
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          description: (child as any).description ?? null, 
          placeholder: child.placeholder ?? null,
          required: child.required ?? null,
          options: sanitizeFieldOptions(child.options),
          validation: child.validation ?? null,
          
          // RECURSION FIX: 
          // If a child is a Repeater (inside a Section), we must map ITS children too.
          childFields: (child.type === 'repeater' || child.type === 'section')
            ? mapChildFields(formIndex, childIndex, child.childFields) 
            : null,
        };
      })
      .filter((c): c is NonNullable<typeof c> => Boolean(c));
  };

  return forms
    .map((form, formIndex) => {
      const fields = Array.isArray(form.fields)
        ? form.fields
            .map((field, fieldIndex) => {
              const id = field.id ?? `form-field-${formIndex}-${fieldIndex}`;
              if (!id) {
                return null;
              }

              const formField: FormFieldResult = {
                id,
                type: field.type ?? 'text',
                label: field.label ?? null,
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                description: (field as any).description ?? null, 
                placeholder: field.placeholder ?? null,
                required: field.required ?? null,
                options: sanitizeFieldOptions(field.options),
                validation: field.validation ?? null,

                // LOGIC FIX: 
                // Check for BOTH 'repeater' AND 'section' to map their children
                childFields: (field.type === 'repeater' || field.type === 'section') 
                  ? mapChildFields(formIndex, fieldIndex, field.childFields) 
                  : null,
              };
              return formField;
            })
            .filter((candidate): candidate is FormFieldResult => Boolean(candidate))
        : [];

      if (!fields.length) {
        return null;
      }

      const formSection: FormSectionResult = {
        id: form.id ?? form.documentId ?? `form-${formIndex}`,
        documentId: form.documentId ?? null,
        name: form.name ?? 'Form',
        slug: form.slug ?? null,
        fields,
      };
      return formSection;
    })
    .filter((entry): entry is FormSectionResult => Boolean(entry));
};

export type ContentPageLoadResult = {
  resolvedLocale: LocaleKey;
  props: ContentPageProps;
  seo: Metadata;
};

export async function fetchContentPageMetadata(slug: string, locale: LocaleKey): Promise<Metadata | null> {
  const page = await fetchPageEntry(slug, locale);

  if (!page && locale !== fallbackLocale) {
    const fallbackPage = await fetchPageEntry(slug, fallbackLocale);
    if (!fallbackPage) {
      return null;
    }
    return {
      title: fallbackPage.title ?? fallbackPage.seo_title ?? 'Jamia Page',
      description: fallbackPage.seo_description ?? undefined,
    };
  }

  if (!page) {
    return null;
  }

  return {
    title: page.title ?? page.seo_title ?? 'Jamia Page',
    description: page.seo_description ?? undefined,
  };
}

export async function loadContentPage(slug: string, locale: LocaleKey): Promise<ContentPageLoadResult | null> {
  const page = await fetchPageEntry(slug, locale);
  const resolvedPage = page ?? (locale !== fallbackLocale ? await fetchPageEntry(slug, fallbackLocale) : null);

  if (!resolvedPage) {
    return null;
  }

  const resolvedLocale = normalizeLocale(resolvedPage.locale ?? locale);

  const sections = Array.isArray(resolvedPage.content_sections) ? resolvedPage.content_sections : [];
  const featuredImageSection = sections.find(isFeaturedImageSection) ?? null;
  const richTextSections = sections.filter(isRichTextSection);
  const contactSections = sections.filter(isGetInTouchSection);
  const importantLinkSections = sections.filter(isImportantLinksSection);
  const quickLinksSections = sections.filter(isQuickLinksSection);
  const facultyWidgetSections = sections.filter(isFacultyWidgetSection);
  const itemGridSections = sections.filter(isItemGridSection);
  const newsWidgetSections = sections.filter(isNewsFeedSection);
  const videoSectionsRaw = sections.filter(isVideoSection);
  const photoAlbumSectionsRaw = sections.filter(isPhotoAlbumSection);
  const downloadSectionsRaw = sections.filter(isDownloadSection);
  const testimonialsSectionsRaw = sections.filter(isTestimonialsSection);
  const eventsWidgetSections = sections.filter(isEventsWidgetSection);

  const featuredImage = mapFeaturedImage(featuredImageSection);
  const richTextBlocks = mapRichTextBlocks(richTextSections);
  const contactWidgets = mapContactWidgets(contactSections);
  const navigationChildPages = mapChildPages(resolvedPage.children);
  const gridChildPagesResult = mapChildPagesFromItemGrid(itemGridSections);
  const gridChildPages = gridChildPagesResult.items;
  const gridHeading = gridChildPagesResult.heading;
  const childPages = gridChildPages?.length ? gridChildPages : navigationChildPages;
  const importantLinks = mapImportantLinks(importantLinkSections);
  const quickLinks = mapQuickLinks(quickLinksSections);
  const quickLinksTitle = quickLinksSections.find((section) => !!section.title)?.title ?? null;
  const facultyWidget = mapFacultyWidget(facultyWidgetSections);
  const newsWidget = mapNewsWidget(newsWidgetSections, resolvedLocale);
  const newsDetailSection = mapNewsDetailSection(newsWidgetSections);
  const videoSections = mapVideoSections(videoSectionsRaw);
  const photoAlbumSections = mapPhotoAlbumSections(photoAlbumSectionsRaw);
  const downloadSections = mapDownloadSections(downloadSectionsRaw);
  const testimonialsSections = mapTestimonialsSections(testimonialsSectionsRaw);
  const formSections = mapForms(resolvedPage.forms);
  const eventsWidget = mapEventsWidget(eventsWidgetSections);
  const eventDetailSection = eventsWidget
    ? {
        title: eventsWidget.title,
        events: eventsWidget.events,
      }
    : null;

  const props: ContentPageProps = {
    title: resolvedPage.title ?? resolvedPage.slug,
    locale: resolvedLocale,
    featuredImage,
    richTextBlocks,
    contactWidgets,
    childPages,
    childPagesHeading: gridChildPages?.length ? gridHeading : null,
    importantLinks,
    quickLinks,
    quickLinksTitle,
    facultyWidget,
    newsWidget,
    newsDetailSection,
    videoSections,
    photoAlbumSections,
    downloadSections,
    testimonialsSections,
    forms: formSections,
    eventsWidget,
    eventDetailSection,
  };

  const seo: Metadata = {
    title: resolvedPage.title ?? resolvedPage.seo_title ?? 'Jamia Page',
    description: resolvedPage.seo_description ?? undefined,
  };

  return {
    resolvedLocale,
    props,
    seo,
  };
}
