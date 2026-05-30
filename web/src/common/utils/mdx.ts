import { compileMDX } from 'next-mdx-remote/rsc'
import { ReactElement } from 'react'
import type { Root, Element } from 'hast'
import { visit } from 'unist-util-visit'
import rehypePrettyCode from 'rehype-pretty-code'
import { ASSETS_BASE_URL } from '@/common/consts/constants'
import { mdxComponents } from '@/components/mdx'
import { CodeBlock } from '@/components/mdx/code-block'

export function rewriteAssetImageSources() {
  return (tree: Root) => {
    visit(tree, 'element', (node: Element) => {
      if (
        node.tagName === 'img' &&
        typeof node.properties?.src === 'string' &&
        node.properties.src.startsWith('/assets/')
      ) {
        // In development, serve from local public folder
        if (process.env.NODE_ENV === 'development') {
          return
        }
        node.properties.src = `${ASSETS_BASE_URL}${node.properties.src}`
      }
    })
  }
}

const prettyCodeOptions = {
  theme: 'one-dark-pro',
  keepBackground: false,
  defaultLang: 'plaintext',
}

export async function compileMDXContent(source: string): Promise<ReactElement> {
  const { content } = await compileMDX({
    source,
    components: { ...mdxComponents, pre: CodeBlock },
    options: {
      parseFrontmatter: false,
      mdxOptions: {
        rehypePlugins: [rewriteAssetImageSources, [rehypePrettyCode, prettyCodeOptions]],
      },
    },
  })

  return content
}
