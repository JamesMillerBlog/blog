import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'UI/Typography',
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj

// ── Helpers ───────────────────────────────────────────────────────────────────

const Row = ({ label, children }: { label: string; children: React.ReactNode }) => {
  return (
    <div className="flex items-baseline gap-6 py-3 border-b border-outline-variant/20 last:border-0">
      <span className="w-48 shrink-0 text-xs font-headline font-semibold text-on-surface-variant/60 uppercase tracking-widest">
        {label}
      </span>
      <div className="flex-1">{children}</div>
    </div>
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

export const FontFamilies: Story = {
  name: 'Font Families',
  render: () => (
    <div className="space-y-12">
      <Section title="Plus Jakarta Sans - UI & Navigation (font-headline)">
        <Row label="font-headline text-base">
          <p className="font-headline text-base text-on-surface">
            The quick brown fox jumps over the lazy dog
          </p>
        </Row>
        <Row label="font-headline font-bold">
          <p className="font-headline text-base font-bold text-on-surface">
            The quick brown fox jumps over the lazy dog
          </p>
        </Row>
        <Row label="font-headline font-extrabold">
          <p className="font-headline text-base font-extrabold text-on-surface">
            The quick brown fox jumps over the lazy dog
          </p>
        </Row>
        <Row label="tracking-widest uppercase">
          <p className="font-headline text-xs font-bold uppercase tracking-widest text-on-surface-variant">
            Label / Badge / Tag
          </p>
        </Row>
      </Section>

      <Section title="Newsreader - Long-form Content (font-body)">
        <Row label="font-body text-base">
          <p className="font-body text-base text-on-surface leading-7">
            The quick brown fox jumps over the lazy dog
          </p>
        </Row>
        <Row label="font-body italic">
          <p className="font-body text-base italic text-on-surface leading-7">
            &ldquo;A highly legible, elegant serif used for the reading experience.&rdquo;
          </p>
        </Row>
        <Row label="font-body text-2xl">
          <p className="font-body text-2xl text-on-surface leading-snug">
            Pull quote or large aside text
          </p>
        </Row>
      </Section>
    </div>
  ),
}

export const TypeScale: Story = {
  name: 'Type Scale',
  render: () => (
    <Section title="Text Size Scale - Tailwind standard only, no custom px">
      {[
        {
          cls: 'text-xs',
          label: 'text-xs · 0.75rem',
          sample: 'Tags · Captions · Badges · "On this page"',
        },
        {
          cls: 'text-sm',
          label: 'text-sm · 0.875rem',
          sample: 'TOC links · Search results · Footer · Inactive nav',
        },
        {
          cls: 'text-base',
          label: 'text-base · 1rem',
          sample: 'Active nav (B3) · Body prose · Form inputs',
        },
        {
          cls: 'text-lg',
          label: 'text-lg · 1.125rem',
          sample: 'Post card titles · Section headings · H3',
        },
        { cls: 'text-xl', label: 'text-xl · 1.375rem', sample: 'Post heading · Author bio title' },
        { cls: 'text-2xl', label: 'text-2xl · 1.5rem', sample: 'Article H2 · Pull quote large' },
        { cls: 'text-3xl', label: 'text-3xl · 1.875rem', sample: 'Page titles' },
        { cls: 'text-5xl', label: 'text-5xl · 2.5rem', sample: 'Hero heading (mobile)' },
        { cls: 'text-7xl', label: 'text-7xl · 4.5rem', sample: 'Hero heading (desktop)' },
      ].map(({ cls, label, sample }) => (
        <Row key={cls} label={label}>
          <p className={`${cls} font-headline font-bold text-on-surface leading-tight`}>{sample}</p>
        </Row>
      ))}
    </Section>
  ),
}

export const FontWeights: Story = {
  name: 'Font Weights',
  render: () => (
    <Section title="Font Weights">
      {[
        { cls: 'font-normal', label: 'font-normal · 400', note: 'Prose body, markdown paragraphs' },
        {
          cls: 'font-medium',
          label: 'font-medium · 500',
          note: 'Inactive UI, labels (B3 inactive)',
        },
        {
          cls: 'font-semibold',
          label: 'font-semibold · 600',
          note: 'Secondary buttons, footer links',
        },
        { cls: 'font-bold', label: 'font-bold · 700', note: 'Post card titles, section headings' },
        {
          cls: 'font-extrabold',
          label: 'font-extrabold · 800',
          note: 'Active states, hero (B3 active)',
        },
      ].map(({ cls, label, note }) => (
        <Row key={cls} label={label}>
          <p className={`${cls} text-lg font-headline text-on-surface`}>
            Byte Mark{' '}
            <span className="text-sm font-normal font-headline text-on-surface-variant ml-2">
              {note}
            </span>
          </p>
        </Row>
      ))}
    </Section>
  ),
}

export const TextColors: Story = {
  name: 'Text Colors',
  render: () => (
    <Section title="Semantic Text Color Tokens">
      {[
        {
          cls: 'text-on-surface',
          label: 'text-on-surface',
          note: 'Primary text, active states, headings',
        },
        {
          cls: 'text-on-surface-variant',
          label: 'text-on-surface-variant',
          note: 'Secondary text, metadata, captions',
        },
        {
          cls: 'text-primary',
          label: 'text-primary',
          note: 'Article links, semantic accents only',
        },
        {
          cls: 'text-secondary',
          label: 'text-secondary',
          note: 'Blockquotes, hover on primary links',
        },
        {
          cls: 'text-outline',
          label: 'text-outline',
          note: 'Dates, reading time, footer copyright',
        },
        {
          cls: 'text-outline-variant',
          label: 'text-outline-variant',
          note: 'Divider hints, deeply inactive elements',
        },
      ].map(({ cls, label, note }) => (
        <Row key={cls} label={label}>
          <p className={`${cls} text-base font-headline font-semibold`}>
            Sample text{' '}
            <span className="text-sm font-normal text-on-surface-variant/60 ml-2">{note}</span>
          </p>
        </Row>
      ))}
    </Section>
  ),
}

export const ComponentAudit: Story = {
  name: '⚠ Component Audit',
  render: () => (
    <div className="space-y-12">
      <Section title="Badge / Label text - should all be text-xs font-bold uppercase tracking-widest">
        <div className="space-y-3">
          {[
            {
              label: 'post-card.tsx category',
              cls: 'text-xs font-bold uppercase tracking-widest font-headline text-on-surface-variant',
              ok: true,
            },
            {
              label: 'projects-timeline.tsx type label',
              cls: 'text-xs font-bold uppercase tracking-widest font-headline text-primary',
              ok: true,
            },
            {
              label: 'tag-cloud-section.tsx tag',
              cls: 'font-medium text-sm font-headline text-on-surface-variant',
              ok: false,
              note: 'Missing uppercase + tracking-widest - uses B3 pattern instead',
            },
            {
              label: 'search-modal.tsx type chip',
              cls: 'text-xs font-semibold font-headline text-on-surface-variant',
              ok: false,
              note: 'font-semibold not font-bold, no uppercase/tracking',
            },
          ].map(({ label, cls, ok, note }) => (
            <div
              key={label}
              className={`flex items-start gap-4 p-3 rounded-xl border ${ok ? 'border-primary/20 bg-primary/5' : 'border-tertiary-container bg-tertiary-container/10'}`}
            >
              <span className={cls}>Front End</span>
              <div>
                <p className="text-xs font-headline text-on-surface-variant">{label}</p>
                <code className="text-xs font-mono text-on-surface-variant/60">{cls}</code>
                {note && (
                  <p className="text-xs font-headline text-on-tertiary-container mt-0.5">{note}</p>
                )}
              </div>
              <span
                className={`ml-auto text-xs font-headline font-bold ${ok ? 'text-primary' : 'text-on-tertiary-container'}`}
              >
                {ok ? '✓' : '⚠'}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Card title text - should all be font-headline font-bold text-on-surface">
        <div className="space-y-3">
          {[
            {
              label: 'post-card.tsx title',
              cls: 'font-headline font-bold text-lg text-on-surface',
              ok: true,
            },
            {
              label: 'projects-timeline.tsx ProjectCard title',
              cls: 'font-headline text-2xl font-bold text-on-surface',
              ok: false,
              note: 'text-2xl vs text-lg - larger than post cards',
            },
            {
              label: 'related-posts.tsx title',
              cls: 'font-headline font-bold text-on-surface',
              ok: true,
            },
          ].map(({ label, cls, ok, note }) => (
            <div
              key={label}
              className={`flex items-start gap-4 p-3 rounded-xl border ${ok ? 'border-primary/20 bg-primary/5' : 'border-tertiary-container bg-tertiary-container/10'}`}
            >
              <span className={`${cls} shrink-0`}>Building AI Pipelines</span>
              <div>
                <p className="text-xs font-headline text-on-surface-variant">{label}</p>
                <code className="text-xs font-mono text-on-surface-variant/60">{cls}</code>
                {note && (
                  <p className="text-xs font-headline text-on-tertiary-container mt-0.5">{note}</p>
                )}
              </div>
              <span
                className={`ml-auto text-xs font-headline font-bold ${ok ? 'text-primary' : 'text-on-tertiary-container'}`}
              >
                {ok ? '✓' : '⚠'}
              </span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Metadata / date text - should all be text-xs font-headline text-outline">
        <div className="space-y-3">
          {[
            {
              label: 'post-card.tsx date',
              cls: 'text-xs font-semibold text-outline font-headline',
              ok: true,
            },
            {
              label: 'author-bio.tsx role',
              cls: 'text-sm font-headline text-on-surface-variant',
              ok: false,
              note: 'text-sm not text-xs, text-on-surface-variant not text-outline',
            },
            {
              label: 'table-of-contents.tsx heading',
              cls: 'text-xs font-bold uppercase tracking-widest text-on-surface-variant font-headline',
              ok: false,
              note: 'Uses label pattern - may be intentional',
            },
          ].map(({ label, cls, ok, note }) => (
            <div
              key={label}
              className={`flex items-start gap-4 p-3 rounded-xl border ${ok ? 'border-primary/20 bg-primary/5' : 'border-tertiary-container bg-tertiary-container/10'}`}
            >
              <span className={`${cls} shrink-0`}>Jan 2025 · 8 min</span>
              <div>
                <p className="text-xs font-headline text-on-surface-variant">{label}</p>
                <code className="text-xs font-mono text-on-surface-variant/60">{cls}</code>
                {note && (
                  <p className="text-xs font-headline text-on-tertiary-container mt-0.5">{note}</p>
                )}
              </div>
              <span
                className={`ml-auto text-xs font-headline font-bold ${ok ? 'text-primary' : 'text-on-tertiary-container'}`}
              >
                {ok ? '✓' : '⚠'}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  ),
}

export const UIPatterns: Story = {
  name: 'UI Patterns (B3)',
  render: () => (
    <div className="space-y-12">
      <Section title="B3 - Weight + Size shift (navigation, tag filters, TOC)">
        <Row label="Active state">
          <span className="font-headline font-extrabold text-base text-on-surface">
            Active Link
          </span>
        </Row>
        <Row label="Inactive state">
          <span className="font-headline font-medium text-sm text-on-surface-variant">
            Inactive Link
          </span>
        </Row>
        <Row label="Hover state">
          <span className="font-headline font-medium text-sm text-on-surface">Hover Link</span>
        </Row>
        <Row label="In context">
          <div className="flex items-center gap-6">
            {['Writing', 'Projects', 'About'].map((item, i) => (
              <span
                key={item}
                className={`font-headline transition-all ${
                  i === 0
                    ? 'font-extrabold text-base text-on-surface'
                    : 'font-medium text-sm text-on-surface-variant'
                }`}
              >
                {item}
              </span>
            ))}
          </div>
        </Row>
      </Section>

      <Section title="Semantic Labels (primary / secondary - not for chrome)">
        <Row label="Product badge">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-headline font-bold uppercase tracking-widest bg-primary/10 text-primary">
            Product
          </span>
        </Row>
        <Row label="Experience badge">
          <span className="px-2.5 py-0.5 rounded-full text-xs font-headline font-bold uppercase tracking-widest bg-secondary/10 text-secondary">
            Experience
          </span>
        </Row>
        <Row label="Neutral tag">
          <span className="text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant">
            Front End
          </span>
        </Row>
      </Section>

      <Section title="Markdown Article Headings (Newsreader + Plus Jakarta Sans)">
        <Row label="H1 · hero">
          <p className="font-headline text-5xl font-extrabold text-on-surface leading-[1.1]">
            Article Title
          </p>
        </Row>
        <Row label="H2 · section">
          <p className="font-headline text-2xl font-bold text-on-surface border-l-[3px] border-primary pl-3">
            Section Heading
          </p>
        </Row>
        <Row label="H3 · subsection">
          <p className="font-headline text-lg font-bold text-on-surface">Subsection Heading</p>
        </Row>
        <Row label="body prose">
          <p className="font-body text-base text-on-surface leading-7">
            Long-form paragraph text uses Newsreader at 1rem / line-height 1.7 for comfortable
            reading across all screen sizes.
          </p>
        </Row>
      </Section>
    </div>
  ),
}
