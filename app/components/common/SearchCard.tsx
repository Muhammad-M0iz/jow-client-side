import Link from 'next/link';
import type { SearchHit } from '@/app/hooks/useSearch';
import './SearchCard.css';

const indexLabels: Record<string, string> = {
  'news-article': 'News Article',
  page: 'Page',
  event: 'Event',
  department: 'Department',
  program: 'Program',
  announcement: 'Announcement',
  'faculty-member': 'Faculty Member',
  testimonial: 'Testimonial',
  'photo-album': 'Photo Album',
  video: 'Video',
  download: 'Download',
};

const pickSnippet = (hit: SearchHit) => {
  if (typeof hit.summary === 'string' && hit.summary.trim()) {
    return hit.summary.trim();
  }

  if (typeof hit.description === 'string' && hit.description.trim()) {
    return hit.description.trim();
  }

  if (typeof hit.body === 'string' && hit.body.trim()) {
    return hit.body.trim();
  }

  if (Array.isArray(hit.body)) {
    for (const block of hit.body as Array<{ children?: Array<{ text?: string }> }>) {
      if (!block?.children) continue;
      const text = block.children.map((child) => child.text ?? '').join(' ').trim();
      if (text) {
        return text;
      }
    }
  }

  if (typeof hit.content === 'string') {
    return hit.content;
  }

  return '';
};

const ensurePath = (value?: unknown) => {
  if (typeof value !== 'string' || !value.trim()) {
    return null;
  }
  if (value.startsWith('http://') || value.startsWith('https://')) {
    return value;
  }
  if (value.startsWith('/')) {
    return value;
  }
  return `/${value}`;
};

export type SearchCardProps = {
  hit: SearchHit;
  indexUid: string;
};

export function SearchCard({ hit, indexUid }: SearchCardProps) {
  const title = (hit.title as string) ?? (hit.name as string) ?? 'Untitled';
  const snippet = pickSnippet(hit);
  // Prefer the generated link from MeiliSearch transformEntry, then fall back to slug/url
  const href = ensurePath(hit.link ?? hit.slug ?? hit.url);
  const label = indexLabels[indexUid] ?? indexUid.replace(/[-_]/g, ' ');

  const content = (
    <article className="search-card">
      <header>
        <p className="search-card-index">{label}</p>
        <h3 className="search-card-title">{title}</h3>
      </header>
      {snippet ? <p className="search-card-snippet">{snippet}</p> : null}
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="search-card-link">
        {content}
      </Link>
    );
  }

  return <div className="search-card-link">{content}</div>;
}

export default SearchCard;
