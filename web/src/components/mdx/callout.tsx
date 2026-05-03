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
    borderColor: 'border-[#00675d]',
    bgColor: 'bg-[#f0faf9]',
    iconColor: 'text-[#00675d]',
    label: 'Info',
  },
  tip: {
    icon: Lightbulb,
    borderColor: 'border-[#755600]',
    bgColor: 'bg-[#fff8e6]',
    iconColor: 'text-[#755600]',
    label: 'Tip',
  },
  warning: {
    icon: AlertTriangle,
    borderColor: 'border-[#a02d70]',
    bgColor: 'bg-[#fff0f6]',
    iconColor: 'text-[#a02d70]',
    label: 'Warning',
  },
  note: {
    icon: StickyNote,
    borderColor: 'border-[#595c5e]',
    bgColor: 'bg-[#f5f7f9]',
    iconColor: 'text-[#595c5e]',
    label: 'Note',
  },
}

export function Callout({ type = 'note', children }: Props) {
  const { icon: Icon, borderColor, bgColor, iconColor, label } = configs[type]

  return (
    <div
      className={`my-8 flex gap-4 rounded-r-xl border-l-4 px-5 py-4 ${borderColor} ${bgColor}`}
      role="note"
      aria-label={label}
    >
      <div className={`mt-0.5 shrink-0 ${iconColor}`}>
        <Icon size={20} aria-hidden="true" />
      </div>
      <div className="min-w-0 flex-1 text-[17px] leading-relaxed text-[#2c2f31] [&>*:first-child]:mt-0 [&>*:last-child]:mb-0">
        {children}
      </div>
    </div>
  )
}
