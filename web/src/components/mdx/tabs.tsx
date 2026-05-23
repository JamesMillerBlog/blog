'use client'

import { ReactNode, useState } from 'react'

type TabProps = {
  label: string
  children: ReactNode
}

export function Tab({ children }: TabProps) {
  return <>{children}</>
}

type TabChild = { props: TabProps }

type TabsProps = {
  children: TabChild | TabChild[]
}

export function Tabs({ children }: TabsProps) {
  const tabs = Array.isArray(children) ? children : [children]
  const [activeIndex, setActiveIndex] = useState(0)

  return (
    <div className="my-6 overflow-hidden rounded-xl">
      <div className="flex gap-1 bg-surface-container-low p-1">
        {tabs.map((tab, i) => (
          <button
            key={i}
            onClick={() => setActiveIndex(i)}
            className={`rounded-lg px-4 py-2 text-sm font-headline font-medium transition-colors ${
              activeIndex === i
                ? 'bg-primary text-on-primary'
                : 'text-on-surface-variant hover:text-on-surface'
            }`}
          >
            {tab.props.label}
          </button>
        ))}
      </div>
      <div className="bg-surface-container-lowest p-4">{tabs[activeIndex].props.children}</div>
    </div>
  )
}
