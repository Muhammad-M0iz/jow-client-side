'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import SearchInput from '@/app/components/common/Search';
import SearchCard from '@/app/components/common/SearchCard';
import { useSearch } from '@/app/hooks/useSearch';
import './SearchPage.css';

export type SearchViewProps = {
  initialQuery?: string;
};

const formatIndexTitle = (value: string) =>
  value
    .split(/[-_]/)
    .map((segment) => segment.charAt(0).toUpperCase() + segment.slice(1))
    .join(' ');

export default function SearchView({ initialQuery = '' }: SearchViewProps) {
  const { query, setQuery, results, status, error, hasResults, activeQuery } = useSearch({ initialQuery });
  const router = useRouter();

  useEffect(() => {
    const params = new URLSearchParams();
    if (activeQuery) {
      params.set('q', activeQuery);
    }
    const search = params.toString();
    router.replace(`/search${search ? `?${search}` : ''}`, { scroll: false });
  }, [activeQuery, router]);

  return (
    <section className="search-page">
      <div className="container">
        <h1>Search Jamia</h1>
        <SearchInput
          id="search-page-input"
          value={query}
          onChange={setQuery}
          placeholder="Search articles, pages, events..."
          autoFocus
          isLoading={status === 'loading'}
        />
        {activeQuery ? (
          <p className="search-meta">
            Showing results for <strong>“{activeQuery}”</strong>
          </p>
        ) : (
          <p className="search-meta">Start typing to search across the site.</p>
        )}

        {error && <p className="search-error">{error}</p>}

        {status === 'success' && hasResults ? (
          <div className="search-results">
            {results.map((group) => (
              <div key={group.indexUid} className="search-group">
                <h2 className="search-group-title">{formatIndexTitle(group.indexUid)}</h2>
                {group.hits.map((hit, index) => (
                  <SearchCard key={`${group.indexUid}-${hit.id ?? hit.documentId ?? index}`} hit={hit} indexUid={group.indexUid} />
                ))}
              </div>
            ))}
          </div>
        ) : null}

        {status === 'success' && !hasResults ? (
          <p className="search-empty">No results found. Try another keyword.</p>
        ) : null}
      </div>
    </section>
  );
}
