import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export const Kbd = ({ children }: Props): React.JSX.Element => {
  return (
    <kbd className="inline-block rounded-sm border border-outline-variant/30 bg-surface-container-high px-1.5 py-0.5 font-mono text-[13px] shadow-[0_1px_0_1px_rgba(0,0,0,0.08)]">
      {children}
    </kbd>
  )
}
