import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export function Kbd({ children }: Props) {
  return (
    <kbd className="inline-block rounded-md border border-outline-variant/30 bg-surface-container-high px-1.5 py-0.5 font-mono text-[13px] shadow-[0_1px_0_1px_rgba(0,0,0,0.08)]">
      {children}
    </kbd>
  )
}
