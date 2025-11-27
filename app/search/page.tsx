import type { Metadata } from 'next';
import SearchView from './SearchView';

export const metadata: Metadata = {
  title: 'Search | Jamia Urwatul Wusqa',
  description: 'Search across Jamia Urwatul Wusqa news, pages, events, and more.',
};

type SearchPageProps = {
  searchParams: Promise<{ q?: string }>;
};

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const initialQuery = typeof params?.q === 'string' ? params.q : '';
  return <SearchView initialQuery={initialQuery} />;
}
