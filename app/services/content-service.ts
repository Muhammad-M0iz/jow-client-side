import { DEFAULT_REVALIDATE, LocaleKey, STRAPI_URL } from '../lib/strapi-utils';
import type {
  HomePageEntry,
  PageEntry,
  StrapiCollection,
} from '../types/strapi-sections';

const HOME_POPULATE = 'deep';

const mapHomePayload = (payload: unknown): HomePageEntry | null => {
  if (!payload || typeof payload !== 'object' || !('data' in payload)) {
    return null;
  }

  const data = (payload as { data?: unknown }).data;
  if (!data || typeof data !== 'object') {
    return null;
  }

  const hasId = 'id' in data && typeof (data as { id?: unknown }).id === 'number';
  const hasAttributes = 'attributes' in data && typeof (data as { attributes?: unknown }).attributes === 'object';
  if (hasId && hasAttributes) {
    const entry = data as { id: number; attributes: Record<string, unknown> };
    const attributes = entry.attributes as Omit<HomePageEntry, 'id'>;
    return {
      id: entry.id,
      ...attributes,
    };
  }

  return data as HomePageEntry;
};

const buildPageQuery = (slug: string, locale: LocaleKey) => {
  const params = new URLSearchParams();
  params.set('filters[slug][$eq]', slug);
  params.set('locale', locale);
  params.set('populate[content_sections][populate]', 'deep');
  params.set('populate[children]', 'true');
  params.set('populate[forms]', 'true');
  params.set('pagination[pageSize]', '1');
  return params.toString();
};

export async function fetchHomePage(locale: LocaleKey): Promise<HomePageEntry | null> {
  const params = new URLSearchParams({ locale, populate: HOME_POPULATE });
  try {
    const response = await fetch(`${STRAPI_URL}/api/home-page?${params.toString()}`, {
      next: { revalidate: DEFAULT_REVALIDATE },
    });

    if (!response.ok) {
      console.error('Failed to fetch home page', await response.text());
      return null;
    }

    const json = await response.json();
    return mapHomePayload(json);
  } catch (error) {
    console.error('Error fetching home page', error);
    return null;
  }
}

export async function fetchPageEntry(slug: string, locale: LocaleKey): Promise<PageEntry | null> {
  const query = buildPageQuery(slug, locale);
  try {
    const response = await fetch(`${STRAPI_URL}/api/pages?${query}`, {
      next: { revalidate: DEFAULT_REVALIDATE },
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
  } catch (error) {
    console.error('Error fetching page', error);
    return null;
  }
}
