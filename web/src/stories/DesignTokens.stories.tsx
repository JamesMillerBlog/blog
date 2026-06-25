import type { Meta, StoryObj } from '@storybook/react'

const meta: Meta = {
  title: 'UI/DesignTokens',
  parameters: { layout: 'padded' },
}
export default meta
type Story = StoryObj

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="mb-10">
      <p className="text-xs font-bold uppercase tracking-widest text-on-surface-variant/50 font-headline mb-4">
        {title}
      </p>
      <div className="bg-surface-container-lowest rounded-xl p-6">{children}</div>
    </div>
  )
}

function TokenRow({
  cls,
  description,
  example,
}: {
  cls: string
  description: string
  example: React.ReactNode
}) {
  return (
    <div className="flex items-center gap-6 py-3 border-b border-outline-variant/10 last:border-0">
      <code className="w-36 shrink-0 text-xs font-mono bg-surface-container px-2 py-1 rounded text-primary">
        {cls}
      </code>
      <div className="w-56 shrink-0 text-xs font-headline text-on-surface-variant">
        {description}
      </div>
      <div className="flex-1">{example}</div>
    </div>
  )
}

export const SemanticClasses: Story = {
  name: 'Semantic Classes',
  render: () => (
    <div>
      <div className="mb-8 p-4 bg-primary/5 rounded-xl border border-primary/20">
        <p className="font-headline font-bold text-sm text-on-surface mb-1">How to use</p>
        <p className="text-xs font-headline text-on-surface-variant">
          Use these classes instead of writing raw Tailwind token combinations. They enforce the
          design system and make inconsistencies visible at a glance. Defined in{' '}
          <code className="font-mono bg-surface-container px-1 rounded">
            globals.css @layer components
          </code>
          .
        </p>
      </div>

      <Section title="Containers">
        <TokenRow
          cls=".ds-card"
          description="Card container — rounded-xl + surface-container-lowest"
          example={
            <div className="ds-card p-4 w-48">
              <div className="h-2 bg-surface-container-high rounded-full mb-2 w-3/4" />
              <div className="h-2 bg-surface-container-high rounded-full w-1/2" />
            </div>
          }
        />
        <TokenRow
          cls=".ds-panel"
          description="Panel/section — rounded-xl + surface-container-low + border"
          example={
            <div className="ds-panel p-4 w-48">
              <div className="h-2 bg-surface-container-high rounded-full mb-2 w-3/4" />
              <div className="h-2 bg-surface-container-high rounded-full w-1/2" />
            </div>
          }
        />
      </Section>

      <Section title="Typography">
        <TokenRow
          cls=".ds-card-title"
          description="font-headline text-lg font-bold text-on-surface"
          example={<span className="ds-card-title">Building AI Pipelines</span>}
        />
        <TokenRow
          cls=".ds-post-tag"
          description="text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant"
          example={<span className="ds-post-tag">Artificial Intelligence</span>}
        />
        <TokenRow
          cls=".ds-metadata"
          description="text-xs font-headline font-semibold text-outline"
          example={<span className="ds-metadata">Jan 15, 2025 · 8 min read</span>}
        />
        <TokenRow
          cls=".ds-type-chip"
          description="Pill badge — rounded-full text-xs font-bold bg-surface-container"
          example={
            <div className="flex gap-2">
              <span className="ds-type-chip">post</span>
              <span className="ds-type-chip">project</span>
            </div>
          }
        />
      </Section>

      <Section title="B3 Chrome Pattern">
        <TokenRow
          cls=".ds-b3-active"
          description="font-headline font-extrabold text-base text-on-surface"
          example={<span className="ds-b3-active">Writing</span>}
        />
        <TokenRow
          cls=".ds-b3-inactive"
          description="font-headline font-medium text-sm text-on-surface-variant hover:text-on-surface"
          example={<span className="ds-b3-inactive">Projects</span>}
        />
        <TokenRow
          cls="In context"
          description="Nav/filter active + inactive side by side"
          example={
            <div className="flex gap-6 items-center">
              <span className="ds-b3-active">Writing</span>
              <span className="ds-b3-inactive">Projects</span>
              <span className="ds-b3-inactive">About</span>
            </div>
          }
        />
      </Section>
    </div>
  ),
}

export const ComponentInventory: Story = {
  name: 'Component Inventory',
  render: () => (
    <Section title="Which component uses which class">
      <table className="w-full text-left">
        <thead>
          <tr className="border-b border-outline-variant/30">
            {[
              'Component',
              'ds-card',
              'ds-panel',
              'ds-card-title',
              'ds-post-tag',
              'ds-metadata',
              'ds-type-chip',
              'ds-b3-*',
            ].map((h) => (
              <th
                key={h}
                className="pb-3 pr-3 text-xs font-headline font-bold uppercase tracking-widest text-on-surface-variant/60"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[
            {
              name: 'post-card',
              card: true,
              panel: false,
              title: true,
              tag: true,
              meta: true,
              chip: false,
              b3: false,
            },
            {
              name: 'related-posts',
              card: true,
              panel: false,
              title: true,
              tag: true,
              meta: true,
              chip: false,
              b3: false,
            },
            {
              name: 'author-bio',
              card: false,
              panel: true,
              title: false,
              tag: false,
              meta: false,
              chip: false,
              b3: false,
            },
            {
              name: 'search-modal',
              card: true,
              panel: false,
              title: false,
              tag: false,
              meta: false,
              chip: true,
              b3: false,
            },
            {
              name: 'table-of-contents',
              card: true,
              panel: false,
              title: false,
              tag: false,
              meta: false,
              chip: false,
              b3: false,
            },
            {
              name: 'navigation',
              card: false,
              panel: false,
              title: false,
              tag: false,
              meta: false,
              chip: false,
              b3: true,
            },
            {
              name: 'tag-cloud-section',
              card: false,
              panel: false,
              title: false,
              tag: false,
              meta: false,
              chip: false,
              b3: true,
            },
            {
              name: 'projects-timeline',
              card: true,
              panel: false,
              title: true,
              tag: false,
              meta: false,
              chip: false,
              b3: true,
            },
          ].map(({ name, card, panel, title, tag, meta, chip, b3 }) => {
            const tick = (v: boolean) =>
              v ? (
                <span className="text-primary font-bold">✓</span>
              ) : (
                <span className="text-on-surface-variant/20">–</span>
              )
            return (
              <tr key={name} className="border-b border-outline-variant/10 last:border-0">
                <td className="py-2.5 pr-3 text-xs font-mono text-on-surface-variant">{name}</td>
                <td className="py-2.5 pr-3 text-center">{tick(card)}</td>
                <td className="py-2.5 pr-3 text-center">{tick(panel)}</td>
                <td className="py-2.5 pr-3 text-center">{tick(title)}</td>
                <td className="py-2.5 pr-3 text-center">{tick(tag)}</td>
                <td className="py-2.5 pr-3 text-center">{tick(meta)}</td>
                <td className="py-2.5 pr-3 text-center">{tick(chip)}</td>
                <td className="py-2.5 pr-3 text-center">{tick(b3)}</td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </Section>
  ),
}
