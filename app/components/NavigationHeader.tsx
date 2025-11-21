import { Header, MenuItem } from './Header';
import { getServerLocale } from '../lib/get-locale';
const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337';
const NAVIGATION_REVALIDATE_SECONDS = 60;

type NavigationApiItem = {
  id: number;
  title: string;
  order: number;
  url: string | null;
  showInNav?: boolean;
  children?: NavigationApiItem[] | null;
};

function sortMenuTree(items: MenuItem[]): MenuItem[] {
  return [...items]
    .sort((a, b) => a.order - b.order)
    .map((item) => ({
      ...item,
      children: sortMenuTree(item.children ?? []),
    }));
}

function mapNavigation(items: NavigationApiItem[] = []): MenuItem[] {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    order: item.order,
    url: item.url,
    showInNav: item.showInNav,
    children: mapNavigation(item.children ?? []),
  }));
}

async function fetchNavigation(locale: string): Promise<{ items: MenuItem[]; error?: string }> {
  try {
    const url = new URL('/api/navigation', STRAPI_URL);
    url.searchParams.set('locale', locale); 

    const response = await fetch(url.toString(), {
      next: { revalidate: NAVIGATION_REVALIDATE_SECONDS },
    });

    if (!response.ok) {
      throw new Error(`Navigation fetch failed (${response.status})`);
    }

    const data = (await response.json()) as NavigationApiItem[];
    const normalized = sortMenuTree(mapNavigation(data));

    return { items: normalized };
  } catch (error) {
    console.error('Failed to load navigation menu', error);
    return {
      items: [],
      error: 'Navigation is temporarily unavailable. Please refresh.',
    };
  }
}

export async function NavigationHeader() {
  const locale = await getServerLocale();
  const { items, error } = await fetchNavigation(locale);
  
  return <Header menuItems={items} fetchError={error} />;
}
