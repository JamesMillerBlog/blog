import type { ReactNode } from 'react'

type Props = {
  children: string
}

const colorize = (token: string): ReactNode => {
  if (token.endsWith('/')) return <span className="font-semibold text-primary">{token}</span>
  if (/\.(tsx?|jsx?)$/.test(token)) return <span className="text-secondary">{token}</span>
  if (/\.mdx?$/.test(token)) return <span className="text-tertiary">{token}</span>
  return token
}

export const FileTree = ({ children }: Props): React.JSX.Element => {
  const lines = children.trim().split('\n')

  return (
    <div className="not-prose my-6 overflow-x-auto rounded-xl bg-surface-container-high p-4">
      <pre className="whitespace-pre font-mono text-sm leading-relaxed text-on-surface">
        {lines.map((line, i) => {
          const match = line.match(/^(.*?)([^\s├─│└/\\]+\/?)\s*$/)
          if (!match) return <div key={i}>{line}</div>
          const [, prefix, name] = match
          return (
            <div key={i}>
              <span className="text-on-surface-variant">{prefix}</span>
              {colorize(name)}
            </div>
          )
        })}
      </pre>
    </div>
  )
}
