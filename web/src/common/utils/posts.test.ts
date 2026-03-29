/**
 * Tests for src/common/utils/posts.ts
 *
 * Strategy: spy on `fs` methods and mock `gray-matter` so tests are fast
 * and hermetic — no real disk access, no dependency on the actual _posts dir.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs";
import matter from "gray-matter";

vi.mock("@aws-sdk/client-s3", () => ({
  S3Client: vi.fn(() => ({ send: vi.fn() })),
  ListObjectsV2Command: vi.fn(),
  GetObjectCommand: vi.fn(),
}));
vi.mock("gray-matter");
const mockedMatter = vi.mocked(matter);

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeFrontmatter(overrides: Record<string, unknown> = {}) {
  return {
    title: "Test Post",
    date: "2024-01-01",
    coverImage: "/images/cover.jpg",
    author: { name: "James Miller", picture: "/assets/james.jpeg" },
    excerpt: "A test excerpt.",
    ogImage: { url: "/images/cover.jpg" },
    tags: ["aws", "serverless"],
    ...overrides,
  };
}

function setupFsMocks({
  files = [] as string[],
  exists = true,
  fileContent = "raw",
}) {
  vi.spyOn(fs, "readdirSync").mockReturnValue(files as any);
  vi.spyOn(fs, "existsSync").mockReturnValue(exists);
  vi.spyOn(fs, "readFileSync").mockReturnValue(fileContent as any);
}

function setupMatterMocks(posts: Array<{ fm: ReturnType<typeof makeFrontmatter> }>) {
  let callCount = 0;
  mockedMatter.mockImplementation(() => {
    const post = posts[callCount++];
    return { data: post.fm, content: "body" } as unknown as ReturnType<typeof matter>;
  });
}

// ---------------------------------------------------------------------------
// getPostSlugs
// ---------------------------------------------------------------------------

describe("getPostSlugs", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("returns the list of filenames from the _posts directory", async () => {
    setupFsMocks({ files: ["hello-world.mdx", "second-post.mdx"] });
    const { getPostSlugs } = await import("./posts");
    expect(await getPostSlugs()).toEqual(["hello-world.mdx", "second-post.mdx"]);
  });

  it("returns an empty array when the directory is empty", async () => {
    setupFsMocks({ files: [] });
    const { getPostSlugs } = await import("./posts");
    expect(await getPostSlugs()).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// getPostBySlug
// ---------------------------------------------------------------------------

describe("getPostBySlug", () => {
  beforeEach(() => vi.restoreAllMocks());

  it("strips the .mdx extension from the slug", async () => {
    setupFsMocks({ files: [], exists: true });
    mockedMatter.mockReturnValue({ data: makeFrontmatter(), content: "body" } as any);
    const { getPostBySlug } = await import("./posts");
    expect((await getPostBySlug("hello-world.mdx")).slug).toBe("hello-world");
  });

  it("strips the .md extension from the slug", async () => {
    setupFsMocks({ files: [], exists: true });
    mockedMatter.mockReturnValue({ data: makeFrontmatter(), content: "body" } as any);
    const { getPostBySlug } = await import("./posts");
    expect((await getPostBySlug("hello-world.md")).slug).toBe("hello-world");
  });

  it("prefers the .mdx file when .mdx exists", async () => {
    setupFsMocks({ files: [], exists: true });
    mockedMatter.mockReturnValue({ data: makeFrontmatter({ title: "MDX Post" }), content: "body" } as any);
    const { getPostBySlug } = await import("./posts");
    const post = await getPostBySlug("hello-world");
    expect(post.title).toBe("MDX Post");
    const readPath = vi.mocked(fs.readFileSync).mock.calls[0][0] as string;
    expect(readPath).toMatch(/\.mdx$/);
  });

  it("falls back to .md when no .mdx file exists", async () => {
    setupFsMocks({ files: [], exists: false });
    mockedMatter.mockReturnValue({ data: makeFrontmatter({ title: "MD Post" }), content: "body" } as any);
    const { getPostBySlug } = await import("./posts");
    const post = await getPostBySlug("hello-world");
    expect(post.title).toBe("MD Post");
    const readPath = vi.mocked(fs.readFileSync).mock.calls[0][0] as string;
    expect(readPath).toMatch(/\.md$/);
  });

  it("returns all expected Post fields", async () => {
    setupFsMocks({ files: [], exists: true });
    mockedMatter.mockReturnValue({
      data: makeFrontmatter({ title: "Deep Dive", date: "2023-06-15", tags: ["serverless"] }),
      content: "# Intro\nBody.",
    } as any);
    const { getPostBySlug } = await import("./posts");
    const post = await getPostBySlug("deep-dive");
    expect(post.slug).toBe("deep-dive");
    expect(post.title).toBe("Deep Dive");
    expect(post.date).toBe("2023-06-15");
    expect(post.tags).toEqual(["serverless"]);
    expect(post.content).toBe("# Intro\nBody.");
  });
});

// ---------------------------------------------------------------------------
// getAllPosts — draft filtering
// ---------------------------------------------------------------------------

describe("getAllPosts — draft filtering by NODE_ENV", () => {
  beforeEach(() => vi.restoreAllMocks());
  afterEach(() => vi.unstubAllEnvs());

  it("excludes draft posts in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const posts = [
      { slug: "published", fm: makeFrontmatter({ title: "Published", date: "2024-01-02", draft: false }) },
      { slug: "draft-post", fm: makeFrontmatter({ title: "Draft", date: "2024-01-01", draft: true }) },
    ];
    setupFsMocks({ files: posts.map((p) => `${p.slug}.mdx`), exists: true });
    setupMatterMocks(posts);

    const { getAllPosts } = await import("./posts");
    const result = await getAllPosts();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("published");
  });

  it("includes draft posts in development", async () => {
    vi.stubEnv("NODE_ENV", "development");
    const posts = [
      { slug: "published", fm: makeFrontmatter({ title: "Published", date: "2024-01-02", draft: false }) },
      { slug: "draft-post", fm: makeFrontmatter({ title: "Draft", date: "2024-01-01", draft: true }) },
    ];
    setupFsMocks({ files: posts.map((p) => `${p.slug}.mdx`), exists: true });
    setupMatterMocks(posts);

    const { getAllPosts } = await import("./posts");
    expect(await getAllPosts()).toHaveLength(2);
  });

  it("treats missing draft field as published", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const posts = [{ slug: "no-draft", fm: makeFrontmatter({ title: "No draft field", date: "2024-01-01" }) }];
    setupFsMocks({ files: ["no-draft.mdx"], exists: true });
    setupMatterMocks(posts);

    const { getAllPosts } = await import("./posts");
    const result = await getAllPosts();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("no-draft");
  });

  it("returns empty array when all posts are drafts in production", async () => {
    vi.stubEnv("NODE_ENV", "production");
    const posts = [
      { slug: "draft-a", fm: makeFrontmatter({ title: "Draft A", date: "2024-01-01", draft: true }) },
      { slug: "draft-b", fm: makeFrontmatter({ title: "Draft B", date: "2024-01-02", draft: true }) },
    ];
    setupFsMocks({ files: posts.map((p) => `${p.slug}.mdx`), exists: true });
    setupMatterMocks(posts);

    const { getAllPosts } = await import("./posts");
    expect(await getAllPosts()).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// getAllPosts — date sorting
// ---------------------------------------------------------------------------

describe("getAllPosts — sorting by date (newest first)", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubEnv("NODE_ENV", "production");
  });
  afterEach(() => vi.unstubAllEnvs());

  it("returns posts sorted newest → oldest", async () => {
    const posts = [
      { slug: "oldest", fm: makeFrontmatter({ date: "2021-06-01", draft: false }) },
      { slug: "newest", fm: makeFrontmatter({ date: "2024-03-15", draft: false }) },
      { slug: "middle", fm: makeFrontmatter({ date: "2023-01-10", draft: false }) },
    ];
    setupFsMocks({ files: posts.map((p) => `${p.slug}.mdx`), exists: true });
    setupMatterMocks(posts);

    const { getAllPosts } = await import("./posts");
    expect((await getAllPosts()).map((p) => p.slug)).toEqual(["newest", "middle", "oldest"]);
  });

  it("handles posts with the same date without throwing", async () => {
    const posts = [
      { slug: "post-a", fm: makeFrontmatter({ date: "2024-01-01", draft: false }) },
      { slug: "post-b", fm: makeFrontmatter({ date: "2024-01-01", draft: false }) },
    ];
    setupFsMocks({ files: posts.map((p) => `${p.slug}.mdx`), exists: true });
    setupMatterMocks(posts);

    const { getAllPosts } = await import("./posts");
    expect(await getAllPosts()).toHaveLength(2);
  });

  it("returns a single post without error", async () => {
    const posts = [{ slug: "only-post", fm: makeFrontmatter({ date: "2024-01-01", draft: false }) }];
    setupFsMocks({ files: ["only-post.mdx"], exists: true });
    setupMatterMocks(posts);

    const { getAllPosts } = await import("./posts");
    const result = await getAllPosts();
    expect(result).toHaveLength(1);
    expect(result[0].slug).toBe("only-post");
  });
});
