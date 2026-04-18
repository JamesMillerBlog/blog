import { compileMDX } from 'next-mdx-remote/rsc'
import { ReactElement } from 'react'
import type { Root, Element } from 'hast'
import { visit } from 'unist-util-visit'
import { ASSETS_BASE_URL } from '@/common/consts/constants'

function rewriteAssetImageSources() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (
        node.tagName === 'img' &&
        typeof node.properties?.src === 'string' &&
        node.properties.src.startsWith('/assets/')
      ) {
        node.properties.src = `${ASSETS_BASE_URL}${node.properties.src}`
      }
    })
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
