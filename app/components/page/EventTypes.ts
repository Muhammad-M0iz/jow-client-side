import type { BlocksContent } from '@strapi/blocks-react-renderer';

export type EventListItem = {
  id: string | number;
  title?: string | null;
  subtitle?: string | null;
  date?: string | null;
  location?: string | null;
  slug?: string | null;
  body?: BlocksContent | string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
};

export type EventsCalendarData = {
  title?: string | null;
  events: EventListItem[];
};
