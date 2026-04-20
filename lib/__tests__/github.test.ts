// @vitest-environment node
import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from "vitest";

let createBlogPostPR: (typeof import("@/lib/github"))["createBlogPostPR"];

beforeAll(async () => {
  process.env.GITHUB_TOKEN = "test_token";
  process.env.BLOG_REPO_OWNER = "test-owner";
  process.env.BLOG_REPO_NAME = "test-repo";
  delete process.env.BLOG_CONTENT_PATH;
  delete process.env.BLOG_PUBLIC_IMAGE_PATH;
  delete process.env.BLOG_APP_ROOT;
  vi.resetModules();
  const mod = await import("@/lib/github");
  createBlogPostPR = mod.createBlogPostPR;
});

function mockImageDownload(url: string, contentType = "image/webp") {
  return new Response(Uint8Array.from([1, 2, 3]), {
    status: 200,
    headers: {
      "content-type": contentType,
      "x-test-url": url,
    },
  });
}

function mockGitHubSuccess(options?: {
  imageResponses?: Response[];
  prUrl?: string;
}) {
  const imageResponses = options?.imageResponses ?? [mockImageDownload("https://cdn.example.com/hero.webp")];

  vi.mocked(fetch)
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ default_branch: "main" }), { status: 200 })
    )
    .mockResolvedValueOnce(
      new Response(JSON.stringify({ object: { sha: "abc123" } }), { status: 200 })
    )
    .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }));

  for (const imageResponse of imageResponses) {
    vi.mocked(fetch).mockResolvedValueOnce(imageResponse);
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({}), { status: 200 })
    );
  }

  vi.mocked(fetch)
    .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
    .mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          html_url: options?.prUrl ?? "https://github.com/org/repo/pull/1",
        }),
        { status: 200 }
      )
    );
}

describe("createBlogPostPR", () => {
  beforeEach(() => {
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns prUrl and branchName on success", async () => {
    mockGitHubSuccess({ prUrl: "https://github.com/org/repo/pull/42" });

    const result = await createBlogPostPR({
      title: "Hello World",
      content: "Body",
      scheduledDate: "2026-03-04",
      status: "published",
      images: [{ sourceUrl: "https://cdn.example.com/hero.webp", isCover: true }],
    });

    expect(result.prUrl).toBe("https://github.com/org/repo/pull/42");
    expect(result.branchName).toBe("resonate/blog-post-2026-03-04-hello-world");
  });

  it("writes repo-compatible frontmatter and MDX image components", async () => {
    mockGitHubSuccess();

    await createBlogPostPR({
      title: 'He said "hello"',
      content:
        'Intro paragraph.\n\n![System overview](https://cdn.example.com/hero.webp)\n',
      scheduledDate: "2026-03-04",
      status: "published",
      subtitle: "A subtitle",
      excerpt: 'Line one\nLine "two"',
      author: "Jake Butler",
      tags: ["ai", 'quote "heavy"'],
      category: "strategy",
      featured: true,
      coverImageAlt: "A descriptive hero image.",
      images: [
        {
          sourceUrl: "https://cdn.example.com/hero.webp",
          alt: "System overview",
          isCover: true,
        },
      ],
    });

    const assetCall = vi.mocked(fetch).mock.calls[4];
    expect(assetCall[0]).toContain(
      "/contents/corvo-labs-enhanced/public/images/blog/2026-03-04-he-said-hello/hero.webp"
    );

    const mdxCall = vi.mocked(fetch).mock.calls[5];
    expect(mdxCall[0]).toContain(
      "/contents/corvo-labs-enhanced/content/blog/2026-03-04-he-said-hello.mdx"
    );

    const body = JSON.parse((mdxCall[1] as RequestInit).body as string);
    const decoded = Buffer.from(body.content, "base64").toString("utf-8");

    expect(decoded).toContain('title: "He said \\"hello\\""');
    expect(decoded).toContain('date: "2026-03-04"');
    expect(decoded).toContain('subtitle: "A subtitle"');
    expect(decoded).toContain('excerpt: "Line one Line \\"two\\""');
    expect(decoded).toContain('author: "Jake Butler"');
    expect(decoded).toContain('tags: ["ai", "quote \\"heavy\\""]');
    expect(decoded).toContain(
      'coverImage: "/images/blog/2026-03-04-he-said-hello/hero.webp"'
    );
    expect(decoded).toContain('coverImageAlt: "A descriptive hero image."');
    expect(decoded).toContain('readTime: "1 min read"');
    expect(decoded).toContain('category: "strategy"');
    expect(decoded).toContain("featured: true");
    expect(decoded).toContain("published: true");
    expect(decoded).toContain('<BlogImage\n  src="/images/blog/2026-03-04-he-said-hello/hero.webp"');
    expect(decoded).toContain('  alt="System overview"');
    expect(decoded).not.toContain("https://cdn.example.com/hero.webp");
  });

  it("includes publish intent and preview note in the PR description", async () => {
    mockGitHubSuccess();

    await createBlogPostPR({
      title: "Hello World",
      content: "Body",
      scheduledDate: "2026-03-04",
      status: "published",
      images: [{ sourceUrl: "https://cdn.example.com/hero.webp", isCover: true }],
    });

    const prCall = vi.mocked(fetch).mock.calls[6];
    const payload = JSON.parse((prCall[1] as RequestInit).body as string);

    expect(payload.body).toContain(
      "Publish intent: merge to publish on corvo-labs-dot-com."
    );
    expect(payload.body).toContain("Resonate run date: 2026-03-04.");
    expect(payload.body).toContain(
      "Vercel preview: pending manual review, if applicable."
    );
  });

  it("throws before contacting GitHub when no image assets are provided", async () => {
    await expect(
      createBlogPostPR({
        title: "Hello World",
        content: "Body",
        scheduledDate: "2026-03-04",
        status: "published",
      })
    ).rejects.toThrow(/requires at least one image/i);

    // Validation must happen up front so we never leave an orphaned remote
    // branch behind when the caller hasn't supplied any image assets.
    expect(fetch).not.toHaveBeenCalled();
  });

  it("throws before contacting GitHub when images is an empty array", async () => {
    await expect(
      createBlogPostPR({
        title: "Hello World",
        content: "Body",
        scheduledDate: "2026-03-04",
        status: "published",
        images: [],
      })
    ).rejects.toThrow(/requires at least one image/i);

    expect(fetch).not.toHaveBeenCalled();
  });

  it("throws when repo fetch fails", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(new Response("", { status: 404 }));

    await expect(
      createBlogPostPR({
        title: "T",
        content: "x",
        scheduledDate: "2026-03-04",
        status: "published",
        images: [{ sourceUrl: "https://cdn.example.com/hero.webp", isCover: true }],
      })
    ).rejects.toThrow("GitHub repo fetch failed");
  });

  it("throws when branch ref fetch fails", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ default_branch: "main" }), { status: 200 })
      )
      .mockResolvedValueOnce(new Response("", { status: 404 }));

    await expect(
      createBlogPostPR({
        title: "T",
        content: "x",
        scheduledDate: "2026-03-04",
        status: "published",
        images: [{ sourceUrl: "https://cdn.example.com/hero.webp", isCover: true }],
      })
    ).rejects.toThrow("GitHub branch fetch failed");
  });

  it("throws when create branch fails", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ default_branch: "main" }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ object: { sha: "abc" } }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "already exists" }), { status: 422 })
      );

    await expect(
      createBlogPostPR({
        title: "T",
        content: "x",
        scheduledDate: "2026-03-04",
        status: "published",
        images: [{ sourceUrl: "https://cdn.example.com/hero.webp", isCover: true }],
      })
    ).rejects.toThrow("GitHub create branch failed");
  });

  it("throws when create asset fails", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ default_branch: "main" }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ object: { sha: "abc" } }), { status: 200 })
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
      .mockResolvedValueOnce(mockImageDownload("https://cdn.example.com/hero.webp"))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "conflict" }), { status: 409 })
      );

    await expect(
      createBlogPostPR({
        title: "T",
        content: "x",
        scheduledDate: "2026-03-04",
        status: "published",
        images: [{ sourceUrl: "https://cdn.example.com/hero.webp", isCover: true }],
      })
    ).rejects.toThrow("GitHub create asset failed");
  });

  it("throws when create file fails", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ default_branch: "main" }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ object: { sha: "abc" } }), { status: 200 })
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
      .mockResolvedValueOnce(mockImageDownload("https://cdn.example.com/hero.webp"))
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "conflict" }), { status: 409 })
      );

    await expect(
      createBlogPostPR({
        title: "T",
        content: "x",
        scheduledDate: "2026-03-04",
        status: "published",
        images: [{ sourceUrl: "https://cdn.example.com/hero.webp", isCover: true }],
      })
    ).rejects.toThrow("GitHub create file failed");
  });

  it("throws when create PR fails", async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ default_branch: "main" }), { status: 200 })
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ object: { sha: "abc" } }), { status: 200 })
      )
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
      .mockResolvedValueOnce(mockImageDownload("https://cdn.example.com/hero.webp"))
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({}), { status: 200 }))
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ message: "error" }), { status: 500 })
      );

    await expect(
      createBlogPostPR({
        title: "T",
        content: "x",
        scheduledDate: "2026-03-04",
        status: "published",
        images: [{ sourceUrl: "https://cdn.example.com/hero.webp", isCover: true }],
      })
    ).rejects.toThrow("GitHub create PR failed");
  });
});
