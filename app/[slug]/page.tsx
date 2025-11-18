import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import type { BlocksContent } from '@strapi/blocks-react-renderer';
import ContentPage, {
  type ChildPageSummary,
  type ContactWidgetData,
  type FeaturedImageData,
  type QuickLinkItem,
  type ImportantLinkItem,
  type RichTextBlockData,
} from '../components/page/ContentPage';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337';
const fallbackLocale: LocaleKey = 'en';
export const revalidate = 300;

type LocaleKey = 'en' | 'ur';

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

const buildQueryString = (slug: string, locale: LocaleKey) => {
  const params = new URLSearchParams();
  params.set('filters[slug][$eq]', slug);
  params.set('locale', locale);
  params.set('populate[content_sections][populate]', 'deep');
  params.set('populate[children]', 'true');
  params.set('pagination[pageSize]', '1');
  return params.toString();
};

async function fetchPageEntry(slug: string, locale: LocaleKey): Promise<PageEntry | null> {
  const query = buildQueryString(slug, locale);
  const response = await fetch(`${STRAPI_URL}/api/pages?${query}`, {
    next: { revalidate },
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

const mapFeaturedImage = (section?: FeaturedImageSection | null): FeaturedImageData | null => {
  if (!section) return null;
  const url = resolveMediaUrl(section.image?.url);
  return {
    id: section.id,
    url,
    alt: section.image?.alternativeText ?? undefined,
    caption: section.caption ?? undefined,
  };
};

const mapRichTextBlocks = (sections: RichTextSection[]): RichTextBlockData[] =>
  sections.map((section, index) => ({
    id: section.id ?? `rich-text-${index}`,
    body: section.body ?? null,
  }));

const mapContactWidgets = (sections: GetInTouchSection[]): ContactWidgetData[] =>
  sections.map((section, index) => ({
    id: section.id ?? `contact-${index}`,
    title: section.title ?? null,
    contact_number: section.contact_number ?? null,
    email: section.email ?? null,
    button_link: section.button_link ?? null,
    button_label: section.button_label ?? null,
    buttonLabel: (section as { buttonLabel?: string | null }).buttonLabel ?? null,
  }));

const mapChildPages = (children?: DynamicComponentChild[]): ChildPageSummary[] => {
  if (!children?.length) return [];
  return children.map((child, index) => ({
    id: child.id ?? child.documentId ?? `child-${index}`,
    title: child.title ?? null,
    slug: child.slug ?? null,
    description: child.description ?? null,
  }));
};

const mapImportantLinks = (sections: ImportantLinksSection[]): ImportantLinkItem[] => {
  if (!sections.length) return [];
  return sections.flatMap((section) => {
    const links = Array.isArray(section.links) ? section.links : [];
    return links.map<ImportantLinkItem>((link, index) => ({
      id: link.id ?? `important-link-${index}`,
      label: link.label ?? link.title ?? null,
      url: link.url ?? null,
      isExternal: link.isExternal ?? link.is_external ?? null,
    }));
  });
};

const mapQuickLinks = (sections: QuickLinksSection[]): QuickLinkItem[] => {
  if (!sections.length) return [];
  return sections.flatMap((section) => {
    const items = Array.isArray(section.menu_items) ? section.menu_items : [];
    return items
      .map<QuickLinkItem | null>((item, index) => {
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
        return {
          id: item.id ?? `quick-link-${index}`,
          label,
          href: hrefCandidate,
          isExternal: item.isExternal ?? item.is_external ?? /^https?:\/\//i.test(hrefCandidate ?? ''),
        } satisfies QuickLinkItem;
      })
      .filter((link): link is QuickLinkItem => Boolean(link));
  });
};

type PageProps = {
  params: Promise<{ slug: string }>;
  searchParams?: { locale?: string };
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const locale = 'en';
  const resolvedParams = await params;
  const page = await fetchPageEntry(resolvedParams.slug, locale);

  if (!page && locale !== fallbackLocale) {
    const fallbackPage = await fetchPageEntry(resolvedParams.slug, fallbackLocale);
    if (!fallbackPage) {
      return { title: 'Page not found' };
    }
    return {
      title: fallbackPage.title ?? fallbackPage.seo_title ?? 'Jamia Page',
      description: fallbackPage.seo_description ?? undefined,
    };
  }

  if (!page) {
    return { title: 'Page not found' };
  }

  return {
    title: page.title ?? page.seo_title ?? 'Jamia Page',
    description: page.seo_description ?? undefined,
  };
}

export default async function DynamicContentPage({ params }: PageProps) {
    const resolvedParams = await params;
  const locale = 'en';
  // Now it's safe to access params.slug
  const page = await fetchPageEntry(resolvedParams.slug, locale);

  const resolvedPage = page ?? (locale !== fallbackLocale ? await fetchPageEntry(resolvedParams.slug, fallbackLocale) : null);

  if (!resolvedPage) {
    notFound();
  }

  const sections = Array.isArray(resolvedPage.content_sections) ? resolvedPage.content_sections : [];
  const featuredImageSection = sections.find(isFeaturedImageSection) ?? null;
  const richTextSections = sections.filter(isRichTextSection);
  const contactSections = sections.filter(isGetInTouchSection);
  const importantLinkSections = sections.filter(isImportantLinksSection);
  const quickLinksSections = sections.filter(isQuickLinksSection);

  const featuredImage = mapFeaturedImage(featuredImageSection);
  const richTextBlocks = mapRichTextBlocks(richTextSections);
  const contactWidgets = mapContactWidgets(contactSections);
  const childPages = mapChildPages(resolvedPage.children);
  const importantLinks = mapImportantLinks(importantLinkSections);
  const quickLinks = mapQuickLinks(quickLinksSections);
  const quickLinksTitle = quickLinksSections.find((section) => !!section.title)?.title ?? null;
  const resolvedLocale = normalizeLocale(resolvedPage.locale ?? locale);

  return (
    <ContentPage
      title={resolvedPage.title ?? resolvedPage.slug}
      locale={resolvedLocale}
      featuredImage={featuredImage}
      richTextBlocks={richTextBlocks}
      contactWidgets={contactWidgets}
      childPages={childPages}
      importantLinks={importantLinks}
      quickLinks={quickLinks}
      quickLinksTitle={quickLinksTitle}
    />
  );
}
