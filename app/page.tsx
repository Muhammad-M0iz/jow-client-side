import type { Metadata } from 'next';
import Link from 'next/link';
import { BlocksRenderer, type BlocksContent } from '@strapi/blocks-react-renderer';
import Carousel from './components/common/Carousel';
import EventCalendar from './components/common/EventCalendar';
import './HomePage.css';

type LocaleKey = 'en' | 'ur';

type DynamicSection = {
  id: number;
  __component: string;
  [key: string]: unknown;
};

type StrapiImage = {
  url?: string | null;
  alternativeText?: string | null;
};

type CarouselSlide = {
  id?: number;
  documentId?: string;
  title?: string | null;
  description?: string | null;
  link?: string | null;
  image?: StrapiImage | StrapiImage[] | null;
};

type NewsArticle = {
  id?: number;
  documentId?: string;
  title?: string | null;
  slug?: string | null;
  date?: string | null;
  cover_image?: StrapiImage | null;
};

type AnnouncementLink = {
  id?: number;
  label?: string | null;
  url?: string | null;
};

type StatsItem = {
  id?: number;
  number?: string | null;
  value?: string | null;
  label?: string | null;
};

type EventEntry = {
  id?: number;
  documentId?: string;
  title?: string | null;
  event_date?: string | null;
  location?: string | null;
  slug?: string | null;
};

type ProgramEntry = {
  id?: number;
  documentId?: string;
  title?: string | null;
  slug?: string | null;
};

type LifeItem = {
  id?: number;
  item_title?: string | null;
  item_subtitle?: string | null;
  item_link?: string | null;
  photo?: StrapiImage | null;
};

type ImportantLink = {
  id?: number;
  label?: string | null;
  url?: string | null;
};

type CarouselSection = DynamicSection & {
  __component: 'home-page-widgets.carousel-widget';
  slides?: CarouselSlide[];
};

type NewsFeedSection = DynamicSection & {
  __component: 'home-page-widgets.news-feed-widget';
  title?: string;
  announcements_title?: string;
  featured_news?: NewsArticle[];
  announcements_links?: AnnouncementLink[];
};

type MessageSection = DynamicSection & {
  __component: 'home-page-widgets.message-widget';
  title?: string;
  author_name?: string;
  author_title?: string;
  author_photo?: StrapiImage | null;
  message_body?: BlocksContent | null;
};

type StatisticsSection = DynamicSection & {
  __component: 'home-page-widgets.statistics-widget';
  title?: string;
  stats?: StatsItem[];
};

type ItemGridSection = DynamicSection & {
  __component: 'page-sections.item-grid-block';
  title?: string;
  featured_programs?: ProgramEntry[];
  items?: LifeItem[];
};

type EventsSection = DynamicSection & {
  __component: 'home-page-widgets.events-widget';
  title?: string;
  featured_events?: EventEntry[];
};

type ImportantLinksSection = DynamicSection & {
  __component: 'page-sections.important-links-widget';
  title?: string;
  links?: ImportantLink[];
};

type HomePageEntry = {
  id: number;
  locale?: string;
  seo_title?: string;
  seo_description?: string;
  page_sections?: DynamicSection[];
};

type PageProps = {
  searchParams?: {
    locale?: string;
  };
};

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337';
const rtlLocales = ['ur', 'ar', 'fa'];

const copy: Record<LocaleKey, Record<string, string>> = {
  en: {
    error: 'Failed to load data.',
    directorSectionTitle: "Director's Message",
    directorDesignationFallback: 'Director',
    announcementsTitle: 'Announcements',
    newsTitle: 'News',
    newsLinkLabel: 'Read more',
    announcementLinkLabel: 'View details',
    statsTitle: 'Jamia at a Glance',
    lifeTitle: 'Life at Jamia',
    galleryCtaTitle: 'More Photos',
    galleryCtaSubtitle: 'View gallery',
    eventsTitle: 'Upcoming Events',
    eventsCtaTitle: 'More Events',
    eventsCtaSubtitle: 'View all',
    programsTitle: 'Programs Offered',
    programDetails: 'Explore program',
    linksTitle: 'Important Links',
    noAnnouncements: 'Nothing to share right now.',
    noEvents: 'No events available',
    noStats: 'Statistics unavailable',
  },
  ur: {
    error: 'مواد دستیاب نہیں ہو سکا۔',
    directorSectionTitle: 'مدیر اعلیٰ کا پیغام',
    directorDesignationFallback: 'مدیر اعلیٰ',
    announcementsTitle: 'اعلانات',
    newsTitle: 'خبریں',
    newsLinkLabel: 'مزید پڑھیں',
    announcementLinkLabel: 'تفصیل دیکھیں',
    statsTitle: 'جامعہ کے اعداد و شمار',
    lifeTitle: 'جامعہ میں زندگی',
    galleryCtaTitle: 'مزید تصاویر',
    galleryCtaSubtitle: 'گیلری دیکھیں',
    eventsTitle: 'آنے والی تقریبات',
    eventsCtaTitle: 'مزید تقریبات',
    eventsCtaSubtitle: 'تمام دیکھیں',
    programsTitle: 'پیش کردہ پروگرامز',
    programDetails: 'مزید جانیے',
    linksTitle: 'اہم روابط',
    noAnnouncements: 'اس وقت کوئی اعلان نہیں۔',
    noEvents: 'فی الحال کوئی تقریب نہیں۔',
    noStats: 'اعداد و شمار دستیاب نہیں',
  },
};

export const revalidate = 300;

const normalizeLocale = (value?: string): LocaleKey => {
  if (!value) {
    return 'en';
  }
  const lowered = value.toLowerCase();
  return lowered.startsWith('ur') ? 'ur' : 'en';
};

const isExternalUrl = (url?: string | null) => !!url && /^https?:\/\//i.test(url);

const resolveMediaUrl = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${STRAPI_URL}${url}`;
};

const asHomePageEntry = (payload: unknown): HomePageEntry | null => {
  if (!payload || typeof payload !== 'object' || !('data' in payload)) {
    return null;
  }

  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== 'object') {
    return null;
  }

  if ('attributes' in data && typeof (data as { attributes?: unknown }).attributes === 'object') {
    const entry = data as { id: number; attributes: Record<string, unknown> };
    return {
      id: entry.id,
      ...entry.attributes,
    } as HomePageEntry;
  }

  return data as HomePageEntry;
};

async function fetchHomePage(locale: LocaleKey): Promise<HomePageEntry | null> {
  try {
    const params = new URLSearchParams({ locale, populate: 'deep' });
    const response = await fetch(`${STRAPI_URL}/api/home-page?${params.toString()}`, {
      next: { revalidate },
    });

    if (!response.ok) {
      console.error('Failed to fetch home page', await response.text());
      return null;
    }

    const json = await response.json();
    return asHomePageEntry(json);
  } catch (error) {
    console.error('Error fetching home page', error);
    return null;
  }
}

const formatDate = (value?: string | null, locale: LocaleKey = 'en') => {
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

const formatTime = (value?: string | null, locale: LocaleKey = 'en') => {
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

export async function generateMetadata({
  searchParams,
}: {
  searchParams?: { locale?: string };
}): Promise<Metadata> {
  const locale = 'en'
  const data = await fetchHomePage(locale);

  return {
    title: data?.seo_title ?? 'Jamia Urwatul Wusqa',
    description:
      data?.seo_description ?? 'Welcome to Jamia Urwatul Wusqa, a center for seminary and contemporary education.',
  };
}

const resolveDirection = (locale: LocaleKey, contentLocale?: string | null) => {
  const resolved = (contentLocale || locale).toLowerCase();
  return rtlLocales.some((entry) => resolved.startsWith(entry)) ? 'rtl' : 'ltr';
};

const isCarouselSection = (section: DynamicSection): section is CarouselSection =>
  section.__component === 'home-page-widgets.carousel-widget';

const isNewsSection = (section: DynamicSection): section is NewsFeedSection =>
  section.__component === 'home-page-widgets.news-feed-widget';

const isMessageSection = (section: DynamicSection): section is MessageSection =>
  section.__component === 'home-page-widgets.message-widget';

const isStatisticsSection = (section: DynamicSection): section is StatisticsSection =>
  section.__component === 'home-page-widgets.statistics-widget';

const isItemGridSection = (section: DynamicSection): section is ItemGridSection =>
  section.__component === 'page-sections.item-grid-block';

const isEventsSection = (section: DynamicSection): section is EventsSection =>
  section.__component === 'home-page-widgets.events-widget';

const isImportantLinksSection = (section: DynamicSection): section is ImportantLinksSection =>
  section.__component === 'page-sections.important-links-widget';

const renderRichText = (content?: BlocksContent | null) => {
  if (!content || !Array.isArray(content) || content.length === 0) return null;
  return <BlocksRenderer content={content} />;
};

const parseCarouselItems = (section?: CarouselSection) => {
  if (!section?.slides?.length) return [];
  return section.slides.map((slide, index) => {
    const imageCandidate = Array.isArray(slide.image) ? slide.image[0] : slide.image;
    return {
      id: slide.id ?? slide.documentId ?? slide.title ?? `slide-${index}`,
      title: slide.title ?? '',
      description: slide.description ?? slide.link ?? '',
      imageUrl: resolveMediaUrl(imageCandidate?.url),
      imageAlt: imageCandidate?.alternativeText ?? slide.title ?? 'Carousel slide',
    };
  });
};

export default async function HomePage({ searchParams }: PageProps) {
  const locale = 'en'
  const data = await fetchHomePage(locale);

  if (!data) {
    return <div className="loading-state error">{copy[locale].error}</div>;
  }

  const sections = (data.page_sections ?? []) as DynamicSection[];
  const carouselSection = sections.find(isCarouselSection);
  const newsSection = sections.find(isNewsSection);
  const messageSection = sections.find(isMessageSection);
  const statsSection = sections.find(isStatisticsSection);
  const itemGridSections = sections.filter(isItemGridSection);
  const eventsSection = sections.find(isEventsSection);
  const linksSection = sections.find(isImportantLinksSection);

  const direction = resolveDirection(locale, data.locale);
  const isRTL = direction === 'rtl';
  const text = copy[locale];
  const carouselItems = parseCarouselItems(carouselSection);
  const featuredNews = newsSection?.featured_news ?? [];
  const announcementLinks = newsSection?.announcements_links ?? [];
  const stats = statsSection?.stats ?? [];
  const events = eventsSection?.featured_events ?? [];
  const programBlocks = itemGridSections.filter((section) => (section.featured_programs?.length ?? 0) > 0);
  const lifeBlocks = itemGridSections.filter((section) => (section.items?.length ?? 0) > 0);

  const upcomingEvents = events.map((event, index) => ({
    id: event.id ?? event.documentId ?? event.title ?? `event-${index}`,
    title: event.title ?? '',
    date: event.event_date ?? '',
    time: event.event_date ? formatTime(event.event_date, locale) : '',
    location: event.location ?? '',
  }));

  const lifeItems = lifeBlocks.flatMap((block) => block.items ?? []);
  const programItems = programBlocks.flatMap((block) => block.featured_programs ?? []);
  const linkItems = linksSection?.links ?? [];

  const programTitle = programBlocks[0]?.title ?? text.programsTitle;
  const lifeTitle = lifeBlocks[0]?.title ?? text.lifeTitle;
  const newsTitle = newsSection?.title ?? text.newsTitle;
  const announcementsTitle = newsSection?.announcements_title ?? text.announcementsTitle;

  return (
    <div className={`home-page ${isRTL ? 'rtl' : 'ltr'}`} dir={direction}>
      {carouselItems.length ? (
        <section className="carousel-section">
          <Carousel items={carouselItems} locale={locale} />
        </section>
      ) : null}

      {messageSection ? (
        <section className="director-message-section">
          <div className="container">
            <h2 className="section-title">{messageSection.title ?? text.directorSectionTitle}</h2>
            <div className="director-message-content">
              <div className="director-image">
                {(() => {
                  const photo = messageSection.author_photo;
                  const imageUrl = resolveMediaUrl(photo?.url);
                  if (!imageUrl) {
                    return (
                      <div className="director-image-placeholder">
                        {messageSection.author_name ?? text.directorDesignationFallback}
                      </div>
                    );
                  }

                  return (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={imageUrl}
                      alt={photo?.alternativeText ?? messageSection.author_name ?? ''}
                      className="director-photo"
                      loading="lazy"
                    />
                  );
                })()}
              </div>
              <div className="director-message-text">
                {messageSection.author_name ? (
                  <h3 className="director-name">{messageSection.author_name}</h3>
                ) : null}
                {messageSection.author_title ? (
                  <p className="director-designation">{messageSection.author_title}</p>
                ) : (
                  <p className="director-designation">{text.directorDesignationFallback}</p>
                )}
                <div className="message-text">{renderRichText(messageSection.message_body)}</div>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      {(featuredNews.length || announcementLinks.length) ? (
        <section className="announcements-section">
          <div className="container">
            <div className="section-heading">
              <h2 className="section-title">{newsTitle}</h2>
            </div>
            {featuredNews.length ? (
              <div className="announcements-list">
                {featuredNews.map((news, index) => {
                  const coverUrl = resolveMediaUrl(news?.cover_image?.url);
                  const slug = news?.slug ? `/news/${news.slug}` : undefined;
                  const cardKey = `news-${news?.id ?? news?.documentId ?? index}`;
                  return (
                    <article key={cardKey} className="announcement-card news-card">
                      {coverUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={coverUrl} alt={news?.cover_image?.alternativeText ?? news?.title ?? ''} className="announcement-cover" />
                      ) : null}
                      <div className="announcement-date">{formatDate(news?.date, locale)}</div>
                      <h3 className="announcement-title">{news?.title}</h3>
                      {slug ? (
                        <Link href={slug} className="announcement-link">
                          {text.newsLinkLabel}
                        </Link>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            ) : null}

            {announcementLinks.length ? (
              <>
                <div className="section-heading section-heading--sub">
                  <h2 className="section-title section-title--muted">{announcementsTitle}</h2>
                </div>
                <div className="announcement-links">
                  {announcementLinks.map((announcement, index) => (
                    <div key={`announcement-${announcement?.id ?? announcement?.label ?? index}`} className="announcement-pill">
                      <span>{announcement?.label}</span>
                      {announcement?.url ? (
                        isExternalUrl(announcement.url) ? (
                          <a href={announcement.url} target="_blank" rel="noopener noreferrer">
                            {text.announcementLinkLabel}
                          </a>
                        ) : (
                          <Link href={announcement.url}>{text.announcementLinkLabel}</Link>
                        )
                      ) : null}
                    </div>
                  ))}
                </div>
              </>
            ) : null}
          </div>
        </section>
      ) : (
        <section className="announcements-section">
          <div className="container">
            <h2 className="section-title">{text.announcementsTitle}</h2>
            <p className="empty-copy">{text.noAnnouncements}</p>
          </div>
        </section>
      )}

      {stats.length ? (
        <section className="statistics-section">
          <div className="container">
            <h2 className="section-title">{statsSection?.title ?? text.statsTitle}</h2>
            <div className="statistics-grid">
              {stats.map((stat, index) => (
                <div key={stat?.id ?? stat?.label ?? `stat-${index}`} className="stat-card">
                  <div className="stat-value">{stat?.number ?? stat?.value}</div>
                  <div className="stat-label">{stat?.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : (
        <section className="statistics-section empty">
          <div className="container">
            <h2 className="section-title">{text.statsTitle}</h2>
            <p className="empty-copy">{text.noStats}</p>
          </div>
        </section>
      )}

      {programItems.length ? (
        <section className="programs-section">
          <div className="container">
            <h2 className="section-title">{programTitle}</h2>
            <div className="programs-grid">
              {programItems.map((program, index) => (
                <article key={program?.id ?? program?.documentId ?? `program-${index}`} className="program-card">
                  <h3 className="program-title">{program?.title}</h3>
                  {program?.slug ? (
                    <Link href={`/programs/${program.slug}`} className="program-link">
                      {text.programDetails}
                    </Link>
                  ) : null}
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {lifeItems.length ? (
        <section className="life-at-jamia-section">
          <div className="container">
            <h2 className="section-title">{lifeTitle}</h2>
            <div className="photo-collage">
              {lifeItems.map((item, index) => {
                const photo = resolveMediaUrl(item?.photo?.url);
                const key = item?.id ?? item?.item_title ?? `life-${index}`;
                const content = (
                  <div className="collage-image-wrapper">
                    {photo ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={photo} alt={item?.photo?.alternativeText ?? item?.item_title ?? ''} className="collage-image" />
                    ) : (
                      <div className="collage-placeholder">{item?.item_title}</div>
                    )}
                    <div className="collage-overlay">
                      <h3 className="collage-title">{item?.item_title}</h3>
                      {item?.item_subtitle ? <p className="collage-description">{item?.item_subtitle}</p> : null}
                    </div>
                  </div>
                );

                if (item?.item_link) {
                  return isExternalUrl(item.item_link) ? (
                    <a key={key} href={item.item_link} className="collage-item" target="_blank" rel="noopener noreferrer">
                      {content}
                    </a>
                  ) : (
                    <Link key={key} href={item.item_link} className="collage-item">
                      {content}
                    </Link>
                  );
                }

                return (
                  <div key={key} className="collage-item">
                    {content}
                  </div>
                );
              })}
              <a href="/media-events/photo-gallery" className="collage-item collage-more-btn">
                <div className="collage-more-content">
                  <div className="more-icon">📸</div>
                  <h3 className="more-title">{text.galleryCtaTitle}</h3>
                  <p className="more-subtitle">{text.galleryCtaSubtitle}</p>
                </div>
              </a>
            </div>
          </div>
        </section>
      ) : null}

      {events.length ? (
        <section className="events-section">
          <div className="container">
            <h2 className="section-title">{eventsSection?.title ?? text.eventsTitle}</h2>
            <div className="events-grid">
              <EventCalendar events={upcomingEvents} locale={locale} />
              <a href="/media-events/events" className="event-item event-more-btn">
                <div className="event-more-content">
                  <div className="event-more-icon">📅</div>
                  <h3 className="event-more-title">{text.eventsCtaTitle}</h3>
                  <p className="event-more-subtitle">{text.eventsCtaSubtitle}</p>
                </div>
              </a>
            </div>
          </div>
        </section>
      ) : (
        <section className="events-section">
          <div className="container">
            <h2 className="section-title">{text.eventsTitle}</h2>
            <p className="empty-copy">{text.noEvents}</p>
          </div>
        </section>
      )}

      {linkItems.length ? (
        <section className="important-links-section">
          <div className="container">
            <h2 className="section-title">{linksSection?.title ?? text.linksTitle}</h2>
            <div className="links-grid">
              {linkItems.map((link, index) => (
                isExternalUrl(link.url) ? (
                  <a
                    key={link.id ?? link.label ?? `link-${index}`}
                    href={link.url ?? '#'}
                    className="link-card"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <div className="link-icon">🔗</div>
                    <h3 className="link-title">{link.label}</h3>
                    <span className="external-indicator">↗</span>
                  </a>
                ) : (
                  <Link key={link.id ?? link.label ?? `link-${index}`} href={link.url ?? '#'} className="link-card">
                    <div className="link-icon">🔗</div>
                    <h3 className="link-title">{link.label}</h3>
                  </Link>
                )
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
