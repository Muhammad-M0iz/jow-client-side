import Link from 'next/link';
import '../../HomePage.css';

export type FeaturedNewsCard = {
  id: string | number;
  title?: string | null;
  dateLabel?: string | null;
  linkHref?: string | null;
  isExternal?: boolean | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
};

export type AnnouncementLinkItem = {
  id: string | number;
  label?: string | null;
  href?: string | null;
  isExternal?: boolean | null;
};

type FeaturedNewsProps = {
  newsTitle: string;
  announcementsTitle: string;
  fallbackTitle: string;
  newsLinkLabel: string;
  announcementLinkLabel: string;
  featuredNews?: FeaturedNewsCard[];
  announcementLinks?: AnnouncementLinkItem[];
  emptyAnnouncementsCopy: string;
};

export default function FeaturedNews({
  newsTitle,
  announcementsTitle,
  fallbackTitle,
  newsLinkLabel,
  announcementLinkLabel,
  featuredNews = [],
  announcementLinks = [],
  emptyAnnouncementsCopy,
}: FeaturedNewsProps) {
  const hasNews = featuredNews.length > 0;
  const hasAnnouncements = announcementLinks.length > 0;

  if (!hasNews && !hasAnnouncements) {
    return (
      <section className="announcements-section">
        <div className="container">
          <h2 className="section-title">{fallbackTitle}</h2>
          <p className="empty-copy">{emptyAnnouncementsCopy}</p>
        </div>
      </section>
    );
  }

  return (
    <section className="announcements-section">
      <div className="container">
        <div className="section-heading">
          <h2 className="section-title">{newsTitle}</h2>
        </div>

        {hasNews ? (
          <div className="announcements-list">
            {featuredNews.map((news) => (
              <article key={news.id} className="announcement-card news-card">
                {news.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={news.imageUrl} alt={news.imageAlt ?? news.title ?? ''} className="announcement-cover" />
                ) : null}
                {news.dateLabel ? <div className="announcement-date">{news.dateLabel}</div> : null}
                {news.title ? <h3 className="announcement-title">{news.title}</h3> : null}
                {news.linkHref ? (
                  news.isExternal ? (
                    <a href={news.linkHref} className="announcement-link" target="_blank" rel="noopener noreferrer">
                      {newsLinkLabel}
                    </a>
                  ) : (
                    <Link href={news.linkHref} className="announcement-link">
                      {newsLinkLabel}
                    </Link>
                  )
                ) : null}
              </article>
            ))}
          </div>
        ) : null}

        {hasAnnouncements ? (
          <>
            <div className="section-heading section-heading--sub">
              <h2 className="section-title section-title--muted">{announcementsTitle}</h2>
            </div>
            <div className="announcement-links">
              {announcementLinks.map((announcement) => (
                <div key={announcement.id} className="announcement-pill">
                  <span>{announcement.label}</span>
                  {announcement.href ? (
                    announcement.isExternal ? (
                      <a href={announcement.href} target="_blank" rel="noopener noreferrer">
                        {announcementLinkLabel}
                      </a>
                    ) : (
                      <Link href={announcement.href}>{announcementLinkLabel}</Link>
                    )
                  ) : null}
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
