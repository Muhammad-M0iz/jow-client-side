'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

export type SearchHit = Record<string, unknown> & {
  id?: number | string;
  documentId?: string;
  title?: string;
  slug?: string;
};

export type SearchResultBlock = {
  indexUid: string;
  hits: SearchHit[];
  estimatedTotalHits: number;
  limit: number;
  offset: number;
  processingTimeMs: number | null;
};

export type SearchResponse = {
  query: string;
  limit: number;
  offset: number;
  results: SearchResultBlock[];
};

export type UseSearchOptions = {
  debounceMs?: number;
  initialQuery?: string;
};

export function useSearch({ debounceMs = 400, initialQuery = '' }: UseSearchOptions = {}) {
  const [query, setQuery] = useState(initialQuery);
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResultBlock[]>([]);
  const [activeQuery, setActiveQuery] = useState(initialQuery.trim());
  const abortRef = useRef<AbortController | null>(null);

  const executeSearch = useCallback(
    async (term: string) => {
      const trimmed = term.trim();
      if (!trimmed) {
        abortRef.current?.abort();
        setResults([]);
        setStatus('idle');
        setActiveQuery('');
        setError(null);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setStatus('loading');
      setError(null);

      try {
        const response = await fetch('/api/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ query: trimmed }),
          signal: controller.signal,
        });

        if (!response.ok) {
          const payload = (await response.json().catch(() => ({}))) as { error?: string };
          throw new Error(payload.error ?? 'Search failed');
        }

        const data = (await response.json()) as SearchResponse;
        const filtered = (data.results ?? []).filter((group) => Array.isArray(group.hits) && group.hits.length > 0);
        setResults(filtered);
        setActiveQuery(data.query ?? trimmed);
        setStatus('success');
      } catch (err) {
        if ((err as Error).name === 'AbortError') {
          return;
        }
        console.error('Search error', err);
        setError((err as Error).message ?? 'Search failed');
        setStatus('error');
      }
    },
    [],
  );

  useEffect(() => {
    setQuery(initialQuery);
    setActiveQuery(initialQuery.trim());
    if (initialQuery.trim()) {
      executeSearch(initialQuery);
    }
  }, [initialQuery, executeSearch]);

  useEffect(() => {
    const handler = window.setTimeout(() => {
      executeSearch(query);
    }, debounceMs);

    return () => {
      window.clearTimeout(handler);
    };
  }, [debounceMs, executeSearch, query]);

  const hasResults = useMemo(() => results.length > 0, [results]);

  return {
    query,
    setQuery,
    results,
    status,
    error,
    activeQuery,
    hasResults,
    runSearch: executeSearch,
  };
}
