'use client'

import { useRef, useState } from 'react'

const LANGUAGE_LABELS: Record<string, string> = {
  js: 'JavaScript',
  javascript: 'JavaScript',
  jsx: 'JSX',
  ts: 'TypeScript',
  tsx: 'TSX',
  json: 'JSON',
  html: 'HTML',
  css: 'CSS',
  scss: 'SCSS',
  bash: 'Bash',
  sh: 'Shell',
  shell: 'Shell',
  python: 'Python',
  py: 'Python',
  ruby: 'Ruby',
  go: 'Go',
  rust: 'Rust',
  java: 'Java',
  c: 'C',
  cpp: 'C++',
  cs: 'C#',
  php: 'PHP',
  swift: 'Swift',
  kotlin: 'Kotlin',
  yaml: 'YAML',
  yml: 'YAML',
  toml: 'TOML',
  md: 'Markdown',
  mdx: 'MDX',
  sql: 'SQL',
  graphql: 'GraphQL',
  xml: 'XML',
  dockerfile: 'Dockerfile',
  terraform: 'Terraform',
  hcl: 'HCL',
  dns: 'DNS',
  plaintext: 'Plain text',
}

const CodeIcon = (): React.JSX.Element => {
  return (
    <svg
      className="w-3.5 h-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4-4 4M7 16l-4-4 4-4" />
    </svg>
  )
}

const FileIcon = (): React.JSX.Element => {
  return (
    <svg
      className="w-3.5 h-3.5 shrink-0"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
      />
    </svg>
  )
}

export const CodeBlock = ({
  children,
  ...props
}: React.HTMLAttributes<HTMLPreElement>): React.JSX.Element => {
  const ref = useRef<HTMLPreElement>(null)
  const [copied, setCopied] = useState(false)

  const rawLang = (props as Record<string, string>)['data-language']
  const filename = (props as Record<string, string>)['data-filename'] as string | undefined
  const label = filename ?? (rawLang ? (LANGUAGE_LABELS[rawLang] ?? rawLang.toUpperCase()) : null)

  const handleCopy = () => {
    const code = ref.current?.querySelector('code')?.textContent ?? ''
    navigator.clipboard.writeText(code).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div className="group relative my-8 rounded-lg overflow-hidden shadow-md border border-white/5">
      {/* Header bar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#161625] border-b border-white/5">
        {/* Language / filename badge */}
        <div className="flex items-center gap-1.5 text-white/40">
          {filename ? <FileIcon /> : <CodeIcon />}
          {label && (
            <span className="text-[11px] font-semibold font-headline tracking-wide">{label}</span>
          )}
        </div>

        {/* Copy button */}
        <button
          onClick={handleCopy}
          className="text-[11px] font-semibold font-headline text-white/40 hover:text-white/80 transition-colors cursor-pointer"
          aria-label="Copy code"
        >
          {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>

      {/* Code - #abb2bf is one-dark-pro foreground for unstyled tokens */}
      <pre
        ref={ref}
        {...props}
        className="overflow-x-auto p-6 text-sm leading-relaxed bg-[#0d0d1a] [&_code]:bg-transparent [&_code]:p-0 [&_code]:text-[#abb2bf] [&_span]:leading-relaxed"
      >
        {children}
      </pre>
    </div>
  )
}
