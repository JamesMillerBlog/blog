export const SITE_NAME = 'James Miller'
export const SITE_DESCRIPTION = 'Creative Technology Blog - WebXR, Serverless, AWS, and more'
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://jamesmiller.blog'
export const TWITTER_HANDLE = '@JamesMillerBlog'
export const AUTHOR = {
  name: 'James Miller',
  url: 'https://jamesmiller.blog',
  twitter: '@JamesMillerBlog',
}

export const FEATURED_TAGS = [
  'Artificial Intelligence',
  'Amazon Web Services',
  'Spacial Computing',
  'DevOps',
  'Blockchain',
  'Front End',
  'Back End',
]

export const FEATURED_TAG_MAP: Record<string, string[]> = {
  'Amazon Web Services': ['aws', 'amazonwebservices', 'amazoncognito'],
  'Spacial Computing': ['webxr', 'webvr', 'mixedreality', 'threejs'],
  'Artificial Intelligence': ['ai', 'machinelearning', 'claudecode'],
  DevOps: ['devops', 'security', 'cli', 'terraform', 'iac'],
  Blockchain: ['blockchain', 'ethereum', 'web3'],
  'Front End': ['frontend', 'html', 'javascript', 'nextjs', 'react', 'threejs', 'reactthreefiber'],
  'Back End': [
    'node',
    'lambda',
    'serverless',
    'serverlessframework',
    'sls',
    'aws',
    'amazonwebservices',
    'amazoncognito',
  ],
}
