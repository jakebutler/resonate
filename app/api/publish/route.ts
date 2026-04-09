import { NextRequest, NextResponse } from "next/server";
import { createBlogPostPR } from "@/lib/github";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const { userId } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, content, scheduledDate, status, heroImage, tags, description } = await req.json();

  if (!title || !content) {
    return NextResponse.json({ error: "title and content are required" }, { status: 400 });
  }

  try {
    const result = await createBlogPostPR({ title, content, scheduledDate, status, heroImage, tags, description });
    return NextResponse.json({ prUrl: result.prUrl, branchName: result.branchName });
  } catch (err) {
    console.error("GitHub publish error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Publish failed" },
      { status: 500 }
    );
  }
}
