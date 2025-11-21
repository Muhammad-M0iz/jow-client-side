// app/lib/get-locale.ts
import { cookies } from 'next/headers';

export type LocaleKey = 'en' | 'ur';

export async function getServerLocale(): Promise<LocaleKey> {
  const cookieStore = await cookies();
  const locale = cookieStore.get('NEXT_LOCALE')?.value;
  
  if (locale === 'ur') return 'ur';
  return 'en'; // Default to 'en'
}