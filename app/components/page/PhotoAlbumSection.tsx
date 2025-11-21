'use client';

import { type MouseEvent as ReactMouseEvent, useEffect, useMemo, useState } from 'react';
import './PhotoAlbumSection.css';

export type PhotoMediaItem = {
  id: number | string;
  url: string;
  alt?: string | null;
  caption?: string | null;
};

export type PhotoAlbumData = {
  id: number | string;
  title?: string | null;
  description?: string | null;
  slug?: string | null;
  photos: PhotoMediaItem[];
};

export type PhotoAlbumSectionData = {
  id: number | string;
  title?: string | null;
  albums: PhotoAlbumData[];
};

type LightboxState = {
  photo: PhotoMediaItem;
  albumTitle?: string | null;
  albumDescription?: string | null;
};

type PhotoAlbumSectionProps = {
  section: PhotoAlbumSectionData;
  direction?: 'ltr' | 'rtl';
};

const sanitizeAlbums = (albums: PhotoAlbumData[]) =>
  albums
    .map((album) => ({
      ...album,
      photos: album.photos.filter((photo) => Boolean(photo?.url)),
    }))
    .filter((album) => album.photos.length);

export default function PhotoAlbumSection({ section, direction = 'ltr' }: PhotoAlbumSectionProps) {
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);
  const albums = useMemo(() => sanitizeAlbums(section.albums ?? []), [section.albums]);

  useEffect(() => {
    if (!lightbox) return undefined;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setLightbox(null);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [lightbox]);

  if (!albums.length) {
    return null;
  }

  const handleOverlayClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target === event.currentTarget) {
      setLightbox(null);
    }
  };

  return (
    <section className="photo-album-section" dir={direction}>
      {section.title ? <h2 className="photo-album-section__title">{section.title}</h2> : null}

      {albums.map((album) => (
        <article key={album.id} className="photo-album">
          <header className="photo-album__header">
            {album.title ? <h3 className="photo-album__title">{album.title}</h3> : null}
            {album.description ? <p className="photo-album__description">{album.description}</p> : null}
          </header>

          <div className="photo-grid">
            {album.photos.map((photo) => (
              <button
                type="button"
                key={photo.id}
                className="photo-grid__item"
                onClick={() => setLightbox({ photo, albumTitle: album.title, albumDescription: album.description })}
                aria-label={photo.caption ?? photo.alt ?? album.title ?? 'View photo'}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt={photo.alt ?? photo.caption ?? album.title ?? 'Photo'} loading="lazy" />
              </button>
            ))}
          </div>
        </article>
      ))}

      {lightbox ? (
        <div className="photo-lightbox" role="dialog" aria-modal="true" aria-label="Expanded photo view" onClick={handleOverlayClick}>
          <div className="photo-lightbox__content">
            <button type="button" className="photo-lightbox__close" aria-label="Close" onClick={() => setLightbox(null)}>
              ×
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="photo-lightbox__image" src={lightbox.photo.url} alt={lightbox.photo.alt ?? lightbox.photo.caption ?? lightbox.albumTitle ?? 'Photo'} />
            <div className="photo-lightbox__meta">
              {lightbox.albumTitle ? <h4>{lightbox.albumTitle}</h4> : null}
              {lightbox.photo.caption ? <p>{lightbox.photo.caption}</p> : null}
              {!lightbox.photo.caption && lightbox.albumDescription ? <p>{lightbox.albumDescription}</p> : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
