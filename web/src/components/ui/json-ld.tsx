type JsonLdProps = {
  data: Record<string, unknown>
}

export const JsonLd = ({ data }: JsonLdProps): React.JSX.Element => {
  return (
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }} />
  )
}
