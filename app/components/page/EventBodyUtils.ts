import type { BlocksContent } from '@strapi/blocks-react-renderer';

const collectPlainText = (node: unknown): string => {
  if (!node || typeof node !== 'object') {
    return '';
  }

  if ('text' in (node as { text?: unknown }) && typeof (node as { text?: unknown }).text === 'string') {
    return (node as { text?: string }).text ?? '';
  }

  if ('children' in (node as { children?: unknown }) && Array.isArray((node as { children?: unknown }).children)) {
    return ((node as { children?: unknown[] }).children ?? []).map(collectPlainText).join(' ');
  }

  return '';
};

export const serializeEventBody = (body: BlocksContent | string | null | undefined): string => {
  if (!body) return '';
  if (typeof body === 'string') {
    return body;
  }
  if (Array.isArray(body)) {
    return body.map((node) => collectPlainText(node)).join(' ');
  }
  if (typeof body === 'object') {
    return collectPlainText(body);
  }
  return '';
};

export const truncateText = (value: string, max = 200) => {
  if (!value) return '';
  if (value.length <= max) {
    return value;
  }
  return `${value.slice(0, max).trimEnd()}…`;
};
