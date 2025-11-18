"use client";

import Link from "next/link"
import './ContentPage.css';

type GetInTouchProps = {
  title?: string | null;
  contact_number?: string | null;
  email?: string | null;
  button_link?: string | null;
  button_label?: string | null;
  buttonLabel?: string | null;
};

function GetInTouch({ title, contact_number, email, button_link, button_label, buttonLabel }: GetInTouchProps) {
  const resolvedLabel = button_label ?? buttonLabel ?? title ?? 'Contact';
  return (
    <div className="sidebar-widget contact-widget">
      {title ? <h3 className="widget-title">{title}</h3> : null}
      <div className="contact-info">
        {contact_number ? (
          <div className="contact-item">
            <span className="contact-icon">📞</span>
            <span>{contact_number}</span>
          </div>
        ) : null}
        {email ? (
          <div className="contact-item">
            <span className="contact-icon">📧</span>
            <span>{email}</span>
          </div>
        ) : null}
      </div>
      {button_link ? (
        <Link href={button_link} className="contact-button">
          {resolvedLabel}
        </Link>
      ) : null}
    </div>
  )
}

export default GetInTouch