import { type EventListItem } from './EventTypes';
import { serializeEventBody, truncateText } from './EventBodyUtils';
import styles from './EventDetailSection.module.css';

const formatDisplayDate = (value?: string | null, locale?: string | null) => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat(locale ?? 'en-US', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return value ?? '';
  }
};

const formatDisplayTime = (value?: string | null, locale?: string | null) => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat(locale ?? 'en-US', {
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(value));
  } catch {
    return '';
  }
};

const getBodySnippet = (body: EventListItem['body']) => {
  const plainText = serializeEventBody(body);
  return truncateText(plainText, 500);
};

const renderImage = (event: EventListItem) => {
  if (!event.imageUrl) {
    return null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={event.imageUrl}
      alt={event.imageAlt ?? event.title ?? ''}
      className={styles.coverImage}
      loading="lazy"
    />
  );
};

export default function EventDetailSection({
  title,
  events,
  locale,
}: {
  title?: string | null;
  events: EventListItem[];
  locale?: string | null;
}) {
  if (!events.length) {
    return null;
  }

  return (
    <section className={styles.eventDetailSection}>
      {title ? <h2 className={styles.sectionTitle}>{title}</h2> : null}
      <div className={styles.articleStack}>
        {events.map((event, index) => {
          const dateLabel = formatDisplayDate(event.date, locale);
          const timeLabel = formatDisplayTime(event.date, locale);
          const snippet = getBodySnippet(event.body);

          return (
            <article key={event.id} className={styles.article}>
              <header className={styles.articleHeader}>
                <div className={styles.metaRow}>
                  {dateLabel ? <span className={styles.date}>{dateLabel}</span> : null}
                  {timeLabel ? <span className={styles.time}>{timeLabel}</span> : null}
                  {event.location ? <span className={styles.location}>{event.location}</span> : null}
                </div>
                <div>
                  <h3 className={styles.heading}>{event.title}</h3>
                  {event.subtitle ? <p className={styles.subtitle}>{event.subtitle}</p> : null}
                </div>
              </header>
              {renderImage(event)}
              {snippet ? <p className={styles.bodySnippet}>{snippet}</p> : null}
              {index < events.length - 1 ? <div className={styles.divider} /> : null}
            </article>
          );
        })}
      </div>
    </section>
  );
}
