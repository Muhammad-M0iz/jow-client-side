import type { ReactNode } from 'react';
import Footer from '../components/Footer';
import { Header, type MenuItem } from '../components/Header';
import { getFooter } from '../lib/footer';

const STRAPI_URL = process.env.NEXT_PUBLIC_STRAPI_URL || 'http://localhost:1337';

async function getNavigation(locale: string): Promise<MenuItem[]> {
  const endpoint = `/api/navigation?locale=${locale}`;

  try {
    const res = await fetch(`${STRAPI_URL}${endpoint}`, {
      next: { revalidate: 60 }, 
    });

    if (!res.ok) {
      throw new Error('Failed to fetch navigation');
    }

    return res.json();
  } catch (error) {
    console.error('Error fetching navigation:', error);
    return [];
  }
}


export default async function RootLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const resolvedParams = await params;
  const locale = resolvedParams.locale;

  const [menuItems, footerData] = await Promise.all([
    getNavigation(locale),
    getFooter(locale),
  ]);

  return (
    <html lang={locale} dir={locale === 'ur' ? 'rtl' : 'ltr'}>
      <body className="bg-white text-black">
        
        <Header menuItems={menuItems} />
        
        <main>{children}</main>
        
        <Footer data={footerData} locale={locale} />
        
      </body>
    </html>
  );
}

// This tells Next.js to pre-build the 'en' and 'ur' versions
export async function generateStaticParams() {
  return [{ locale: 'en' }, { locale: 'ur' }];
}