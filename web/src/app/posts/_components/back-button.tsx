'use client'

import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from 'lucide-react'

export const BackButton = ({ label }: { label: string }): React.JSX.Element => {
  const router = useRouter()

  const handleBack = () => {
    const cameFromSameSite = document.referrer.startsWith(window.location.origin)
    if (cameFromSameSite) {
      router.back()
    } else {
      router.push('/')
    }
  }

  return (
    <button
      onClick={handleBack}
      className="inline-flex items-center gap-2 text-primary font-headline font-bold text-sm hover:text-secondary transition-colors px-4 py-2 bg-primary/5 hover:bg-secondary/5 rounded-full cursor-pointer"
    >
      <ArrowLeftIcon className="w-4 h-4" /> {label}
    </button>
  )
}
