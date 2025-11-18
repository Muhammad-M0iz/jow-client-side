import type { Metadata } from 'next';
import SearchView from './SearchView';

export const metadata: Metadata = {
  title: 'Search | Jamia Urwatul Wusqa',
  description: 'Search across Jamia Urwatul Wusqa news, pages, events, and more.',
};

export default function SearchPage({ searchParams }: { searchParams?: { q?: string } }) {
  const initialQuery = typeof searchParams?.q === 'string' ? searchParams.q : '';
  return <SearchView initialQuery={initialQuery} />;
}
