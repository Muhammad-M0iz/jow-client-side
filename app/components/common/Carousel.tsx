"use client";
import { useEffect, useMemo, useState } from 'react';
import styles from './Carousel.module.css';

type TextDirection = 'ltr' | 'rtl';

export interface CarouselItem {
  id: string | number;
  title: string;
  description?: string | null;
  imageUrl?: string | null;
  imageAlt?: string;
}

export interface CarouselProps {
  items?: CarouselItem[] | null;
  autoplay?: boolean;
  interval?: number;
  showIndicators?: boolean;
  direction?: TextDirection;
  locale?: string;
  emptyStateText?: string;
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

const defaultEmptyState = (direction: TextDirection) =>
  direction === 'rtl' ? 'کوئی مواد دستیاب نہیں' : 'No items to display';

export function Carousel({
  items,
  autoplay = true,
  interval = 5000,
  showIndicators = true,
  direction,
  locale,
  emptyStateText,
}: CarouselProps) {
  const filteredItems = useMemo(() => (items?.filter(Boolean) as CarouselItem[]) || [], [items]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const resolvedDirection = resolveDirection(direction, locale);
  const wrapperClass = `${styles.carousel} ${
    resolvedDirection === 'rtl' ? styles.rtl : styles.ltr
  }`;

  useEffect(() => {
    setCurrentIndex(0);
  }, [filteredItems.length]);

  useEffect(() => {
    if (!autoplay || filteredItems.length < 2) {
      return undefined;
    }

    const timer = window.setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % filteredItems.length);
    }, Math.max(2000, interval));

    return () => window.clearInterval(timer);
  }, [autoplay, interval, filteredItems.length]);

  const goToSlide = (index: number) => {
    setCurrentIndex(index);
  };

  const goToPrevious = () => {
    setCurrentIndex((prev) =>
      prev === 0 ? filteredItems.length - 1 : (prev - 1 + filteredItems.length) % filteredItems.length,
    );
  };

  const goToNext = () => {
    setCurrentIndex((prev) => (prev + 1) % filteredItems.length);
  };

  if (!filteredItems.length) {
    return (
      <div className={`${styles.emptyState} ${resolvedDirection === 'rtl' ? styles.rtl : styles.ltr}`}>
        {emptyStateText || defaultEmptyState(resolvedDirection)}
      </div>
    );
  }

  const prevControlClass = `${styles.control} ${
    resolvedDirection === 'rtl' ? styles.controlPrevRtl : styles.controlPrev
  }`;
  const nextControlClass = `${styles.control} ${
    resolvedDirection === 'rtl' ? styles.controlNextRtl : styles.controlNext
  }`;

  return (
    <section className={wrapperClass} aria-roledescription="carousel">
      <div className={styles.inner}>
        {filteredItems.map((item, index) => (
          <div
            key={item.id}
            className={`${styles.slide} ${index === currentIndex ? styles.slideActive : ''}`}
            aria-hidden={index === currentIndex ? 'false' : 'true'}
          >
            <div className={styles.imageContainer}>
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.imageUrl}
                  alt={item.imageAlt || item.title}
                  className={styles.image}
                  loading={index === currentIndex ? 'eager' : 'lazy'}
                />
              ) : (
                <div className={styles.imagePlaceholder}>{item.title}</div>
              )}
            </div>
            {(item.title || item.description) && (
              <div className={styles.caption}>
                {item.title ? <h2>{item.title}</h2> : null}
                {item.description ? <p>{item.description}</p> : null}
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredItems.length > 1 && (
        <>
          <button
            type="button"
            className={prevControlClass}
            onClick={goToPrevious}
            aria-label={resolvedDirection === 'rtl' ? 'اگلا سلائیڈ' : 'Previous slide'}
          >
            {resolvedDirection === 'rtl' ? '›' : '‹'}
          </button>
          <button
            type="button"
            className={nextControlClass}
            onClick={goToNext}
            aria-label={resolvedDirection === 'rtl' ? 'پچھلا سلائیڈ' : 'Next slide'}
          >
            {resolvedDirection === 'rtl' ? '‹' : '›'}
          </button>
        </>
      )}

      {showIndicators && filteredItems.length > 1 ? (
        <div className={styles.indicators} role="tablist" aria-label="Carousel indicators">
          {filteredItems.map((item, index) => (
            <button
              key={`indicator-${item.id}`}
              type="button"
              className={`${styles.indicator} ${index === currentIndex ? styles.indicatorActive : ''}`}
              onClick={() => goToSlide(index)}
              aria-label={`Go to slide ${index + 1}`}
              aria-current={index === currentIndex}
            />
          ))}
        </div>
      ) : null}
    </section>
  );
}

export default Carousel;
