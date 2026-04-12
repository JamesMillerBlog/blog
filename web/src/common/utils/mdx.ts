import { compileMDX } from 'next-mdx-remote/rsc'
import { ReactElement } from 'react'
import { ASSETS_BASE_URL } from '@/common/consts/constants'

type Node = {
  tagName?: string
  properties?: Record<string, unknown>
  children?: Node[]
}

function rewriteAssetImageSources() {
  return (tree: Node) => {
    const visit = (node: Node) => {
      if (
        node.tagName === 'img' &&
        typeof node.properties?.src === 'string' &&
        node.properties.src.startsWith('/assets/')
      ) {
        node.properties.src = `${ASSETS_BASE_URL}${node.properties.src}`
      }

      for (const child of node.children ?? []) {
        visit(child)
      }
    }

    visit(tree)
  }
}

export async function compileMDXContent(source: string): Promise<ReactElement> {
  const { content } = await compileMDX({
    source,
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        rehypePlugins: [rewriteAssetImageSources],
      },
    },
  })

  return content
}
