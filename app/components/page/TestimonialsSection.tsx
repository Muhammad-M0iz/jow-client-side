'use client';

import './TestimonialsSection.css';

export type TestimonialItem = {
  id: number | string;
  author?: string | null;
  designation?: string | null;
  body?: string | null;
  photoUrl?: string | null;
  photoAlt?: string | null;
};

export type TestimonialsSectionData = {
  id: number | string;
  title?: string | null;
  testimonials: TestimonialItem[];
};

type TestimonialsSectionProps = {
  section: TestimonialsSectionData;
  direction?: 'ltr' | 'rtl';
};

export default function TestimonialsSection({ section, direction = 'ltr' }: TestimonialsSectionProps) {
  if (!section.testimonials.length) {
    return null;
  }

  return (
    <section className="testimonials-section" dir={direction}>
      {section.title ? <h2 className="testimonials-section__title">{section.title}</h2> : null}
      <div className="grid-items">
        {section.testimonials.map((testimonial) => (
          <article key={testimonial.id} className="grid-item-card testimonial-card">
            {testimonial.photoUrl ? (
              <div className="grid-item-image testimonial-card__image">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={testimonial.photoUrl} alt={testimonial.photoAlt ?? testimonial.author ?? 'Testimonial'} />
              </div>
            ) : null}
            <div className="grid-item-body">
              <h3 className="grid-item-title">{testimonial.author ?? 'Anonymous'}</h3>
              {testimonial.designation ? <p className="grid-item-meta">{testimonial.designation}</p> : null}
              {testimonial.body ? <p className="testimonial-card__body">{testimonial.body}</p> : null}
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
