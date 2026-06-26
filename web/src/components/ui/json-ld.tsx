type JsonLdProps = {
  data: Record<string, unknown>
}

const safeJsonLd = (data: Record<string, unknown>): string =>
  JSON.stringify(data).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026')

export const JsonLd = ({ data }: JsonLdProps): React.JSX.Element => {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd(data) }} />
  )
}
