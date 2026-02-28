const GITHUB_TOKEN = process.env.GITHUB_TOKEN!;
const REPO_OWNER = process.env.BLOG_REPO_OWNER!;
const REPO_NAME = process.env.BLOG_REPO_NAME!;
const CONTENT_PATH = process.env.BLOG_CONTENT_PATH || "content/posts";

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function buildFrontmatter(title: string, date: string, status: string): string {
  return `---\ntitle: "${title}"\ndate: "${date}"\nstatus: "${status}"\n---\n\n`;
}

export async function createBlogPostPR(params: {
  title: string;
  content: string;
  scheduledDate: string;
  status: string;
}): Promise<{ prUrl: string; branchName: string }> {
  const slug = slugify(params.title);
  const date = params.scheduledDate || new Date().toISOString().split("T")[0];
  const fileName = `${date}-${slug}.mdx`;
  const filePath = `${CONTENT_PATH}/${fileName}`;
  const branchName = `resonate/blog-post-${date}-${slug}`;

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

  // Create file
  const frontmatter = buildFrontmatter(params.title, date, params.status);
  const fileContent = Buffer.from(frontmatter + params.content).toString("base64");

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
        body: `Published via Resonate on ${date}.`,
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
