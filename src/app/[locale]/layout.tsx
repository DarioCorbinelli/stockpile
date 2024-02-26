import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'
import { getTranslations } from 'next-intl/server'
import Providers from '@/components/Providers'
import { NextIntlClientProvider, useMessages } from 'next-intl'

const inter = Inter({ subsets: ['latin'] })

type Props = {
  children: React.ReactNode
  params: { locale: string }
}

export async function generateMetadata({ params: { locale } }: Omit<Props, 'children'>) {
  const t = await getTranslations({ locale, namespace: 'Project.Metadata' })

  return {
    title: t('title'),
    description: t('description'),
  } as Metadata
}

export default function RootLayout({ children, params: { locale } }: Readonly<Props>) {
  const messages = useMessages()

  return (
    <html lang={locale}>
      <body className={inter.className}>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <Providers>{children}</Providers>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
