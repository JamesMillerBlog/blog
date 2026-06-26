import { CheckCircleIcon, XCircleIcon } from 'lucide-react'

type Props = {
  pros: string[]
  cons: string[]
  prosLabel?: string
  consLabel?: string
}

export const ProsCons = ({
  pros,
  cons,
  prosLabel = 'Pros',
  consLabel = 'Cons',
}: Props): React.JSX.Element => {
  return (
    <div className="not-prose my-8 grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-xl bg-surface-container-low p-5">
        <div className="mb-3 flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5 text-on-surface" />
          <span className="font-headline text-sm font-bold uppercase tracking-wider text-on-surface">
            {prosLabel}
          </span>
        </div>
        <ul className="space-y-2">
          {pros.map((item, i) => (
            <li key={i} className="flex items-start gap-2 font-body text-sm text-on-surface">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-on-surface/60" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl bg-surface-container p-5">
        <div className="mb-3 flex items-center gap-2">
          <XCircleIcon className="h-5 w-5 text-on-surface-variant" />
          <span className="font-headline text-sm font-bold uppercase tracking-wider text-on-surface-variant">
            {consLabel}
          </span>
        </div>
        <ul className="space-y-2">
          {cons.map((item, i) => (
            <li key={i} className="flex items-start gap-2 font-body text-sm text-on-surface">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-on-surface-variant/50" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
