import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Doc, Id } from "./_generated/dataModel";

type IdeaStatus = Doc<"ideas">["status"];

function buildIdeaPreview(content: string, maxLength = 140) {
  const trimmed = content.trim();
  if (trimmed.length <= maxLength) return trimmed;
  return `${trimmed.slice(0, maxLength)}…`;
}

function deriveSourceDomain(url?: string) {
  if (!url) return undefined;
  try {
    return new URL(url).hostname.toLowerCase();
  } catch {
    return undefined;
  }
}

async function requireUserId(ctx: { auth: { getUserIdentity: () => Promise<{ subject: string } | null> } }) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthorized");
  }
  return identity.subject;
}

async function requireOwnedIdea(
  ctx: { db: { get: (id: Id<"ideas">) => Promise<Doc<"ideas"> | null> } },
  ideaId: Id<"ideas">,
  userId: string
) {
  const idea = await ctx.db.get(ideaId);
  if (!idea || idea.userId !== userId) {
    throw new Error("Idea not found");
  }
  return idea;
}

export const list = query({
  args: {
    status: v.optional(
      v.union(
        v.literal("inbox"),
        v.literal("reviewing"),
        v.literal("ready"),
        v.literal("used"),
        v.literal("archived")
      )
    ),
    search: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const searchTerm = args.search?.trim().toLowerCase();

    const ideas = args.status
      ? await ctx.db
          .query("ideas")
          .withIndex("by_user_and_status", (q) =>
            q.eq("userId", userId).eq("status", args.status!)
          )
          .collect()
      : await ctx.db.query("ideas").withIndex("by_user", (q) => q.eq("userId", userId)).collect();

    return ideas
      .filter((idea) => {
        if (!args.status && idea.status === "archived") return false;
        if (!searchTerm) return true;

        const haystack = [
          idea.latestEntryPreview,
          idea.sourceTitle,
          idea.sourceDomain,
          idea.sourceUrl,
          ...idea.tags,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return haystack.includes(searchTerm);
      })
      .sort((a, b) => b.lastCapturedAt - a.lastCapturedAt);
  },
});

export const getById = query({
  args: { id: v.id("ideas") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const idea = await requireOwnedIdea(ctx, args.id, userId);
    const entries = await ctx.db
      .query("ideaEntries")
      .withIndex("by_idea", (q) => q.eq("ideaId", args.id))
      .collect();
    const postLinks = await ctx.db
      .query("ideaPostLinks")
      .withIndex("by_idea", (q) => q.eq("ideaId", args.id))
      .collect();

    return {
      ...idea,
      entries: entries.sort((a, b) => a.createdAt - b.createdAt),
      postLinks,
    };
  },
});

export const findByNormalizedSourceUrl = query({
  args: { normalizedSourceUrl: v.string() },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const ideas = await ctx.db
      .query("ideas")
      .withIndex("by_user_and_source", (q) =>
        q.eq("userId", userId).eq("normalizedSourceUrl", args.normalizedSourceUrl)
      )
      .collect();

    return ideas.sort((a, b) => b.lastCapturedAt - a.lastCapturedAt);
  },
});

export const create = mutation({
  args: {
    content: v.string(),
    tags: v.optional(v.array(v.string())),
    sourceUrl: v.optional(v.string()),
    normalizedSourceUrl: v.optional(v.string()),
    sourceTitle: v.optional(v.string()),
    sourceDomain: v.optional(v.string()),
    captureChannel: v.optional(
      v.union(
        v.literal("web"),
        v.literal("extension"),
        v.literal("ios_share")
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const now = Date.now();
    const preview = buildIdeaPreview(args.content);

    const ideaId = await ctx.db.insert("ideas", {
      userId,
      status: "inbox",
      tags: args.tags ?? [],
      sourceUrl: args.sourceUrl,
      normalizedSourceUrl: args.normalizedSourceUrl,
      sourceTitle: args.sourceTitle,
      sourceDomain: args.sourceDomain ?? deriveSourceDomain(args.normalizedSourceUrl ?? args.sourceUrl),
      latestEntryPreview: preview,
      lastCapturedAt: now,
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("ideaEntries", {
      ideaId,
      userId,
      content: args.content,
      captureChannel: args.captureChannel ?? "web",
      createdAt: now,
    });

    return ideaId;
  },
});

export const appendEntry = mutation({
  args: {
    ideaId: v.id("ideas"),
    content: v.string(),
    captureChannel: v.optional(
      v.union(
        v.literal("web"),
        v.literal("extension"),
        v.literal("ios_share")
      )
    ),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await requireOwnedIdea(ctx, args.ideaId, userId);
    const now = Date.now();

    const entryId = await ctx.db.insert("ideaEntries", {
      ideaId: args.ideaId,
      userId,
      content: args.content,
      captureChannel: args.captureChannel ?? "web",
      createdAt: now,
    });

    await ctx.db.patch(args.ideaId, {
      latestEntryPreview: buildIdeaPreview(args.content),
      lastCapturedAt: now,
      updatedAt: now,
    });

    return entryId;
  },
});

export const updateMeta = mutation({
  args: {
    id: v.id("ideas"),
    status: v.optional(
      v.union(
        v.literal("inbox"),
        v.literal("reviewing"),
        v.literal("ready"),
        v.literal("used"),
        v.literal("archived")
      )
    ),
    tags: v.optional(v.array(v.string())),
    sourceUrl: v.optional(v.union(v.string(), v.null())),
    normalizedSourceUrl: v.optional(v.union(v.string(), v.null())),
    sourceTitle: v.optional(v.union(v.string(), v.null())),
    sourceDomain: v.optional(v.union(v.string(), v.null())),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    const existing = await requireOwnedIdea(ctx, args.id, userId);

    const status = args.status ?? existing.status;
    const patch: Partial<Doc<"ideas">> = {
      updatedAt: Date.now(),
      status,
    };

    if (args.tags !== undefined) patch.tags = args.tags;
    if (args.sourceUrl !== undefined) patch.sourceUrl = args.sourceUrl ?? undefined;
    if (args.normalizedSourceUrl !== undefined) {
      patch.normalizedSourceUrl = args.normalizedSourceUrl ?? undefined;
    }
    if (args.sourceTitle !== undefined) patch.sourceTitle = args.sourceTitle ?? undefined;
    if (args.sourceDomain !== undefined) {
      patch.sourceDomain =
        args.sourceDomain ?? deriveSourceDomain(args.normalizedSourceUrl ?? args.sourceUrl ?? existing.sourceUrl);
    }

    if (status === "archived") {
      patch.archivedAt = existing.archivedAt ?? Date.now();
    } else {
      patch.archivedAt = undefined;
    }

    await ctx.db.patch(args.id, patch);
  },
});

export const archive = mutation({
  args: { id: v.id("ideas") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await requireOwnedIdea(ctx, args.id, userId);
    await ctx.db.patch(args.id, {
      status: "archived" satisfies IdeaStatus,
      archivedAt: Date.now(),
      updatedAt: Date.now(),
    });
  },
});

export const remove = mutation({
  args: { id: v.id("ideas") },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await requireOwnedIdea(ctx, args.id, userId);

    const links = await ctx.db
      .query("ideaPostLinks")
      .withIndex("by_idea", (q) => q.eq("ideaId", args.id))
      .collect();
    if (links.length > 0) {
      throw new Error("Ideas with linked posts must be archived instead of deleted");
    }

    const entries = await ctx.db
      .query("ideaEntries")
      .withIndex("by_idea", (q) => q.eq("ideaId", args.id))
      .collect();

    await Promise.all(entries.map((entry) => ctx.db.delete(entry._id)));
    await ctx.db.delete(args.id);
  },
});

export const linkPost = mutation({
  args: {
    ideaId: v.id("ideas"),
    postId: v.id("posts"),
  },
  handler: async (ctx, args) => {
    const userId = await requireUserId(ctx);
    await requireOwnedIdea(ctx, args.ideaId, userId);

    const existing = await ctx.db
      .query("ideaPostLinks")
      .withIndex("by_idea", (q) => q.eq("ideaId", args.ideaId))
      .collect();
    if (existing.some((link) => link.postId === args.postId)) {
      return existing.find((link) => link.postId === args.postId)!._id;
    }

    return await ctx.db.insert("ideaPostLinks", {
      ideaId: args.ideaId,
      postId: args.postId,
      userId,
      createdAt: Date.now(),
    });
  },
});
