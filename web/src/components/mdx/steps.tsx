import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export function Steps({ children }: Props) {
  return <ol className="my-8 list-none pl-0 [counter-reset:steps]">{children}</ol>
}

export function Step({ children }: Props) {
  return (
    <li className="relative mb-8 flex gap-5 [counter-increment:steps] last:mb-0">
      <div className="flex shrink-0 flex-col items-center">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#00675d] text-sm font-bold text-white [content:counter(steps)] before:content-[counter(steps)]" />
        <div className="mt-2 w-px flex-1 bg-[#00675d]/20 last:hidden" />
      </div>
      <div className="min-w-0 flex-1 pb-2 pt-0.5">{children}</div>
    </li>
  )
}
