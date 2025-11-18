import type { FooterContent } from '../components/Footer';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

export type FooterApiResponse = {
  data?: FooterApiEntry | null;
};

export type FooterApiEntry = {
  title?: string | null;
  subtitle?: string | null;
  contact?: {
    number?: string | null;
    email?: string | null;
    location?: string | null;
  } | null;
  Quicklinks?: FooterApiQuickLinkGroup[] | null;
  importantLinks?: FooterApiImportantGroup[] | null;
  copyright_text?: string | null;
};

export type FooterApiQuickLinkGroup = {
  id?: number | null;
  title?: string | null;
  menu_items?: FooterApiQuickLinkItem[] | null;
};

export type FooterApiQuickLinkItem = {
  id?: number | null;
  title?: string | null;
  custom_url?: string | null;
  page_link?: {
    slug?: string | null;
    title?: string | null;
  } | null;
};

export type FooterApiImportantGroup = {
  id?: number | null;
  title?: string | null;
  links?: FooterApiImportantLink[] | null;
};

export type FooterApiImportantLink = {
  id?: number | null;
  label?: string | null;
  title?: string | null;
  url?: string | null;
  isExternal?: boolean | null;
};

const normalizeHref = (value?: string | null) => {
  if (!value) return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (/^(https?:|mailto:|tel:)/i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return trimmed;
  }
  return `/${trimmed}`;
};

const mapQuickLinkGroups = (groups?: FooterApiQuickLinkGroup[] | null): FooterContent['quickLinks'] => {
  if (!Array.isArray(groups)) return [];
  return groups
    .map((group, groupIndex) => {
      const items = (group.menu_items ?? [])
        .map((item, itemIndex) => {
          const href = normalizeHref(item.custom_url ?? item.page_link?.slug ?? null);
          if (!href) {
            return null;
          }
          const label = item.title ?? item.page_link?.title ?? href;
          return {
            id: item.id ?? `quick-link-${groupIndex}-${itemIndex}`,
            label,
            href,
            isExternal: /^(https?:|mailto:|tel:)/i.test(href),
          };
        })
        .filter(Boolean) as FooterContent['quickLinks'][number]['items'];

      if (!items.length) {
        return null;
      }

      return {
        id: group.id ?? `quick-group-${groupIndex}`,
        title: group.title ?? undefined,
        items,
      };
    })
    .filter(Boolean) as FooterContent['quickLinks'];
};

const mapImportantLinkGroups = (groups?: FooterApiImportantGroup[] | null): FooterContent['importantLinks'] => {
  if (!Array.isArray(groups)) return [];
  return groups
    .map((group, groupIndex) => {
      const items = (group.links ?? [])
        .map((link, linkIndex) => {
          const label = link.label ?? link.title ?? link.url;
          if (!label) {
            return null;
          }
          return {
            id: link.id ?? `important-link-${groupIndex}-${linkIndex}`,
            label,
            href: link.url ?? undefined,
            isExternal: link.isExternal ?? undefined,
          };
        })
        .filter(Boolean) as FooterContent['importantLinks'][number]['items'];

      if (!items.length) {
        return null;
      }

      return {
        id: group.id ?? `important-group-${groupIndex}`,
        title: group.title ?? undefined,
        items,
      };
    })
    .filter(Boolean) as FooterContent['importantLinks'];
};

const buildFooterContent = (entry?: FooterApiEntry | null): FooterContent | null => {
  if (!entry) {
    return null;
  }

  return {
    title: entry.title ?? null,
    subtitle: entry.subtitle ?? null,
    contact: entry.contact ?? null,
    quickLinks: mapQuickLinkGroups(entry.Quicklinks),
    importantLinks: mapImportantLinkGroups(entry.importantLinks),
    copyright: entry.copyright_text ?? null,
  };
};

export async function getFooter(locale: string): Promise<FooterContent | null> {
  const params = new URLSearchParams();
  params.set('locale', locale);
  params.set('populate', '*');

  try {
    const res = await fetch(`${STRAPI_URL}/api/footer?${params.toString()}`, {
      next: { revalidate: 300 },
    });

    if (!res.ok) {
      console.error('Failed to fetch footer', res.status, res.statusText);
      return null;
    }

    const payload = (await res.json()) as FooterApiResponse;
    return buildFooterContent(payload.data ?? null);
  } catch (error) {
    console.error('Error fetching footer:', error);
    return null;
  }
}
