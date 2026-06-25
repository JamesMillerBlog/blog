import type { ReactNode } from 'react'

type Props = {
  children: ReactNode
}

export const Steps = ({ children }: Props): React.JSX.Element => {
  return <ol className="my-8 list-none pl-0 [counter-reset:steps]">{children}</ol>
}

export const Step = ({ children }: Props): React.JSX.Element => {
  return (
    <li className="group/step relative mb-8 flex gap-5 [counter-increment:steps] last:mb-0">
      <div className="flex shrink-0 flex-col items-center" aria-hidden="true">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-container-high text-sm font-bold text-on-surface before:content-[counter(steps)]" />
        <div className="mt-2 w-px flex-1 bg-outline-variant/20 group-last/step:hidden" />
      </div>
      <div className="min-w-0 flex-1 pb-2 pt-0.5">{children}</div>
    </li>
  )
}
