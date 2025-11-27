import type { Metadata } from 'next';
import Link from 'next/link';
import { BlocksRenderer, type BlocksContent } from '@strapi/blocks-react-renderer';
import Carousel from './components/common/Carousel';
import EventCalendar from './components/common/EventCalendar';
import FeaturedNews from './components/common/FeaturedNews';
import './HomePage.css';
import { getServerLocale } from './lib/get-locale';
import {
  fallbackLocale,
  normalizeLocale,
  resolveDirection,
  resolveMediaUrl,
  type LocaleKey,
} from './lib/strapi-utils';
import {
  isAnnouncementsWidgetSection,
  isCarouselSection,
  isEventsSection,
  isImportantLinksSection,
  isItemGridSection,
  isMessageSection,
  isNewsSection,
  isStatisticsSection,
  mapAnnouncements,
  mapFeaturedNewsSection,
  mapImportantLinks,
  mapLifeItems,
  mapProgramItems,
  mapStats,
  mapUpcomingEvents,
  parseCarouselItems,
} from './lib/mappers/home-mappers';
import type { AnnouncementCard, LifeGalleryItem } from './lib/mappers/home-mappers';
import type { DynamicSection, StatsItem } from './types/strapi-sections';
import { fetchHomePage } from './services/content-service';

type ImportantLinkItem = ReturnType<typeof mapImportantLinks>[number];

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
const renderRichText = (content?: BlocksContent | null) => {
  if (!content || !Array.isArray(content) || content.length === 0) return null;
  return <BlocksRenderer content={content} />;
};

const loadHomePage = async (locale: LocaleKey) => {
  const page = await fetchHomePage(locale);
  if (page) {
    return page;
  }
  if (locale !== fallbackLocale) {
    return fetchHomePage(fallbackLocale);
  }
  return null;
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = normalizeLocale(await getServerLocale());
  const data = await loadHomePage(locale);

  return {
    title: data?.seo_title ?? 'Jamia Urwatul Wusqa',
    description:
      data?.seo_description ?? 'Welcome to Jamia Urwatul Wusqa, a center for seminary and contemporary education.',
  };
}

export default async function HomePage() {
  const serverLocale = normalizeLocale(await getServerLocale());
  const data = await loadHomePage(serverLocale);

  if (!data) {
    return <div className="loading-state error">{copy[serverLocale].error}</div>;
  }

  const sections = Array.isArray(data.page_sections) ? (data.page_sections as DynamicSection[]) : [];
  const carouselSection = sections.find(isCarouselSection);
  const newsSection = sections.find(isNewsSection);
  const messageSection = sections.find(isMessageSection);
  const statsSection = sections.find(isStatisticsSection);
  const itemGridSections = sections.filter(isItemGridSection);
  const eventsSection = sections.find(isEventsSection);
  const importantLinksSections = sections.filter(isImportantLinksSection);
  const announcementsSection = sections.find(isAnnouncementsWidgetSection);

  const resolvedLocale = normalizeLocale(data.locale ?? serverLocale);
  const direction = resolveDirection(resolvedLocale, data.locale);
  const isRTL = direction === 'rtl';
  const text = copy[resolvedLocale];
  const carouselItems = parseCarouselItems(carouselSection);
  const featuredNewsData = mapFeaturedNewsSection(newsSection, resolvedLocale);
  const announcements = mapAnnouncements(announcementsSection?.announcements, resolvedLocale);
  const stats = (mapStats(statsSection) ?? []) as StatsItem[];
  const programItems = mapProgramItems(itemGridSections);
  const lifeItems = mapLifeItems(itemGridSections);
  const upcomingEvents = mapUpcomingEvents(eventsSection, resolvedLocale);
  const importantLinks: ImportantLinkItem[] = importantLinksSections.flatMap((section) => mapImportantLinks(section));
  const programSectionWithItems = itemGridSections.find((section) => section.featured_programs?.length);
  const lifeSectionWithItems = itemGridSections.find((section) => Array.isArray(section.items) && section.items.length);
  const importantLinksTitleSection = importantLinksSections.find((section) => section.title);
  const programTitle = programSectionWithItems?.title ?? text.programsTitle;
  const lifeTitle = lifeSectionWithItems?.title ?? text.lifeTitle;
  const statsTitle = statsSection?.title ?? text.statsTitle;
  const eventsTitle = eventsSection?.title ?? text.eventsTitle;
  const announcementsTitle = announcementsSection?.title ?? text.announcementsTitle;
  const newsTitle = featuredNewsData.newsTitle ?? text.newsTitle;
  const featuredAnnouncementsTitle = featuredNewsData.announcementsTitle ?? text.announcementsTitle;
  const linksTitle = importantLinksTitleSection?.title ?? text.linksTitle;

  return (
    <div className={`home-page ${isRTL ? 'rtl' : 'ltr'}`} dir={direction}>
      {carouselItems.length ? (
        <section className="carousel-section">
          <Carousel items={carouselItems} locale={resolvedLocale} />
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

      <FeaturedNews
        newsTitle={newsTitle}
        announcementsTitle={featuredAnnouncementsTitle}
        fallbackTitle={text.announcementsTitle}
        newsLinkLabel={text.newsLinkLabel}
        announcementLinkLabel={text.announcementLinkLabel}
        featuredNews={featuredNewsData.cards}
        announcementLinks={featuredNewsData.announcementLinks}
        emptyAnnouncementsCopy={text.noAnnouncements}
      />

      {announcements.length ? (
        <section className="announcements-section">
          <div className="container">
            <h2 className="section-title">{announcementsTitle}</h2>
            <div className="announcements-list">
              {announcements.map((announcement: AnnouncementCard) => (
                <div key={announcement.id} className="announcement-card">
                  {announcement.dateLabel ? <div className="announcement-date">{announcement.dateLabel}</div> : null}
                  {announcement.title ? <h3 className="announcement-title">{announcement.title}</h3> : null}
                  {announcement.description ? (
                    <p className="announcement-description">{announcement.description}</p>
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {stats.length ? (
        <section className="statistics-section">
          <div className="container">
            <h2 className="section-title">{statsTitle}</h2>
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
              {lifeItems.map((item: LifeGalleryItem, index) => {
                const key = item.id ?? `life-${index}`;
                const content = (
                  <div className="collage-image-wrapper">
                    {item.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={item.imageUrl} alt={item.imageAlt ?? item.title ?? ''} className="collage-image" />
                    ) : (
                      <div className="collage-placeholder">{item.title}</div>
                    )}
                    <div className="collage-overlay">
                      <h3 className="collage-title">{item.title}</h3>
                      {item.subtitle ? <p className="collage-description">{item.subtitle}</p> : null}
                    </div>
                  </div>
                );

                if (item.href) {
                  return item.isExternal ? (
                    <a key={key} href={item.href} className="collage-item" target="_blank" rel="noopener noreferrer">
                      {content}
                    </a>
                  ) : (
                    <Link key={key} href={item.href} className="collage-item">
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
              <Link href="/media-events/photo-gallery" className="collage-item collage-more-btn">
                <div className="collage-more-content">
                  <div className="more-icon">📸</div>
                  <h3 className="more-title">{text.galleryCtaTitle}</h3>
                  <p className="more-subtitle">{text.galleryCtaSubtitle}</p>
                </div>
              </Link>
            </div>
          </div>
        </section>
      ) : null}

      {upcomingEvents.length ? (
        <section className="events-section">
          <div className="container">
            <h2 className="section-title">{eventsTitle}</h2>
            <div className="events-grid">
              <EventCalendar events={upcomingEvents} locale={resolvedLocale} />
              <Link href="/events" className="event-item event-more-btn">
                <div className="event-more-content">
                  <div className="event-more-icon">📅</div>
                  <h3 className="event-more-title">{text.eventsCtaTitle}</h3>
                  <p className="event-more-subtitle">{text.eventsCtaSubtitle}</p>
                </div>
              </Link>
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

      {importantLinks.length ? (
        <section className="important-links-section">
          <div className="container">
            <h2 className="section-title">{linksTitle}</h2>
            <div className="links-grid">
              {importantLinks.map((link: ImportantLinkItem, index: number) => {
                const key = link.id ?? link.label ?? `link-${index}`;
                const label = link.label ?? link.url ?? 'Link';
                if (link.isExternal) {
                  return (
                    <a key={key} href={link.url ?? '#'} className="link-card" target="_blank" rel="noopener noreferrer">
                      <div className="link-icon">🔗</div>
                      <h3 className="link-title">{label}</h3>
                      <span className="external-indicator">↗</span>
                    </a>
                  );
                }
                return (
                  <Link key={key} href={link.url ?? '#'} className="link-card">
                    <div className="link-icon">🔗</div>
                    <h3 className="link-title">{label}</h3>
                  </Link>
                );
              })}
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}
