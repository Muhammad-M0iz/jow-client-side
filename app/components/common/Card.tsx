import Link from 'next/link';
import { ReactNode } from 'react';
import styles from './Card.module.css';

type TextDirection = 'ltr' | 'rtl';

export interface CardProps {
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  imageAlt?: string;
  link?: string | null;
  date?: string;
  icon?: ReactNode;
  direction?: TextDirection;
  locale?: string;
  className?: string;
}

const resolveDirection = (direction?: TextDirection, locale?: string): TextDirection => {
  if (direction) {
    return direction;
  }

  if (locale) {
    const normalized = locale.toLowerCase();
    if (normalized.startsWith('ur') || normalized.startsWith('ar') || normalized.startsWith('fa')) {
      return 'rtl';
    }
  }

  return 'ltr';
};

function CardContent({
  title,
  description,
  imageUrl,
  imageAlt,
  date,
  icon,
}: Pick<CardProps, 'title' | 'description' | 'imageUrl' | 'imageAlt' | 'date' | 'icon'>) {
  return (
    <>
      {imageUrl ? (
        <div className={styles.cardImage}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={imageUrl} alt={imageAlt || title} loading="lazy" />
        </div>
      ) : icon ? (
        <div className={styles.cardIcon}>{icon}</div>
      ) : (
        <div className={styles.cardImagePlaceholder}>📷</div>
      )}
      <div className={styles.cardBody}>
        {date ? <div className={styles.cardDate}>{date}</div> : null}
        <h3 className={styles.cardTitle}>{title}</h3>
        {description ? <p className={styles.cardDescription}>{description}</p> : null}
      </div>
    </>
  );
}

export function Card({
  title,
  description,
  imageUrl,
  imageAlt,
  link,
  date,
  icon,
  direction,
  locale,
  className,
}: CardProps) {
  const resolvedDirection = resolveDirection(direction, locale);
  const dirClass = resolvedDirection === 'rtl' ? styles.rtl : styles.ltr;
  const combinedClassName = `${styles.card} ${dirClass}${className ? ` ${className}` : ''}`;

  const content = (
    <CardContent
      title={title}
      description={description}
      imageUrl={imageUrl}
      imageAlt={imageAlt}
      date={date}
      icon={icon}
    />
  );

  if (!link) {
    return (
      <div className={combinedClassName} dir={resolvedDirection}>
        {content}
      </div>
    );
  }

  const isExternal = /^https?:\/\//i.test(link);

  return isExternal ? (
    <a
      href={link}
      target="_blank"
      rel="noopener noreferrer"
      className={combinedClassName}
      dir={resolvedDirection}
    >
      {content}
    </a>
  ) : (
    <Link href={link} className={combinedClassName} dir={resolvedDirection}>
      {content}
    </Link>
  );
}

export default Card;
