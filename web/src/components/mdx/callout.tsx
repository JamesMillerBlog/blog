import { Info, Lightbulb, AlertTriangle, StickyNote } from 'lucide-react'
import type { ReactNode } from 'react'

type CalloutType = 'info' | 'tip' | 'warning' | 'note'

type Props = {
  type?: CalloutType
  children: ReactNode
}

type CalloutConfig = {
  icon: typeof Info
  borderColor: string
  bgColor: string
  iconColor: string
  label: string
}

const configs: Record<CalloutType, CalloutConfig> = {
  info: {
    icon: Info,
    borderColor: 'border-primary',
    bgColor: 'bg-primary/8',
    iconColor: 'text-primary',
    label: 'Info',
  },
  tip: {
    icon: Lightbulb,
    borderColor: 'border-tertiary',
    bgColor: 'bg-tertiary/8',
    iconColor: 'text-tertiary',
    label: 'Tip',
  },
  warning: {
    icon: AlertTriangle,
    borderColor: 'border-secondary',
    bgColor: 'bg-secondary/8',
    iconColor: 'text-secondary',
    label: 'Warning',
  },
  note: {
    icon: StickyNote,
    borderColor: 'border-on-surface-variant',
    bgColor: 'bg-surface',
    iconColor: 'text-on-surface-variant',
    label: 'Note',
  },
}

export function Callout({ type = 'note', children }: Props) {
  const { icon: Icon, borderColor, bgColor, iconColor, label } = configs[type]

  return (
    <div
      className={`my-8 flex gap-4 rounded-xl border-l-4 px-5 py-4 ${borderColor} ${bgColor}`}
      role="note"
      aria-label={label}
    >
      <div className={`mt-0.5 shrink-0 ${iconColor}`}>
        <Icon size={20} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1 text-[17px] leading-relaxed text-on-surface [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        {children}
      </div>
    </div>
  )
}
