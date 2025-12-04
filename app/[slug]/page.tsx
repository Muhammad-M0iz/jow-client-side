import type { Metadata } from 'next';
import ContentPage from '../components/page/ContentPage';
import { getServerLocale } from '../lib/get-locale';
import { mapContentPage, buildContentPageMetadata } from '../lib/mappers/page-mappers';
import { fetchPageEntry } from '../services/content-service';
import { fallbackLocale, normalizeLocale, type LocaleKey } from '../lib/strapi-utils';
import Link from 'next/link';

export const revalidate = 300;

type PageProps = {
  params: Promise<{ slug: string }>;
};

const loadPageWithFallback = async (slug: string, locale: LocaleKey) => {
  const page = await fetchPageEntry(slug, locale);
  if (page) {
    return page;
  }
  if (locale !== fallbackLocale) {
    return fetchPageEntry(slug, fallbackLocale);
  }
  return null;
};

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const serverLocale = await getServerLocale();
  const locale = normalizeLocale(serverLocale);
  const { slug } = await params;
  const page = await loadPageWithFallback(slug, locale);

  if (!page) {
    return { title: 'Page not found' };
  }

  return buildContentPageMetadata(page);
}

export default async function DynamicContentPage({ params }: PageProps) {
  const { slug } = await params;
  const locale = normalizeLocale(await getServerLocale());
  const page = await loadPageWithFallback(slug, locale);

  if (!page) {
    return (
      <div className="content-page">
        <div className='container'>
          <div className='error'>
            {locale === 'ur' ? <h2>صفحہ نہیں ملا</h2> : <h2>Page not found</h2>}
            <Link className='back-home'href="/">
              {locale === 'ur' ? 'ہوم پیج پر واپس جائیں' : 'Go back to the homepage'}
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const mapped = mapContentPage(page, locale);

  return <ContentPage {...mapped.props} />;
}
