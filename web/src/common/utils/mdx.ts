import { compileMDX } from 'next-mdx-remote/rsc'
import { ReactElement } from 'react'

export async function compileMDXContent(source: string): Promise<ReactElement> {
  const { content } = await compileMDX({
    source,
    options: {
      parseFrontmatter: false,
    },
  })

  return content
}
