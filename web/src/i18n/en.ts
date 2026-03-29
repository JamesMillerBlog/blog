export const ui = {
  nav: {
    play: "Play",
    work: "Work",
    hard: "Hard",
    logoAlt: "James Miller Logo",
    searchLabel: "Search",
    toggleTheme: "Toggle theme",
    toggleMenu: "Toggle menu",
  },

  footer: {
    copyright: (year: number) => `© ${year} James Miller`,
    social: {
      twitter: "X (Twitter)",
      github: "GitHub",
      linkedin: "LinkedIn",
      rss: "RSS feed",
    },
  },

  home: {
    hero: {
      badge: "HELLO, WORLD",
      heading: "I'm James Miller.",
      body: {
        intro: "This blog is a space for",
        explore: "exploration of",
        midText: "- ideas, experiments, and thinking on how to",
        thenText: ", then",
        andText: "and",
        creative: "creative",
        technology: "technology",
        solveProblems: "solve problems",
        ship: "ship",
        products: "products",
        build: "build",
        experiences: "experiences",
      },
    },
    featuredPosts: {
      badge: "Featured",
      secondaryBadges: ["Thought", "Guide"] as const,
    },
    tagCloud: {
      heading: "Explore Topics",
      subheading: "Filter by what you're curious about",
    },
    postGrid: {
      empty: "No articles found for the selected tag.",
      prev: "← Prev",
      next: "Next →",
    },
  },

  posts: {
    backToBlog: "Back to blog",
    published: "Published",
  },

  projects: {
    heading: "Built &",
    headingEmphasis: "Shipped",
    description:
      "Over ten years of building products and experiences, each one powered by the technology that made it possible.",
    empty: "No projects found for the selected category.",
  },

  notFound: {
    code: "404",
    heading: "Oops! Page not found",
    description:
      "The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.",
    backHome: "Go back to Homepage",
  },
} as const;
