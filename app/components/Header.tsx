'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import './Header.css';
import { useLanguage } from '../context/LanguageContext';

export interface MenuItem {
  id: number;
  title: string;
  order: number;
  url: string | null;
  showInNav?: boolean;
  children: MenuItem[];
}

const CTA_TITLES = new Set(['Admissions', 'Search']);
const CTA_EXCLUDED_FROM_NAV = new Set(['Search']);

const FALLBACK_CTAS: MenuItem[] = [
  { id: -1, title: 'Search', order: 0, url: '/search', children: [] },
  { id: -2, title: 'Admissions', order: 1, url: '/admissions', children: [] },
];

const actionButtonClass = (title: string) =>
  title.toLowerCase().includes('admission') ? 'admission-btn' : 'search-btn';

const linkHref = (value: string | null) => value || '#';

export function Header({ menuItems, fetchError }: { menuItems: MenuItem[]; fetchError?: string }) {
  const [activeDropdown, setActiveDropdown] = useState<number | null>(null);
  const [moreDropdownOpen, setMoreDropdownOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const { locale, switchLanguage } = useLanguage();
  const navPrimaryLimit = locale === 'en' ? 5 : 6;
  const toggleLanguage = () => {
    const newLang = locale === 'en' ? 'ur' : 'en';
    switchLanguage(newLang);
  };

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const scrollY = window.scrollY;
          if (scrollY > 80 && !isScrolled) {
            setIsScrolled(true);
          } else if (scrollY < 40 && isScrolled) {
            setIsScrolled(false);
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isScrolled]);

  const { ctaItems, mainNavItems, overflowNavItems } = useMemo(() => {
    if (!menuItems?.length) {
      return { ctaItems: [], mainNavItems: [], overflowNavItems: [] };
    }

    const ctas = menuItems.filter((item) => CTA_TITLES.has(item.title));
    const navigable = menuItems
      .filter((item) => !CTA_EXCLUDED_FROM_NAV.has(item.title))
      .sort((a, b) => a.order - b.order);

    const prioritized: MenuItem[] = [];
    const overflow: MenuItem[] = [];

    navigable.forEach((item) => {
      // Use dynamic navPrimaryLimit here
      const prefersPrimary = item.showInNav !== false && prioritized.length < navPrimaryLimit;
      if (prefersPrimary) {
        prioritized.push(item);
      } else {
        overflow.push(item);
      }
    });

    return {
      ctaItems: ctas,
      mainNavItems: prioritized,
      overflowNavItems: overflow,
    };
  }, [menuItems, navPrimaryLimit]); // Added navPrimaryLimit to dependencies

  const hasMenuItems = mainNavItems.length > 0 || overflowNavItems.length > 0;

  const renderDropdownMenu = (items: MenuItem[]) => (
    <ul className="dropdown-menu">
      {items.map((child) => {
        const hasSubmenu = child.children && child.children.length > 0;
        const dropdownClass = `dropdown-item ${hasSubmenu ? 'has-submenu' : ''}`;
        return (
          <li key={child.id} className={dropdownClass}>
            <Link
              href={linkHref(child.url)}
              className={`dropdown-link${child.url ? '' : ' is-disabled'}`}
              aria-disabled={!child.url}
            >
              <span className="nav-title">{child.title}</span>
            </Link>
            {hasSubmenu ? (
              <ul className="submenu">
                {child.children.map((subItem) => (
                  <li key={subItem.id} className="submenu-item">
                    <Link
                      href={linkHref(subItem.url)}
                      className={`submenu-link${subItem.url ? '' : ' is-disabled'}`}
                      aria-disabled={!subItem.url}
                    >
                      <span className="nav-title">{subItem.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            ) : null}
          </li>
        );
      })}
    </ul>
  );

  const renderNavItem = (item: MenuItem) => {
    const hasChildren = item.children && item.children.length > 0;
    const navItemClass = [
      'nav-item',
      hasChildren ? 'has-dropdown' : '',
      activeDropdown === item.id ? 'active' : '',
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <li
        key={item.id}
        className={navItemClass}
        onMouseEnter={() => hasChildren && setActiveDropdown(item.id)}
        onMouseLeave={() => hasChildren && setActiveDropdown(null)}
      >
        <Link
          href={linkHref(item.url)}
          className={`nav-link${item.url ? '' : ' is-disabled'}`}
          aria-disabled={!item.url}
        >
          <span className="nav-title">{item.title}</span>
        </Link>
        {hasChildren ? renderDropdownMenu(item.children) : null}
      </li>
    );
  };

  const renderOverflow = () => {
    if (!overflowNavItems.length) {
      return null;
    }

    const moreClasses = ['nav-item', 'has-dropdown', moreDropdownOpen ? 'active' : '']
      .filter(Boolean)
      .join(' ');

    return (
      <li
        className={moreClasses}
        onMouseEnter={() => setMoreDropdownOpen(true)}
        onMouseLeave={() => setMoreDropdownOpen(false)}
      >
        <span className="nav-link">
          <span className="nav-title">{locale === 'en' ? 'More' : 'مزید'}</span>
        </span>
        {renderDropdownMenu(overflowNavItems)}
      </li>
    );
  };

  const actionItems = useMemo(() => {
    const items = ctaItems.length ? [...ctaItems] : [...FALLBACK_CTAS];
    if (!items.some((item) => item.title === 'Search')) {
      items.unshift({ id: -1, title: 'Search', order: 0, url: '/search', children: [] });
    }
    return items;
  }, [ctaItems]);

  return (
    <header className={`header ${isScrolled ? 'scrolled' : ''}`}>
      <div className="top-bar">
        <div className="container">
          <div className="top-bar-content">
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
               <button 
                 onClick={toggleLanguage}
                 className="text-white text-sm font-bold px-3 py-1 border border-white/30 rounded hover:bg-white/10 transition"
               >
                 {locale === 'en' ? 'اردو' : 'English'}
               </button>
            </div>
            <div className="contact-info">
              <a href="tel:+923001234567" className="contact-item">
                <span className="contact-icon">📞</span>
                <span className="contact-text">+92-300-1234567</span>
              </a>
              <a href="mailto:info@jamiaurwatulwusqa.com" className="contact-item">
                <span className="contact-icon">✉️</span>
                <span className="contact-text">info@jamiaurwatulwusqa.com</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      <nav className="main-navigation">
        <div className="container">
          <div className="nav-container">
            <Link href="/" className="logo-section">
              <div className="logo">
                <div className="logo-placeholder">JUW</div>
              </div>
              <div className="site-title">
                <h1>Jamia Urwatul Wusqa</h1>
              </div>
            </Link>

            {hasMenuItems ? (
              <ul className="nav-list">
                {mainNavItems.map(renderNavItem)}
                {renderOverflow()}
              </ul>
            ) : (
              <p>Navigation will appear once it loads.</p>
            )}

            <div className="header-actions">
              {actionItems.map((item) => (
                <Link
                  key={`cta-${item.id}`}
                  href={linkHref(item.url)}
                  className={`${actionButtonClass(item.title)}${item.url ? '' : ' is-disabled'}`}
                  aria-disabled={!item.url}
                >
                  {item.title}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </nav>

      {fetchError && (
        <div className="bg-amber-50 px-4 py-2 text-sm text-amber-800">
          {fetchError}
        </div>
      )}
    </header>
  );
}