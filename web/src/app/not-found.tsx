import Link from 'next/link'
import { ui } from '@/i18n/en'

export default function NotFound() {
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-6">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="font-headline text-8xl md:text-9xl font-extrabold text-on-surface/10 mb-4 select-none">
          {ui.notFound.code}
        </h1>
        <h2 className="font-headline text-3xl md:text-4xl font-bold text-on-surface mb-6">
          {ui.notFound.heading}
        </h2>
        <p className="font-body text-xl text-on-surface-variant mb-12">{ui.notFound.description}</p>
        <Link
          href="/"
          className="inline-block bg-on-surface text-surface font-headline font-bold px-8 py-4 rounded-full opacity-80 hover:opacity-100 transition-opacity active:scale-95"
        >
          {ui.notFound.backHome}
        </Link>
      </div>
    </main>
  )
}
