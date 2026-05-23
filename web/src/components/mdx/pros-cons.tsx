import { CheckCircleIcon, XCircleIcon } from 'lucide-react'

type Props = {
  pros: string[]
  cons: string[]
  prosLabel?: string
  consLabel?: string
}

export function ProsCons({ pros, cons, prosLabel = 'Pros', consLabel = 'Cons' }: Props) {
  return (
    <div className="not-prose my-8 grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="rounded-xl bg-primary/5 p-5">
        <div className="mb-3 flex items-center gap-2">
          <CheckCircleIcon className="h-5 w-5 text-primary" />
          <span className="font-headline text-sm font-bold uppercase tracking-wider text-primary">
            {prosLabel}
          </span>
        </div>
        <ul className="space-y-2">
          {pros.map((item, i) => (
            <li key={i} className="flex items-start gap-2 font-body text-sm text-on-surface">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary" />
              {item}
            </li>
          ))}
        </ul>
      </div>
      <div className="rounded-xl bg-secondary/5 p-5">
        <div className="mb-3 flex items-center gap-2">
          <XCircleIcon className="h-5 w-5 text-secondary" />
          <span className="font-headline text-sm font-bold uppercase tracking-wider text-secondary">
            {consLabel}
          </span>
        </div>
        <ul className="space-y-2">
          {cons.map((item, i) => (
            <li key={i} className="flex items-start gap-2 font-body text-sm text-on-surface">
              <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
              {item}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
