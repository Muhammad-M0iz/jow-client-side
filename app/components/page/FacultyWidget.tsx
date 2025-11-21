import React from 'react';
import './FacultyWidget.css';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL ?? 'http://localhost:1337';

export type FacultyMember = {
  id: number | string;
  name?: string | null;
  designation?: string | null;
  subtitle?: string | null;
  photo?: { url?: string | null } | null;
  departments?: Array<{ id?: number; name?: string | null }>;
  profileUrl?: string | null;
};

export type FacultyWidgetProps = {
  title?: string | null;
  subtitle?: string | null;
  members?: FacultyMember[];
  locale?: 'en' | 'ur';
};

const resolvePhotoUrl = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  return `${STRAPI_URL}${url}`;
};

export default function FacultyWidget({ title, members = [], locale = 'en' }: FacultyWidgetProps) {
  return (
    <section className="faculty-widget" aria-label={title ?? 'Faculty'} dir={locale === 'ur' ? 'rtl' : 'ltr'}>

      <div className="grid-items">
        {members.map((m) => {
          const photo = resolvePhotoUrl(m.photo?.url ?? null);
          const deptNames = (m.departments ?? []).map((d) => d.name).filter(Boolean) as string[];
          return (
            <article className="grid-item-card" key={m.id}>
              {photo ? (
                <div className="grid-item-image">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={photo} alt={m.name ?? 'Faculty photo'} />
                </div>
              ) : (
                <div className="grid-item-image">
                  <div className="image-placeholder">{m.name ?? '—'}</div>
                </div>
              )}

              <div className="grid-item-body">
                <h3 className="grid-item-title">
                  <button type="button" className="faculty-card__name-btn">{m.name ?? '—'}</button>
                </h3>

                {m.designation && <p className="grid-item-meta">{m.designation}</p>}

                {deptNames.length > 0 && (
                  <p className="grid-item-meta">
                    <strong>شعبہ:</strong> {deptNames.join(', ')}
                  </p>
                )}

                {m.subtitle && <p className="grid-item-description">{m.subtitle}</p>}
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
