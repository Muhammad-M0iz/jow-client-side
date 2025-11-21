import { BlocksRenderer, type BlocksContent } from '@strapi/blocks-react-renderer';
import styles from './NewsDetailSection.module.css';

export type NewsDetailArticle = {
  id: string | number;
  title?: string | null;
  slug?: string | null;
  category?: string | null;
  date?: string | null;
  coverImage?: {
    url: string | null;
    alt?: string | null;
  } | null;
  body?: BlocksContent | string | null;
};

const formatDate = (value?: string | null, locale?: string | null) => {
  if (!value) return '';
  try {
    return new Intl.DateTimeFormat(locale ?? 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }).format(new Date(value));
  } catch {
    return value ?? '';
  }
};

const renderCoverImage = (article: NewsDetailArticle) => {
  if (!article.coverImage?.url) {
    return null;
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={article.coverImage.url}
      alt={article.coverImage.alt ?? article.title ?? ''}
      className={styles.coverImage}
      loading="lazy"
    />
  );
};

export default function NewsDetailSection({
  title,
  articles,
  locale,
}: {
  title?: string | null;
  articles: NewsDetailArticle[];
  locale?: string | null;
}) {
  if (!articles.length) {
    return null;
  }

  return (
    <section className={styles.newsDetailSection}>
      {title ? <h2 className={styles.sectionTitle}>{title}</h2> : null}
      <div className={styles.articleStack}>
        {articles.map((article, index) => (
          <article key={article.id} className={styles.article}>
            <header className={styles.articleHeader}>
              <div className={styles.metaRow}>
                {article.category ? <span className={styles.category}>{article.category}</span> : null}
                {article.date ? <span className={styles.date}>{formatDate(article.date, locale)}</span> : null}
              </div>
              <h3 className={styles.newsHeading}>{article.title}</h3>
            </header>
            {renderCoverImage(article)}
            {article.body ? (
              <div className={styles.newsBody}>
                <BlocksRenderer content={article.body as BlocksContent} />
              </div>
            ) : null}
            {index < articles.length - 1 ? <div className={styles.divider} /> : null}
          </article>
        ))}
      </div>
    </section>
  );
}
