"use client";

import { createElement, type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { BlocksRenderer, type BlocksContent } from '@strapi/blocks-react-renderer';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337';

const isExternalUrl = (url?: string | null) => !!url && /^https?:\/\//i.test(url);

const headingTagMap: Record<number, 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6'> = {
  1: 'h1',
  2: 'h2',
  3: 'h3',
  4: 'h4',
  5: 'h5',
  6: 'h6',
};

const blockOverrides = {
  paragraph: ({ children }: { children?: ReactNode }) => <p>{children}</p>,
  heading: ({ children, level = 2 }: { children?: ReactNode; level?: number }) => {
    const tag = headingTagMap[level] ?? 'h3';
    return createElement(tag, undefined, children);
  },
  list: ({ children, format = 'unordered' }: { children?: ReactNode; format?: 'ordered' | 'unordered' }) =>
    format === 'ordered' ? <ol>{children}</ol> : <ul>{children}</ul>,
  'list-item': ({ children }: { children?: ReactNode }) => <li>{children}</li>,
  link: ({ children, url }: { children?: ReactNode; url?: string }) => {
    if (!url) return <>{children}</>;
    return isExternalUrl(url) ? (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {children}
      </a>
    ) : (
      <Link href={url}>{children}</Link>
    );
  },
  image: ({ image }: { image?: { url?: string; alternativeText?: string | null; width?: number; height?: number } }) => {
    if (!image?.url) {
      return <div className="image-placeholder">Image unavailable</div>;
    }
    const src = image.url.startsWith('http') ? image.url : `${STRAPI_URL}${image.url}`;
    const width = image.width ?? 800;
    const height = image.height ?? 450;
    return (
      <div className="featured-image">
        <Image
          src={src}
          width={width}
          height={height}
          alt={image.alternativeText ?? ''}
          className="content-block-image"
          sizes="(max-width: 768px) 100vw, 800px"
        />
      </div>
    );
  },
  quote: ({ children }: { children?: ReactNode }) => <blockquote>{children}</blockquote>,
  code: ({ plainText }: { plainText?: string }) => <pre>{plainText}</pre>,
};

const modifierOverrides = {
  bold: ({ children }: { children?: ReactNode }) => <strong>{children}</strong>,
};

export default function RichTextArticle({ content }: { content: BlocksContent }) {
  return (
    <article className="content-body">
      <BlocksRenderer content={content} blocks={blockOverrides} modifiers={modifierOverrides} />
    </article>
  );
}
