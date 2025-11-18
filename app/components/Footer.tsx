import Link from 'next/link';
import './Footer.css';

export type FooterContact = {
  number?: string | null;
  email?: string | null;
  location?: string | null;
};

export type FooterLink = {
  id: number | string;
  label?: string | null;
  href?: string | null;
  isExternal?: boolean | null;
};

export type FooterLinkGroup = {
  id: number | string;
  title?: string | null;
  items: FooterLink[];
};

export type FooterContent = {
  title?: string | null;
  subtitle?: string | null;
  contact?: FooterContact | null;
  quickLinks: FooterLinkGroup[];
  importantLinks: FooterLinkGroup[];
  copyright?: string | null;
};

const rtlLocales = ['ur', 'ar', 'fa'];
const normalizeLocale = (locale?: string) => {
  if (!locale) return 'en';
  return locale.toLowerCase().startsWith('ur') ? 'ur' : 'en';
};

export function Footer({ data, locale }: { data: FooterContent | null; locale: string }) {
  if (!data) {
    return null;
  }

  const normalizedLocale = normalizeLocale(locale);
  const dir = rtlLocales.includes(normalizedLocale) ? 'rtl' : 'ltr';
  const quickLinkGroups = Array.isArray(data.quickLinks) ? data.quickLinks : [];
  const importantLinkGroups = Array.isArray(data.importantLinks) ? data.importantLinks : [];

  const renderLink = (link: FooterLink, fallbackKey: string) => {
    const key = link.id ?? fallbackKey;
    const label = link.label ?? link.href ?? '';
    if (!label) {
      return null;
    }

    const href = link.href ?? undefined;
    const isExternal = link.isExternal ?? (href ? /^(https?:\/\/|mailto:|tel:)/i.test(href) : false);

    if (!href) {
      return (
        <li key={key}>
          <span>{label}</span>
        </li>
      );
    }

    if (isExternal) {
      return (
        <li key={key}>
          <a href={href} target="_blank" rel="noopener noreferrer">
            {label}
          </a>
        </li>
      );
    }

    return (
      <li key={key}>
        <Link href={href}>{label}</Link>
      </li>
    );
  };

  return (
    <footer className="site-footer" dir={dir}>
      <div className="container">
        <div className="footer-content">
          <div className="footer-section primary-info">
            {data.title ? <h3>{data.title}</h3> : null}
            {data.subtitle ? <p className="footer-description">{data.subtitle}</p> : null}
          </div>

          {quickLinkGroups.map((group, groupIndex) => (
            <div key={group.id ?? `quick-group-${groupIndex}`} className="footer-section">
              {group.title ? <h4>{group.title}</h4> : null}
              <ul className="footer-links">
                {(group.items ?? []).map((link, index) =>
                  renderLink(link, `quick-link-${groupIndex}-${index}`),
                )}
              </ul>
            </div>
          ))}

          {data.contact ? (
            <div className="footer-section">
              <h4>{normalizedLocale === 'ur' ? 'رابطہ' : 'Contact'}</h4>
              <ul className="footer-contact">
                {data.contact.number ? <li>📞 {data.contact.number}</li> : null}
                {data.contact.email ? <li>📧 {data.contact.email}</li> : null}
                {data.contact.location ? <li>📍 {data.contact.location}</li> : null}
              </ul>
            </div>
          ) : null}

          {importantLinkGroups.map((group, groupIndex) => (
            <div key={group.id ?? `important-group-${groupIndex}`} className="footer-section">
              {group.title ? <h4>{group.title}</h4> : null}
              <ul className="footer-links">
                {(group.items ?? []).map((link, index) =>
                  renderLink(link, `important-link-${groupIndex}-${index}`),
                )}
              </ul>
            </div>
          ))}
        </div>

        <div className="footer-bottom">
          <p>{data.copyright ?? (normalizedLocale === 'ur' ? 'تمام حقوق محفوظ ہیں' : 'All rights reserved.')}</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
