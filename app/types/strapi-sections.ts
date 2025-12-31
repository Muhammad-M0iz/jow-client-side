import type { BlocksContent } from '@strapi/blocks-react-renderer';

export type DynamicSection = {
  id?: number;
  __component?: string;
  [key: string]: unknown;
};

export type StrapiMedia = {
  url?: string | null;
  alternativeText?: string | null;
  caption?: string | null;
  name?: string | null;
};

export type MediaRelation =
  | StrapiMedia
  | { data?: { attributes?: StrapiMedia | null } | null }
  | null
  | undefined;

export type StrapiCollection<T> = {
  data?: T[];
};

export type PageFormFieldEntry = {
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

export type PageFormEntry = {
  id?: number;
  documentId?: string;
  name?: string | null;
  slug?: string | null;
  fields?: PageFormFieldEntry[] | null;
};

export type DynamicComponentChild = {
  id?: number;
  documentId?: string;
  title?: string | null;
  slug?: string | null;
  description?: string | null;
};

export type PageEntry = {
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

export type HomePageEntry = {
  id: number;
  locale?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
  page_sections?: DynamicSection[];
};

export type FeaturedImageSection = DynamicSection & {
  __component: 'page-sections.featured-image';
  image?: StrapiMedia | null;
  caption?: string | null;
};

export type RichTextSection = DynamicSection & {
  __component: 'page-sections.rich-text-block';
  body?: BlocksContent | string | null;
};

export type GetInTouchSection = DynamicSection & {
  __component: 'page-sections.get-in-touch-widget';
  title?: string | null;
  contact_number?: string | null;
  email?: string | null;
  button_link?: string | null;
  button_label?: string | null;
};

export type QuickLinksEntry = {
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

export type QuickLinksSection = DynamicSection & {
  __component: 'page-sections.quick-links';
  title?: string | null;
  menu_items?: QuickLinksEntry[];
};

export type ImportantLinkEntry = {
  id?: number;
  label?: string | null;
  title?: string | null;
  url?: string | null;
  isExternal?: boolean | null;
  is_external?: boolean | null;
};

export type ImportantLinksSection = DynamicSection & {
  __component: 'page-sections.important-links-widget';
  title?: string | null;
  links?: ImportantLinkEntry[];
};

export type FacultyDepartmentEntry = {
  id?: number;
  name?: string | null;
};

export type FacultyMemberEntry = {
  id?: number;
  documentId?: string;
  name?: string | null;
  designation?: string | null;
  subtitle?: string | null;
  photo?: MediaRelation;
  departments?: FacultyDepartmentEntry[];
};

export type FacultyWidgetSection = DynamicSection & {
  __component: 'page-sections.faculty-widget';
  title?: string | null;
  subtitle?: string | null;
  faculty_members?: FacultyMemberEntry[];
};

export type NewsArticleEntry = {
  id?: number;
  documentId?: string;
  title?: string | null;
  slug?: string | null;
  date?: string | null;
  category?: string | null;
  body?: BlocksContent | string | null;
  cover_image?: MediaRelation;
};

export type AnnouncementLinkEntry = {
  id?: number;
  label?: string | null;
  url?: string | null;
};

export type NewsFeedSection = DynamicSection & {
  __component: 'home-page-widgets.news-feed-widget';
  title?: string | null;
  announcements_title?: string | null;
  featured_news?: NewsArticleEntry[];
  announcements_links?: AnnouncementLinkEntry[];
};

export type ItemGridEntry = {
  id?: number;
  item_title?: string | null;
  item_subtitle?: string | null;
  item_link?: string | null;
};

export type ItemGridSection = DynamicSection & {
  __component: 'page-sections.item-grid-block';
  title?: string | null;
  items?: Array<ItemGridEntry | LifeItem>;
  featured_programs?: ProgramEntry[];
};

export type VideoEntry = {
  id?: number;
  documentId?: string;
  title?: string | null;
  description?: string | null;
  video_file?: StrapiMedia | null;
};

export type VideoSection = DynamicSection & {
  __component: 'page-sections.video';
  title?: string | null;
  videos?: VideoEntry[];
};

export type PhotoMediaEntry = {
  id?: number;
  documentId?: string;
  url?: string | null;
  alternativeText?: string | null;
  caption?: string | null;
};

export type PhotoAlbumEntry = {
  id?: number;
  documentId?: string;
  title?: string | null;
  slug?: string | null;
  description?: string | null;
  photos?: PhotoMediaEntry[];
};

export type PhotoAlbumWidgetSection = DynamicSection & {
  __component: 'page-sections.photo-album-widget';
  title?: string | null;
  photo_albums?: PhotoAlbumEntry[];
};

export type DownloadFile = {
  id?: number;
  url?: string | null;
  name?: string | null;
};

export type DownloadEntry = {
  id?: number;
  documentId?: string;
  title?: string | null;
  file?: DownloadFile | null;
};

export type DownloadSection = DynamicSection & {
  __component: 'page-sections.downloads';
  title?: string | null;
  downloads?: DownloadEntry[];
};

export type TestimonialEntry = {
  id?: number;
  documentId?: string;
  author_name?: string | null;
  designation?: string | null;
  body?: string | null;
  photo?: MediaRelation;
};

export type TestimonialsSection = DynamicSection & {
  __component: 'page-sections.testimonials-widget';
  title?: string | null;
  testimonials?: TestimonialEntry[];
};

export type TableColumn = {
  type?: string | null;
  label?: string | null;
  required?: boolean | null;
};

export type TableSection = DynamicSection & {
  __component: 'page-sections.table';
  title?: string | null;
  Table?: {
    rows?: string[][] | null;
    columns?: TableColumn[] | null;
  } | null;
};

export type EventsWidgetEntry = {
  id?: number;
  documentId?: string;
  title?: string | null;
  subtitle?: string | null;
  slug?: string | null;
  event_date?: string | null;
  location?: string | null;
  body?: BlocksContent | string | null;
  featured_image?: MediaRelation;
};

export type EventsWidgetSection = DynamicSection & {
  __component: 'home-page-widgets.events-widget';
  title?: string | null;
  featured_events?: EventsWidgetEntry[];
};

export type MessageSection = DynamicSection & {
  __component: 'home-page-widgets.message-widget';
  title?: string;
  author_name?: string;
  author_title?: string;
  author_photo?: StrapiMedia | null;
  message_body?: BlocksContent | null;
};

export type StatisticsSection = DynamicSection & {
  __component: 'home-page-widgets.statistics-widget';
  title?: string;
  stats?: StatsItem[];
};

export type StatsItem = {
  id?: number;
  number?: string | null;
  value?: string | null;
  label?: string | null;
};

export type ProgramEntry = {
  id?: number;
  documentId?: string;
  title?: string | null;
  link?: string | null;
};

export type LifeItem = {
  id?: number;
  item_title?: string | null;
  item_subtitle?: string | null;
  item_link?: string | null;
  photo?: StrapiMedia | null;
};

export type AnnouncementsWidgetSection = DynamicSection & {
  __component: 'home-page-widgets.announcements';
  title?: string | null;
  announcements?: AnnouncementEntry[];
};

export type AnnouncementEntry = {
  id?: number;
  documentId?: string;
  date?: string | null;
  title?: string | null;
  subtitle?: string | null;
};

export type CarouselSlide = {
  id?: number;
  documentId?: string;
  title?: string | null;
  description?: string | null;
  link?: string | null;
  image?: StrapiMedia | StrapiMedia[] | null;
};

export type CarouselSection = DynamicSection & {
  __component: 'home-page-widgets.carousel-widget';
  slides?: CarouselSlide[];
};
