export const ui = {
  nav: {
    posts: 'Posts',
    projects: 'Projects',
    logoAlt: 'James Miller Logo',
    searchLabel: 'Search',
    toggleTheme: 'Toggle theme',
    toggleMenu: 'Toggle menu',
  },

  footer: {
    copyright: (year: number) => `© ${year} James Miller`,
    social: {
      twitter: 'X (Twitter)',
      github: 'GitHub',
      linkedin: 'LinkedIn',
      rss: 'RSS feed',
    },
  },

  home: {
    wordPosts: {
      postsAbout: (word: string) => `Posts about ${word}`,
    },
    tagCloud: {
      heading: 'What are you curious about?',
    },
    postGrid: {
      empty: 'No articles found for the selected tag.',
      prev: '← Prev',
      next: 'Next →',
    },
  },

  posts: {
    backToBlog: 'Back to blog',
    published: 'Published',
  },

  projects: {
    heading: "Things I've",
    description:
      'A decade of products and experiments across web, AI, extended reality, and connected hardware.',
    empty: 'No projects found for the selected category.',
  },

  notFound: {
    code: '404',
    heading: 'Oops! Page not found',
    description:
      'The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.',
    backHome: 'Go back to Homepage',
  },
} as const
