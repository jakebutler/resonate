import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {
    type: v.optional(v.union(v.literal("blog"), v.literal("linkedin"))),
  },
  handler: async (ctx, args) => {
    if (args.type) {
      return await ctx.db
        .query("posts")
        .withIndex("by_type", (q) => q.eq("type", args.type!))
        .order("desc")
        .collect();
    }
    return await ctx.db.query("posts").order("desc").collect();
  },
});

export const getById = query({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

export const create = mutation({
  args: {
    type: v.union(v.literal("blog"), v.literal("linkedin")),
    title: v.optional(v.string()),
    content: v.string(),
    status: v.union(
      v.literal("draft"),
      v.literal("scheduled"),
      v.literal("published")
    ),
    scheduledDate: v.optional(v.string()),
    scheduledTime: v.optional(v.string()),
    fileIds: v.optional(v.array(v.id("_storage"))),
    linkedBlogPostId: v.optional(v.id("posts")),
    externalUrl: v.optional(v.string()),
    isRepost: v.optional(v.boolean()),
    githubPrUrl: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    return await ctx.db.insert("posts", {
      ...args,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const update = mutation({
  args: {
    id: v.id("posts"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    status: v.optional(
      v.union(
        v.literal("draft"),
        v.literal("scheduled"),
        v.literal("published")
      )
    ),
    scheduledDate: v.optional(v.string()),
    scheduledTime: v.optional(v.string()),
    fileIds: v.optional(v.array(v.id("_storage"))),
    linkedBlogPostId: v.optional(v.id("posts")),
    externalUrl: v.optional(v.string()),
    isRepost: v.optional(v.boolean()),
    githubPrUrl: v.optional(v.string()),
    publishedAt: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const { id, ...fields } = args;
    await ctx.db.patch(id, { ...fields, updatedAt: Date.now() });
  },
});

export const remove = mutation({
  args: { id: v.id("posts") },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const generateUploadUrl = mutation({
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

export const getFileUrl = query({
  args: { fileId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.fileId);
  },
});
