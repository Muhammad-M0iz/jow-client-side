'use client';

import { useEffect, useMemo, useState } from 'react';
import Calendar from 'react-calendar';
import type { EventsCalendarData, EventListItem } from './EventTypes';
import { serializeEventBody, truncateText } from './EventBodyUtils';
import styles from './EventsCalendarSection.module.css';
import 'react-calendar/dist/Calendar.css';

type EventsCalendarSectionProps = {
  data: EventsCalendarData;
  locale?: string | null;
  direction?: 'ltr' | 'rtl';
  listHeading: string;
  emptyState: string;
};

type CalendarTileProperties = {
  date: Date;
  view: 'month' | 'year' | 'decade' | 'century';
};

const formatDateKey = (value?: string | Date | null) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toISOString().split('T')[0];
};

const sortEventsAscending = (events: EventListItem[]) =>
  [...events].sort((a, b) => {
    const aDate = a.date ? new Date(a.date).getTime() : Number.POSITIVE_INFINITY;
    const bDate = b.date ? new Date(b.date).getTime() : Number.POSITIVE_INFINITY;
    return aDate - bDate;
  });

const formatDisplayDate = (value?: string | null, locale?: string | null) => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat(locale ?? 'en-US', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(new Date(value));
  } catch {
    return value;
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

const buildEventsLookup = (events: EventListItem[]) =>
  events.reduce<Record<string, EventListItem[]>>((acc, event) => {
    const key = formatDateKey(event.date);
    if (!key) {
      return acc;
    }
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(event);
    return acc;
  }, {});

const getInitialDate = (events: EventListItem[]): Date | null => {
  const firstWithDate = events.find((event) => event.date);
  if (!firstWithDate?.date) {
    return null;
  }
  const date = new Date(firstWithDate.date);
  return Number.isNaN(date.getTime()) ? null : date;
};

const tileContent = (lookup: Record<string, EventListItem[]>) =>
  function CalendarTileContent({ date, view }: CalendarTileProperties) {
    if (view !== 'month') {
      return null;
    }
    const key = formatDateKey(date);
    if (!key || !lookup[key]) {
      return null;
    }
    return <span className={styles.eventDot} aria-hidden="true" />;
  };

export default function EventsCalendarSection({
  data,
  locale,
  direction = 'ltr',
  listHeading,
  emptyState,
}: EventsCalendarSectionProps) {
  const sortedEvents = useMemo(() => sortEventsAscending(data.events), [data.events]);
  const lookup = useMemo(() => buildEventsLookup(sortedEvents), [sortedEvents]);
  const initialDate = useMemo(() => getInitialDate(sortedEvents), [sortedEvents]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(initialDate);

  useEffect(() => {
    setSelectedDate(initialDate);
  }, [initialDate]);

  const selectedKey = formatDateKey(selectedDate ?? undefined);
  const dailyEvents = selectedKey && lookup[selectedKey] ? lookup[selectedKey] : [];

  return (
    <section className={styles.eventsSection} dir={direction}>
      <div className={styles.eventsHeader}>
        {data.title ? <h2 className={styles.sectionTitle}>{data.title}</h2> : null}
        <p className={styles.sectionSubtitle}>{listHeading}</p>
      </div>
      <div className={styles.calendarLayout}>
        <div className={styles.calendarCard}>
          <Calendar
            value={selectedDate ?? undefined}
            onClickDay={(value) => setSelectedDate(value)}
            locale={locale ?? undefined}
            className={styles.calendar}
            tileContent={tileContent(lookup)}
            prev2Label={null}
            next2Label={null}
          />
          <div className={styles.dailyList}>
            <h3 className={styles.dailyHeading}>
              {selectedDate ? formatDisplayDate(selectedDate.toISOString(), locale) : emptyState}
            </h3>
            {dailyEvents.length ? (
              <ul className={styles.dailyEvents}>
                {dailyEvents.map((event) => (
                  <li key={`daily-${event.id}`} className={styles.dailyEventItem}>
                    <p className={styles.dailyEventTitle}>{event.title}</p>
                    {event.location ? <p className={styles.meta}>{event.location}</p> : null}
                    {event.date ? <p className={styles.meta}>{formatDisplayTime(event.date, locale)}</p> : null}
                  </li>
                ))}
              </ul>
            ) : (
              <p className={styles.emptyState}>{emptyState}</p>
            )}
          </div>
        </div>

        <div className={styles.eventsListCard}>
          <h3 className={styles.listHeading}>{listHeading}</h3>
          {sortedEvents.length ? (
            <ul className={styles.eventsList}>
              {sortedEvents.map((event) => {
                const dateLabel = formatDisplayDate(event.date, locale);
                const timeLabel = formatDisplayTime(event.date, locale);
                const bodyText = truncateText(serializeEventBody(event.body));
                return (
                  <li key={event.id} className={styles.eventCard}>
                    <div className={styles.eventMetaBlock}>
                      {dateLabel ? <p className={styles.eventDate}>{dateLabel}</p> : null}
                      {timeLabel ? <p className={styles.eventTime}>{timeLabel}</p> : null}
                    </div>
                    <div className={styles.eventContent}>
                      <h4 className={styles.eventTitle}>{event.title}</h4>
                      {event.subtitle ? <p className={styles.eventSubtitle}>{event.subtitle}</p> : null}
                      {event.location ? <p className={styles.eventLocation}>📍 {event.location}</p> : null}
                      {bodyText ? <p className={styles.eventBody}>{bodyText}</p> : null}
                    </div>
                    {event.imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={event.imageUrl}
                        alt={event.imageAlt ?? event.title ?? ''}
                        className={styles.eventImage}
                        loading="lazy"
                      />
                    ) : null}
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className={styles.emptyState}>{emptyState}</p>
          )}
        </div>
      </div>
    </section>
  );
}
