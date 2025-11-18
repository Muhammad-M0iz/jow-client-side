import { NextResponse, type NextRequest } from 'next/server';

const DEFAULT_HOST = 'http://localhost:7700';
const INDEX_CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes

let cachedIndexes: string[] | null = null;
let lastCacheUpdate = 0;

const meiliHost = process.env.MEILISEARCH_HOST ?? DEFAULT_HOST;
const meiliPublicKey = process.env.MEILISEARCH_PUBLIC_KEY ?? process.env.MEILISEARCH_SEARCH_KEY ?? '';
const meiliMasterKey = process.env.MEILISEARCH_MASTER_KEY ?? process.env.MEILISEARCH_ADMIN_KEY ?? meiliPublicKey;

const searchHeaders: Record<string, string> = {
  'Content-Type': 'application/json',
};

const adminHeaders: Record<string, string> = {
  Accept: 'application/json',
};

if (meiliPublicKey) {
  searchHeaders['Authorization'] = `Bearer ${meiliPublicKey}`;
  searchHeaders['X-Meili-API-Key'] = meiliPublicKey;
}

if (meiliMasterKey) {
  adminHeaders['Authorization'] = `Bearer ${meiliMasterKey}`;
  adminHeaders['X-Meili-API-Key'] = meiliMasterKey;
}

async function fetchAvailableIndexes(): Promise<string[]> {
  if (cachedIndexes && Date.now() - lastCacheUpdate < INDEX_CACHE_TTL_MS) {
    return cachedIndexes;
  }

  try {
    const response = await fetch(`${meiliHost}/indexes`, { headers: adminHeaders });
    if (!response.ok) {
      console.error('Failed to fetch Meilisearch indexes', response.status, response.statusText);
      return cachedIndexes ?? [];
    }

    const payload = (await response.json()) as { results?: Array<{ uid?: string }>; [key: string]: unknown } | Array<{ uid?: string }>;
    const indexes: string[] = Array.isArray(payload)
      ? payload.map((entry) => entry.uid).filter((uid): uid is string => Boolean(uid))
      : (payload.results ?? [])
          .map((entry) => entry.uid)
          .filter((uid): uid is string => Boolean(uid));

    cachedIndexes = indexes;
    lastCacheUpdate = Date.now();
    return indexes;
  } catch (error) {
    console.error('Unable to retrieve Meilisearch indexes', error);
    return cachedIndexes ?? [];
  }
}

async function executeSearch(query: string, limit: number, offset: number) {
  const indexes = await fetchAvailableIndexes();
  if (!indexes.length) {
    return NextResponse.json(
      { error: 'No searchable indexes are available. Ensure Meilisearch is running and MEILISEARCH_MASTER_KEY has permission to list indexes.' },
      { status: 500 },
    );
  }

  const body = {
    queries: indexes.map((indexUid) => ({
      indexUid,
      q: query,
      limit,
      offset,
    })),
  };

  try {
    const response = await fetch(`${meiliHost}/multi-search`, {
      method: 'POST',
      headers: searchHeaders,
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const details = await response.text();
      console.error('Meilisearch multi-search request failed', response.status, details);
      return NextResponse.json(
        { error: 'Search request failed', details },
        { status: 502 },
      );
    }

    const payload = (await response.json()) as {
      results?: Array<{
        indexUid?: string;
        hits?: unknown[];
        limit?: number;
        offset?: number;
        estimatedTotalHits?: number;
        processingTimeMs?: number;
        query?: string;
      }>;
    };

    return NextResponse.json({
      query,
      limit,
      offset,
      host: meiliHost,
      results: (payload.results ?? []).map((entry) => ({
        indexUid: entry.indexUid ?? 'unknown',
        hits: entry.hits ?? [],
        offset: entry.offset ?? offset,
        limit: entry.limit ?? limit,
        estimatedTotalHits: entry.estimatedTotalHits ?? 0,
        processingTimeMs: entry.processingTimeMs ?? null,
      })),
    });
  } catch (error) {
    console.error('Unexpected Meilisearch error', error);
    return NextResponse.json({ error: 'Unexpected error while executing search' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const query = typeof body?.query === 'string' ? body.query.trim() : typeof body?.q === 'string' ? body.q.trim() : '';
  const limit = typeof body?.limit === 'number' && body.limit > 0 ? Math.min(body.limit, 50) : 20;
  const offset = typeof body?.offset === 'number' && body.offset >= 0 ? body.offset : 0;

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  return executeSearch(query, limit, offset);
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() ?? '';
  const limit = Number(searchParams.get('limit')) || 20;
  const offset = Number(searchParams.get('offset')) || 0;

  if (!query) {
    return NextResponse.json({ error: 'Query is required' }, { status: 400 });
  }

  return executeSearch(query, Math.min(Math.max(limit, 1), 50), Math.max(offset, 0));
}
