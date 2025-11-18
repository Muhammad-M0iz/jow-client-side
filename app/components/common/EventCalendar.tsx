import { memo } from 'react';
import styles from './EventCalendar.module.css';

type TextDirection = 'ltr' | 'rtl';

export interface CalendarEvent {
  id: string | number;
  title: string;
  date: string;
  time?: string | null;
  location?: string | null;
}

export interface EventCalendarProps {
  events?: CalendarEvent[] | null;
  direction?: TextDirection;
  locale?: string;
  emptyStateText?: string;
}

const resolveDirection = (direction?: TextDirection, locale?: string): TextDirection => {
  if (direction) {
    return direction;
  }
  if (locale) {
    const normalized = locale.toLowerCase();
    if (normalized.startsWith('ur') || normalized.startsWith('ar') || normalized.startsWith('fa')) {
      return 'rtl';
    }
  }
  return 'ltr';
};

const resolveLocale = (direction: TextDirection, locale?: string) => {
  if (locale) return locale;
  return direction === 'rtl' ? 'ur-PK' : 'en-US';
};

const monthFormatterCache: Record<string, Intl.DateTimeFormat> = {};

const getFormatter = (locale: string) => {
  if (!monthFormatterCache[locale]) {
    monthFormatterCache[locale] = new Intl.DateTimeFormat(locale, {
      month: 'short',
      day: '2-digit',
    });
  }
  return monthFormatterCache[locale];
};

const splitDate = (dateValue: string, locale: string) => {
  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) {
    return { day: dateValue, month: '' };
  }
  const formatter = getFormatter(locale);
  const formatted = formatter.format(date);
  const [partMonth, partDay] = formatted.split(' ');
  return {
    day: partDay?.replace(/\D/g, '') || date.getDate().toString(),
    month: partMonth || date.toLocaleString(locale, { month: 'short' }),
  };
};

export const EventCalendar = memo(function EventCalendar({
  events,
  direction,
  locale,
  emptyStateText,
}: EventCalendarProps) {
  const resolvedDirection = resolveDirection(direction, locale);
  const resolvedLocale = resolveLocale(resolvedDirection, locale);
  const wrapperClass = `${styles.calendar} ${
    resolvedDirection === 'rtl' ? styles.rtl : styles.ltr
  }`;

  if (!events || events.length === 0) {
    return (
      <div className={`${styles.noEvents} ${resolvedDirection === 'rtl' ? styles.rtl : styles.ltr}`}>
        {emptyStateText || (resolvedDirection === 'rtl' ? 'کوئی تقریب نہیں ہے' : 'No events to display')}
      </div>
    );
  }

  return (
    <div className={wrapperClass} dir={resolvedDirection}>
      {events.map((event) => {
        const { month, day } = splitDate(event.date, resolvedLocale);
        return (
          <div key={event.id} className={styles.eventItem}>
            <div className={styles.eventDateBadge} aria-label={event.date}>
              <div className={styles.eventMonth}>{month}</div>
              <div className={styles.eventDay}>{day}</div>
            </div>
            <div className={styles.eventDetails}>
              <h4 className={styles.eventTitle}>{event.title}</h4>
              {event.time ? (
                <div className={styles.eventMeta}>⏰ {event.time}</div>
              ) : null}
              {event.location ? (
                <div className={styles.eventMeta}>📍 {event.location}</div>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
});

export default EventCalendar;
