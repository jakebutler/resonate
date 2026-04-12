const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const REPO_OWNER = process.env.BLOG_REPO_OWNER!;
const REPO_NAME = process.env.BLOG_REPO_NAME!;
const BLOG_APP_ROOT = process.env.BLOG_APP_ROOT || "corvo-labs-enhanced";
const CONTENT_PATH =
  process.env.BLOG_CONTENT_PATH || `${BLOG_APP_ROOT}/content/blog`;
const IMAGE_PATH =
  process.env.BLOG_PUBLIC_IMAGE_PATH || `${BLOG_APP_ROOT}/public/images/blog`;
const DEFAULT_AUTHOR = process.env.BLOG_POST_AUTHOR?.trim() || "Jake Butler";
const DEFAULT_CATEGORY = process.env.BLOG_DEFAULT_CATEGORY?.trim() || "strategy";

export interface PublishImageAsset {
  sourceUrl: string;
  alt?: string;
  isCover?: boolean;
}

interface PreparedImageAsset {
  alt: string;
  content: string;
  fileName: string;
  filePath: string;
  isCover: boolean;
  localUrl: string;
  sourceUrl: string;
}

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function escapeYamlString(value: string): string {
  return value.replace(/\\/g, "\\\\").replace(/\n/g, "\\n").replace(/"/g, '\\"');
}

function clampText(value: string, maxLength: number): string {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
}

function stripMarkdown(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/`[^`]*`/g, " ")
    .replace(/!\[[^\]]*]\([^)]*\)/g, " ")
    .replace(/<BlogImage[\s\S]*?\/>/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/^[#>\-\*\d.\s]+/gm, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function estimateReadTime(markdown: string): string {
  const plainText = stripMarkdown(markdown);
  const words = plainText ? plainText.split(/\s+/).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));
  return `${minutes} min read`;
}

function buildExcerpt(markdown: string, explicitExcerpt?: string): string {
  if (explicitExcerpt?.trim()) {
    return clampText(explicitExcerpt, 180);
  }

  const firstParagraph = markdown
    .split(/\n{2,}/)
    .map((chunk) => stripMarkdown(chunk))
    .find(Boolean);

  return clampText(firstParagraph || "Published via Resonate.", 180);
}

function inferImageExtension(contentType: string | null, sourceUrl: string): string {
  const normalizedContentType = contentType?.split(";")[0].trim().toLowerCase();
  if (normalizedContentType === "image/webp") return "webp";
  if (normalizedContentType === "image/svg+xml") return "svg";
  if (normalizedContentType === "image/png") return "png";
  if (normalizedContentType === "image/jpeg") return "jpg";
  if (normalizedContentType === "image/gif") return "gif";

  try {
    const pathname = new URL(sourceUrl).pathname;
    const match = pathname.match(/\.([a-z0-9]+)$/i);
    if (match) {
      return match[1].toLowerCase();
    }
  } catch {
    // Ignore invalid URLs and fall back below.
  }

  return "webp";
}

function buildImageAlt(params: {
  alt?: string;
  isCover: boolean;
  title: string;
  index: number;
}): string {
  const explicitAlt = params.alt?.replace(/\s+/g, " ").trim();
  if (explicitAlt) return explicitAlt;
  if (params.isCover) return `Cover image for ${params.title}`;
  return `Inline figure ${params.index + 1} for ${params.title}`;
}

function createImageFileName(params: {
  alt: string;
  extension: string;
  isCover: boolean;
  index: number;
  usedNames: Set<string>;
}): string {
  const baseName = params.isCover
    ? "hero"
    : slugify(params.alt) || `figure-${params.index + 1}`;
  let candidate = `${baseName}.${params.extension}`;
  let suffix = 2;

  while (params.usedNames.has(candidate)) {
    candidate = `${baseName}-${suffix}.${params.extension}`;
    suffix += 1;
  }

  params.usedNames.add(candidate);
  return candidate;
}

function replaceMarkdownImages(
  markdown: string,
  assetsBySourceUrl: Map<string, PreparedImageAsset>
): string {
  return markdown.replace(/!\[(.*?)\]\((.*?)\)/g, (match, altText, rawTarget) => {
    const target = String(rawTarget).trim().replace(/^<|>$/g, "");
    const asset = assetsBySourceUrl.get(target);
    if (!asset) return match;

    const nextAlt = asset.alt || String(altText).trim();
    return [
      "<BlogImage",
      `  src="${asset.localUrl}"`,
      `  alt="${escapeYamlString(nextAlt)}"`,
      "/>",
    ].join("\n");
  });
}

function replaceHtmlImages(
  markdown: string,
  assetsBySourceUrl: Map<string, PreparedImageAsset>
): string {
  return markdown.replace(/<img\b[^>]*>/g, (tag) => {
    const srcMatch = tag.match(/\ssrc=["']([^"']+)["']/i);
    if (!srcMatch) return tag;
    const asset = assetsBySourceUrl.get(srcMatch[1]);
    if (!asset) return tag;

    const altMatch = tag.match(/\salt=["']([^"']*)["']/i);
    const nextAlt = asset.alt || altMatch?.[1]?.trim() || "";

    return [
      "<BlogImage",
      `  src="${asset.localUrl}"`,
      `  alt="${escapeYamlString(nextAlt)}"`,
      "/>",
    ].join("\n");
  });
}

function buildMdxBody(
  markdown: string,
  assetsBySourceUrl: Map<string, PreparedImageAsset>
): string {
  const withMarkdownImages = replaceMarkdownImages(markdown, assetsBySourceUrl);
  const withHtmlImages = replaceHtmlImages(withMarkdownImages, assetsBySourceUrl);
  return withHtmlImages.trimEnd() + "\n";
}

function buildFrontmatter(
  params: {
    title: string;
    date: string;
    subtitle?: string;
    excerpt: string;
    author: string;
    tags?: string[];
    coverImage: string;
    coverImageAlt: string;
    readTime: string;
    category: string;
    featured: boolean;
    published: boolean;
  }
): string {
  const lines = [
    `---`,
    `title: "${escapeYamlString(params.title)}"`,
    `date: "${escapeYamlString(params.date)}"`,
  ];
  if (params.subtitle?.trim()) {
    lines.push(`subtitle: "${escapeYamlString(params.subtitle.trim())}"`);
  }
  lines.push(`excerpt: "${escapeYamlString(params.excerpt)}"`);
  lines.push(`author: "${escapeYamlString(params.author)}"`);
  if (params.tags?.length) {
    lines.push(
      `tags: [${params.tags.map((tag) => `"${escapeYamlString(tag)}"`).join(", ")}]`
    );
  } else {
    lines.push(`tags: []`);
  }
  lines.push(`coverImage: "${escapeYamlString(params.coverImage)}"`);
  lines.push(`coverImageAlt: "${escapeYamlString(params.coverImageAlt)}"`);
  lines.push(`readTime: "${escapeYamlString(params.readTime)}"`);
  lines.push(`category: "${escapeYamlString(params.category)}"`);
  lines.push(`featured: ${params.featured ? "true" : "false"}`);
  lines.push(`published: ${params.published ? "true" : "false"}`);
  lines.push(`---`, ``);
  return lines.join("\n") + "\n";
}

export async function createBlogPostPR(params: {
  title: string;
  content: string;
  scheduledDate: string;
  status: string;
  subtitle?: string;
  excerpt?: string;
  author?: string;
  tags?: string[];
  category?: string;
  featured?: boolean;
  coverImageAlt?: string;
  images?: PublishImageAsset[];
}): Promise<{ prUrl: string; branchName: string }> {
  const date = params.scheduledDate || new Date().toISOString().split("T")[0];
  const slug = `${date}-${slugify(params.title)}`;
  const fileName = `${slug}.mdx`;
  const filePath = `${CONTENT_PATH}/${fileName}`;
  const branchName = `resonate/blog-post-${slug}`;

  const headers = {
    Authorization: `Bearer ${GITHUB_TOKEN}`,
    "Content-Type": "application/json",
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Get default branch SHA
  const repoRes = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}`,
    { headers }
  );
  if (!repoRes.ok) throw new Error(`GitHub repo fetch failed: ${repoRes.status}`);
  const repoData = await repoRes.json();
  const defaultBranch = repoData.default_branch;

  const branchRes = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/ref/heads/${defaultBranch}`,
    { headers }
  );
  if (!branchRes.ok) throw new Error(`GitHub branch fetch failed: ${branchRes.status}`);
  const branchData = await branchRes.json();
  const sha = branchData.object.sha;

  // Create branch
  const createBranchRes = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/git/refs`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({ ref: `refs/heads/${branchName}`, sha }),
    }
  );
  if (!createBranchRes.ok) {
    const err = await createBranchRes.json();
    throw new Error(`GitHub create branch failed: ${JSON.stringify(err)}`);
  }

  const preparedAssets: PreparedImageAsset[] = [];
  const usedFileNames = new Set<string>();
  const coverSource =
    params.images?.find((asset) => asset.isCover) ?? params.images?.[0];

  if (!coverSource) {
    throw new Error(
      "Publishing requires at least one image so the PR can commit a local cover image."
    );
  }

  for (const [index, asset] of (params.images ?? []).entries()) {
    const response = await fetch(asset.sourceUrl);
    if (!response.ok) {
      throw new Error(`Failed to download image asset: ${response.status}`);
    }

    const extension = inferImageExtension(
      response.headers.get("content-type"),
      asset.sourceUrl
    );
    const alt = buildImageAlt({
      alt: asset.alt,
      isCover: coverSource.sourceUrl === asset.sourceUrl,
      title: params.title,
      index,
    });
    const fileName = createImageFileName({
      alt,
      extension,
      isCover: coverSource.sourceUrl === asset.sourceUrl,
      index,
      usedNames: usedFileNames,
    });
    const localUrl = `/images/blog/${slug}/${fileName}`;
    const repoPath = `${IMAGE_PATH}/${slug}/${fileName}`;
    const arrayBuffer = await response.arrayBuffer();

    preparedAssets.push({
      alt,
      content: Buffer.from(arrayBuffer).toString("base64"),
      fileName,
      filePath: repoPath,
      isCover: coverSource.sourceUrl === asset.sourceUrl,
      localUrl,
      sourceUrl: asset.sourceUrl,
    });
  }

  const assetsBySourceUrl = new Map(
    preparedAssets.map((asset) => [asset.sourceUrl, asset] as const)
  );
  const coverImage = preparedAssets.find((asset) => asset.isCover);

  if (!coverImage) {
    throw new Error("Publishing requires a cover image asset.");
  }

  const frontmatter = buildFrontmatter({
    title: params.title,
    date,
    subtitle: params.subtitle,
    excerpt: buildExcerpt(params.content, params.excerpt),
    author: params.author?.trim() || DEFAULT_AUTHOR,
    tags: params.tags,
    coverImage: coverImage.localUrl,
    coverImageAlt:
      params.coverImageAlt?.trim() || coverImage.alt || `Cover image for ${params.title}`,
    readTime: estimateReadTime(params.content),
    category: params.category?.trim() || DEFAULT_CATEGORY,
    featured: params.featured ?? false,
    published: true,
  });
  const mdxBody = buildMdxBody(params.content, assetsBySourceUrl);
  const fileContent = Buffer.from(frontmatter + mdxBody).toString("base64");

  for (const asset of preparedAssets) {
    const createAssetRes = await fetch(
      `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${asset.filePath}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify({
          message: `feat: add blog image "${asset.fileName}"`,
          content: asset.content,
          branch: branchName,
        }),
      }
    );

    if (!createAssetRes.ok) {
      const err = await createAssetRes.json();
      throw new Error(`GitHub create asset failed: ${JSON.stringify(err)}`);
    }
  }

  const createFileRes = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents/${filePath}`,
    {
      method: "PUT",
      headers,
      body: JSON.stringify({
        message: `feat: add blog post "${params.title}"`,
        content: fileContent,
        branch: branchName,
      }),
    }
  );
  if (!createFileRes.ok) {
    const err = await createFileRes.json();
    throw new Error(`GitHub create file failed: ${JSON.stringify(err)}`);
  }

  // Open PR
  const prRes = await fetch(
    `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/pulls`,
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        title: `Blog post: ${params.title}`,
        body: [
          "Publish intent: merge to publish on corvo-labs-dot-com.",
          `Resonate run date: ${date}.`,
          "Vercel preview: pending manual review, if applicable.",
        ].join("\n"),
        head: branchName,
        base: defaultBranch,
      }),
    }
  );
  if (!prRes.ok) {
    const err = await prRes.json();
    throw new Error(`GitHub create PR failed: ${JSON.stringify(err)}`);
  }
  const prData = await prRes.json();

  return { prUrl: prData.html_url, branchName };
}
