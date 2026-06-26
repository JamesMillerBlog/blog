import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'UI/BorderRadius',
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj

// ── Helpers ───────────────────────────────────────────────────────────────────

const Token = ({
  name,
  value,
  cls,
  note,
}: {
  name: string
  value: string
  cls: string
  note?: string
}) => {
  return (
    <div className="flex items-center gap-4 py-3 border-b border-outline-variant/20 last:border-0">
      <div className={`w-16 h-16 bg-primary/20 border-2 border-primary/40 shrink-0 ${cls}`} />
      <div className="flex-1">
        <p className="font-headline font-bold text-sm text-on-surface">{name}</p>
        <p className="font-headline text-xs text-on-surface-variant">{value}</p>
        {note && <p className="font-headline text-xs text-outline mt-0.5">{note}</p>}
      </div>
      <code className="text-xs font-mono bg-surface-container px-2 py-1 rounded text-on-surface-variant">
        {cls}
      </code>
    </div>
  )
}

const AuditRow = ({
  cls,
  status,
  token,
  components,
  elements,
}: {
  cls: string
  status: 'ok' | 'warn' | 'error'
  token: string
  components: string[]
  elements: string
}) => {
  const badge = {
    ok: 'bg-primary/10 text-primary',
    warn: 'bg-tertiary-container/40 text-on-tertiary-container',
    error: 'bg-error-container/30 text-error',
  }[status]
  const label = { ok: '✓ token', warn: '⚠ off-system', error: '✗ missing' }[status]

  return (
    <tr className="border-b border-outline-variant/10 last:border-0">
      <td className="py-3 pr-4">
        <code className="text-xs font-mono bg-surface-container px-2 py-1 rounded text-on-surface">
          {cls}
        </code>
      </td>
      <td className="py-3 pr-4">
        <span className={`px-2 py-0.5 rounded-full text-xs font-headline font-bold ${badge}`}>
          {label}
        </span>
      </td>
      <td className="py-3 pr-4 text-xs font-headline text-on-surface-variant">{token}</td>
      <td className="py-3 pr-4 text-xs font-headline text-on-surface-variant">{elements}</td>
      <td className="py-3 text-xs font-headline text-on-surface-variant">
        {components.join(', ')}
      </td>
    </tr>
  )
}

const Section = ({ title, children }: { title: string; children: React.ReactNode }) => {
  return (
    <div className="mb-12">
      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/50 font-headline mb-4">
        {title}
      </p>
      <div className="bg-surface-container-lowest rounded-2xl p-6">{children}</div>
    </div>
  )
}

// ── Stories ───────────────────────────────────────────────────────────────────

export const TokenScale: Story = {
  name: 'Token Scale',
  render: () => (
    <div className="space-y-12">
      <Section title="Design System Tokens - @theme in globals.css">
        <Token
          name="rounded-sm"
          value="--radius-sm · 0.5rem"
          cls="rounded-sm"
          note="Small UI details"
        />
        <Token
          name="rounded"
          value="--radius-DEFAULT · 1rem"
          cls="rounded"
          note="Default container radius"
        />
        <Token
          name="rounded-lg"
          value="--radius-lg · 2rem"
          cls="rounded-lg"
          note="Videos, code blocks, tab buttons"
        />
        <Token
          name="rounded-xl"
          value="--radius-xl · 3rem"
          cls="rounded-xl"
          note="Cards (post, project, related)"
        />
        <Token
          name="rounded-full"
          value="--radius-full · 9999px"
          cls="rounded-full"
          note="Badges, tags, pills, avatars, nav buttons"
        />
      </Section>

      <Section title="Off-System Classes - Tailwind defaults, no token defined">
        <div className="flex items-center gap-3 mb-4 p-3 bg-tertiary-container/20 rounded-xl">
          <span className="text-sm font-headline font-bold text-on-tertiary-container">
            ⚠ These classes bypass the token system
          </span>
        </div>
        <Token
          name="rounded-md"
          value="Tailwind default · 0.375rem (no token)"
          cls="rounded-md"
          note="Used in: kbd.tsx - should be rounded-sm or rounded"
        />
        <Token
          name="rounded-2xl"
          value="Tailwind default · 1rem (no token)"
          cls="rounded-2xl"
          note="Used in 10 places: modals, panels, author-bio, search-modal, TOC, project-detail"
        />
        <Token
          name="rounded-3xl"
          value="Tailwind default · 1.5rem (no token)"
          cls="rounded-3xl"
          note="Used in: post-header hero image - outlier"
        />
      </Section>
    </div>
  ),
}

export const ComponentAudit: Story = {
  name: 'Component Audit',
  render: () => (
    <Section title="All components - radius class, token status, usage">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-outline-variant/30">
            <th className="pb-3 pr-4 text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant/60">
              Class
            </th>
            <th className="pb-3 pr-4 text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant/60">
              Status
            </th>
            <th className="pb-3 pr-4 text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant/60">
              Token value
            </th>
            <th className="pb-3 pr-4 text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant/60">
              Element
            </th>
            <th className="pb-3 text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant/60">
              Components
            </th>
          </tr>
        </thead>
        <tbody>
          <AuditRow
            cls="rounded-full"
            status="ok"
            token="9999px"
            elements="badges, tags, pills, avatars, nav"
            components={['tag-cloud-section', 'post-card', 'navigation', 'projects-timeline']}
          />
          <AuditRow
            cls="rounded-xl"
            status="ok"
            token="3rem"
            elements="cards"
            components={['post-card', 'related-posts', 'projects-timeline', 'callout']}
          />
          <AuditRow
            cls="rounded-lg"
            status="ok"
            token="2rem"
            elements="video, tabs, code"
            components={['projects-timeline', 'tabs', 'callout']}
          />
          <AuditRow
            cls="rounded"
            status="ok"
            token="1rem"
            elements="containers"
            components={['various']}
          />
          <AuditRow
            cls="rounded-sm"
            status="ok"
            token="0.5rem"
            elements="small details"
            components={['various']}
          />
          <AuditRow
            cls="rounded-2xl"
            status="warn"
            token="Tailwind 1rem (no token)"
            elements="modals, panels, headers"
            components={[
              'search-modal',
              'author-bio',
              'table-of-contents',
              'project-detail',
              'post-header',
            ]}
          />
          <AuditRow
            cls="rounded-3xl"
            status="warn"
            token="Tailwind 1.5rem (no token)"
            elements="hero image"
            components={['post-header']}
          />
          <AuditRow
            cls="rounded-md"
            status="warn"
            token="Tailwind 0.375rem (no token)"
            elements="kbd"
            components={['kbd']}
          />
        </tbody>
      </table>
    </Section>
  ),
}

export const VisualComparison: Story = {
  name: 'Visual Comparison',
  render: () => (
    <div className="space-y-12">
      <Section title="Cards - should all be rounded-xl (✓ consistent)">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'post-card.tsx', cls: 'rounded-xl', ok: true },
            { label: 'related-posts.tsx', cls: 'rounded-xl', ok: true },
            { label: 'projects-timeline.tsx card', cls: 'rounded-xl', ok: true },
          ].map(({ label, cls, ok }) => (
            <div
              key={label}
              className={`${cls} bg-surface-container-low p-4 border-2 ${ok ? 'border-primary/30' : 'border-error/30'}`}
            >
              <div className="h-3 bg-surface-container-high rounded-full mb-2 w-3/4" />
              <div className="h-3 bg-surface-container-high rounded-full mb-2" />
              <div className="h-3 bg-surface-container-high rounded-full w-2/3" />
              <p className="text-xs font-headline text-on-surface-variant mt-3">{label}</p>
              <code className="text-xs font-mono text-primary">{cls}</code>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Modals & Panels - inconsistent (⚠ rounded-2xl off-system)">
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: 'search-modal.tsx', cls: 'rounded-2xl', ok: false },
            { label: 'author-bio.tsx', cls: 'rounded-2xl', ok: false },
            { label: 'table-of-contents.tsx', cls: 'rounded-2xl', ok: false },
            { label: 'project-detail.tsx', cls: 'rounded-2xl', ok: false },
            { label: 'post-header.tsx', cls: 'rounded-3xl', ok: false },
            { label: 'what should it be?', cls: 'rounded-xl', ok: true },
          ].map(({ label, cls, ok }) => (
            <div
              key={label}
              className={`${cls} bg-surface-container-low p-4 border-2 ${ok ? 'border-primary/30' : 'border-tertiary-container'}`}
            >
              <div className="h-3 bg-surface-container-high rounded-full mb-2 w-3/4" />
              <div className="h-3 bg-surface-container-high rounded-full mb-2" />
              <div className="h-3 bg-surface-container-high rounded-full w-2/3" />
              <p className="text-xs font-headline text-on-surface-variant mt-3">{label}</p>
              <code
                className={`text-xs font-mono ${ok ? 'text-primary' : 'text-on-tertiary-container'}`}
              >
                {cls}
              </code>
            </div>
          ))}
        </div>
        <p className="text-xs font-headline text-on-surface-variant mt-4">
          The last box shows what{' '}
          <code className="font-mono bg-surface-container px-1 rounded">rounded-xl</code>{' '}
          (token-aligned) would look like - visually compare to decide if these should be
          standardised.
        </p>
      </Section>

      <Section title="Badges & Pills - should all be rounded-full (✓ consistent)">
        <div className="flex flex-wrap gap-3">
          {[
            { label: 'tag (tag-cloud-section)', text: 'Front End' },
            { label: 'category badge (post-card)', text: 'AI' },
            { label: 'type badge (projects)', text: 'Product' },
            { label: 'nav link (navigation)', text: 'Writing' },
          ].map(({ label, text }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <span className="px-4 py-1.5 rounded-full bg-surface-container text-on-surface font-headline text-sm font-bold">
                {text}
              </span>
              <span className="text-xs font-headline text-on-surface-variant/60">{label}</span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  ),
}

export const Decisions: Story = {
  name: '⚠ Open Decisions',
  render: () => (
    <div className="space-y-4">
      {[
        {
          issue: 'rounded-2xl used in 10 components',
          components: 'search-modal, author-bio, table-of-contents, project-detail, post-header',
          option1: 'Add --radius-2xl token to globals.css (formalise it)',
          option2: 'Migrate all to rounded-xl (3rem) - matches card token, fewer values',
          severity: 'medium',
        },
        {
          issue: 'rounded-3xl on post-header hero image',
          components: 'post-header.tsx',
          option1: 'Migrate to rounded-xl to match cards',
          option2: 'Migrate to rounded-2xl to sit between card and full',
          severity: 'low',
        },
        {
          issue: 'rounded-md on kbd element',
          components: 'kbd.tsx',
          option1: 'Change to rounded-sm (0.5rem token)',
          option2: 'Change to rounded (1rem token)',
          severity: 'low',
        },
      ].map(({ issue, components, option1, option2, severity }) => (
        <div
          key={issue}
          className={`rounded-xl p-5 border ${severity === 'medium' ? 'border-tertiary-container bg-tertiary-container/10' : 'border-outline-variant/20 bg-surface-container-lowest'}`}
        >
          <div className="flex items-center gap-2 mb-2">
            <span
              className={`px-2 py-0.5 rounded-full text-xs font-headline font-bold uppercase tracking-widest ${severity === 'medium' ? 'bg-tertiary-container text-on-tertiary-container' : 'bg-surface-container text-on-surface-variant'}`}
            >
              {severity}
            </span>
            <p className="font-headline font-bold text-sm text-on-surface">{issue}</p>
          </div>
          <p className="text-xs font-headline text-on-surface-variant mb-3">
            <span className="font-bold">Affects:</span> {components}
          </p>
          <div className="space-y-1">
            <p className="text-xs font-headline text-on-surface">
              <span className="font-bold text-primary">Option A:</span> {option1}
            </p>
            <p className="text-xs font-headline text-on-surface">
              <span className="font-bold text-on-surface-variant">Option B:</span> {option2}
            </p>
          </div>
        </div>
      ))}
    </div>
  ),
}
