import { NextRequest, NextResponse } from "next/server";
import { createBlogPostPR } from "@/lib/github";
import { auth } from "@clerk/nextjs/server";

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((entry) => typeof entry === "string");
}

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const {
    title,
    content,
    scheduledDate,
    status,
    heroImage,
    heroImageUrl,
    tags,
    description,
  } = body;

  if (!title || !content) {
    return NextResponse.json({ error: "title and content are required" }, { status: 400 });
  }

  if (
    (heroImage !== undefined && typeof heroImage !== "string") ||
    (heroImageUrl !== undefined && typeof heroImageUrl !== "string") ||
    (tags !== undefined && !isStringArray(tags)) ||
    (description !== undefined && typeof description !== "string")
  ) {
    return NextResponse.json(
      { error: "Optional publish metadata must be strings or string arrays." },
      { status: 400 }
    );
  }

  try {
    const result = await createBlogPostPR({
      title,
      content,
      scheduledDate,
      status,
      heroImage: heroImageUrl ?? heroImage,
      tags,
      description,
    });
    return NextResponse.json({ prUrl: result.prUrl, branchName: result.branchName });
  } catch (err) {
    console.error("GitHub publish error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Publish failed" },
      { status: 500 }
    );
  }
}
