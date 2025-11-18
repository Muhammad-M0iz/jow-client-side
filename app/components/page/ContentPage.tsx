import Link from 'next/link';
import { type BlocksContent } from '@strapi/blocks-react-renderer';
import GetInTouch from './GetInTouch';
import RichTextArticle from './RichTextArticle';
import './ContentPage.css';

const rtlLocales = ['ur', 'ar', 'fa'];
type LocaleKey = 'en' | 'ur';

const copy: Record<LocaleKey, {
  childPagesTitle: string;
  childDescriptionFallback: string;
  noContent: string;
  importantLinksTitle: string;
  quickLinksTitle: string;
}> = {
  en: {
    childPagesTitle: 'More from this section',
    childDescriptionFallback: 'Discover more information',
    noContent: 'Content will be available soon.',
    importantLinksTitle: 'Important Links',
    quickLinksTitle: 'Quick Links',
  },
  ur: {
    childPagesTitle: 'مزید صفحات',
    childDescriptionFallback: 'مزید معلومات کیلئے ملاحظہ کیجئے',
    noContent: 'مواد جلد دستیاب ہوگا۔',
    importantLinksTitle: 'اہم روابط',
    quickLinksTitle: 'فوری روابط',
  },
};

export type FeaturedImageData = {
  id?: number | string;
  url: string | null;
  alt?: string | null;
  caption?: string | null;
};

export type RichTextBlockData = {
  id: number | string;
  body: BlocksContent | string | null;
};

export type ContactWidgetData = {
  id: number | string;
  title?: string | null;
  contact_number?: string | null;
  email?: string | null;
  button_link?: string | null;
  button_label?: string | null;
  buttonLabel?: string | null;
};

export type ChildPageSummary = {
  id: number | string;
  title?: string | null;
  slug?: string | null;
  description?: string | null;
};

export type ImportantLinkItem = {
  id: number | string;
  label?: string | null;
  url?: string | null;
  isExternal?: boolean | null;
};

export type QuickLinkItem = {
  id: number | string;
  label?: string | null;
  href?: string | null;
  isExternal?: boolean | null;
};

export type ContentPageProps = {
  title?: string | null;
  locale?: string | null;
  featuredImage?: FeaturedImageData | null;
  richTextBlocks?: RichTextBlockData[];
  contactWidgets?: ContactWidgetData[];
  childPages?: ChildPageSummary[];
  importantLinks?: ImportantLinkItem[];
  quickLinks?: QuickLinkItem[];
  quickLinksTitle?: string | null;
};

const normalizeLocale = (value?: string | null): LocaleKey => {
  if (!value) return 'en';
  const lowered = value.toLowerCase();
  if (lowered.startsWith('ur')) return 'ur';
  return 'en';
};

const resolveDirection = (locale?: string | null) => {
  if (!locale) return 'ltr';
  return rtlLocales.some((candidate) => locale.toLowerCase().startsWith(candidate)) ? 'rtl' : 'ltr';
};

type TextInlineNode = { type: 'text'; text: string };
type ListItemNode = { type: 'list-item'; children: TextInlineNode[] };
type BlocksNode = BlocksContent[number];
type HeadingLevel = 1 | 2 | 3 | 4 | 5 | 6;

const clampHeadingLevel = (level: number): HeadingLevel =>
  Math.min(Math.max(Math.round(level) || 1, 1), 6) as HeadingLevel;

const createTextNode = (text: string): TextInlineNode => ({ type: 'text', text });

const createParagraphBlock = (text: string): BlocksNode => ({
  type: 'paragraph',
  children: [createTextNode(text)],
});

const createHeadingBlock = (text: string, level: number): BlocksNode => ({
  type: 'heading',
  level: clampHeadingLevel(level),
  children: [createTextNode(text)],
});

const createListBlock = (items: string[], ordered: boolean): BlocksNode => ({
  type: 'list',
  format: ordered ? 'ordered' : 'unordered',
  children: items.map<ListItemNode>((item) => ({
    type: 'list-item',
    children: [createTextNode(item)],
  })),
});

const markdownToBlocks = (value: string): BlocksContent => {
  const lines = value.split(/\r?\n/);
  const blocks: BlocksContent = [];
  let listBuffer: { ordered: boolean; items: string[] } | null = null;

  const flushList = () => {
    if (listBuffer && listBuffer.items.length) {
      blocks.push(createListBlock(listBuffer.items, listBuffer.ordered));
    }
    listBuffer = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      flushList();
      const level = Math.min(headingMatch[1].length, 6);
      blocks.push(createHeadingBlock(headingMatch[2].trim(), level));
      continue;
    }

    const orderedMatch = line.match(/^(\d+)[.)]\s+(.*)$/);
    if (orderedMatch) {
      if (!listBuffer || !listBuffer.ordered) {
        flushList();
        listBuffer = { ordered: true, items: [] };
      }
      listBuffer.items.push(orderedMatch[2].trim());
      continue;
    }

    if (/^[-*+]\s+/.test(line)) {
      if (!listBuffer || listBuffer.ordered) {
        flushList();
        listBuffer = { ordered: false, items: [] };
      }
      listBuffer.items.push(line.replace(/^[-*+]\s+/, '').trim());
      continue;
    }

    flushList();
    blocks.push(createParagraphBlock(line));
  }

  flushList();

  if (!blocks.length) {
    return [createParagraphBlock(value.trim())];
  }

  return blocks;
};

const parseBlocksContent = (body: BlocksContent | string | null): BlocksContent | null => {
  if (!body) return null;
  if (Array.isArray(body)) {
    return body as BlocksContent;
  }

  if (typeof body === 'object') {
    return body as BlocksContent;
  }

  if (typeof body === 'string') {
    const trimmed = body.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      try {
        const parsed = JSON.parse(trimmed);
        if (Array.isArray(parsed)) {
          return parsed as BlocksContent;
        }
      } catch {
        // fall through to markdown parsing
      }
    }

    return markdownToBlocks(trimmed);
  }

  return null;
};

const renderRichTextBlock = (block: RichTextBlockData, index: number) => {
  const blocksContent = parseBlocksContent(block.body);

  if (blocksContent) {
    return <RichTextArticle key={`rich-text-${block.id ?? index}`} content={blocksContent} />;
  }

  return null;
};

const ImportantLinksWidget = ({
  links,
  title,
}: {
  links: ImportantLinkItem[];
  title: string;
}) => (
  <div className="sidebar-widget">
    <h3 className="widget-title">{title}</h3>
    <ul className="widget-links">
      {links.map((link, index) => {
        const key = link.id ?? link.label ?? link.url ?? `link-${index}`;
        const isExternal = link.isExternal ?? /^https?:\/\//i.test(link.url ?? '');
        if (isExternal) {
          return (
            <li key={key}>
              <a href={link.url ?? '#'} target="_blank" rel="noopener noreferrer">
                {link.label ?? link.url}
              </a>
            </li>
          );
        }
        return (
          <li key={key}>
            {link.url ? (
              <Link href={link.url}>{link.label ?? link.url}</Link>
            ) : (
              <span>{link.label}</span>
            )}
          </li>
        );
      })}
    </ul>
  </div>
);

const QuickLinksWidget = ({
  links,
  title,
}: {
  links: QuickLinkItem[];
  title: string;
}) => (
  <div className="sidebar-widget">
    <h3 className="widget-title">{title}</h3>
    <ul className="widget-links">
      {links.map((link, index) => {
        const key = link.id ?? link.label ?? link.href ?? `quick-link-${index}`;
        const isExternal = link.isExternal ?? /^https?:\/\//i.test(link.href ?? '');
        if (isExternal) {
          return (
            <li key={key}>
              <a href={link.href ?? '#'} target="_blank" rel="noopener noreferrer">
                {link.label ?? link.href}
              </a>
            </li>
          );
        }

        if (link.href) {
          return (
            <li key={key}>
              <Link href={link.href}>{link.label ?? link.href}</Link>
            </li>
          );
        }

        return (
          <li key={key}>
            <span>{link.label}</span>
          </li>
        );
      })}
    </ul>
  </div>
);

export default function ContentPage({
  title,
  locale,
  featuredImage,
  richTextBlocks = [],
  contactWidgets = [],
  childPages = [],
  importantLinks = [],
  quickLinks = [],
  quickLinksTitle,
}: ContentPageProps) {
  const normalizedLocale = normalizeLocale(locale);
  const direction = resolveDirection(locale ?? normalizedLocale);
  const text = copy[normalizedLocale];
  const hasSidebar = contactWidgets.length > 0 || importantLinks.length > 0 || quickLinks.length > 0;

  return (
    <section className="content-page" dir={direction}>
      <header className="page-header">
        <div className="container">
          {title ? <h1 className="page-title">{title}</h1> : null}
        </div>
      </header>

      <div className={`container content-layout${hasSidebar ? '' : ' full'}`}>
        <main className="main-content">
          {featuredImage ? (
            <div className="featured-image">
              {featuredImage.url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={featuredImage.url} alt={featuredImage.alt ?? title ?? ''} loading="lazy" />
              ) : (
                <div className="image-placeholder">{featuredImage.caption ?? title ?? ''}</div>
              )}
            </div>
          ) : null}

          {richTextBlocks.length
            ? richTextBlocks.map((block, index) => renderRichTextBlock(block, index))
            : <p className="no-items">{text.noContent}</p>}

          {childPages.length ? (
            <section className="child-pages-section">
              <h2 className="child-pages-title">{text.childPagesTitle}</h2>
              <div className="child-pages-grid">
                {childPages.map((child, index) => {
                  const content = (
                    <>
                      <h3 className="child-page-title">{child.title ?? text.childDescriptionFallback}</h3>
                      {child.description ? <p className="child-page-description">{child.description}</p> : null}
                    </>
                  );

                  const key = child.id ?? child.slug ?? child.title ?? `child-${index}`;
                  if (child.slug) {
                    return (
                      <Link key={key} href={`/${child.slug}`} className="child-page-card">
                        {content}
                      </Link>
                    );
                  }

                  return (
                    <div key={key} className="child-page-card">
                      {content}
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}
        </main>

        {hasSidebar ? (
          <aside className="sidebar">
            {quickLinks.length ? (
              <QuickLinksWidget links={quickLinks} title={quickLinksTitle ?? text.quickLinksTitle} />
            ) : null}
            {importantLinks.length ? (
              <ImportantLinksWidget links={importantLinks} title={text.importantLinksTitle} />
            ) : null}
            {contactWidgets.map((widget) => (
              <GetInTouch
                key={widget.id ?? widget.title}
                title={widget.title}
                contact_number={widget.contact_number}
                email={widget.email}
                button_link={widget.button_link}
                button_label={widget.button_label}
                buttonLabel={widget.buttonLabel}
              />
            ))}
          </aside>
        ) : null}
      </div>
    </section>
  );
}
