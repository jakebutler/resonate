import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  ideas: defineTable({
    userId: v.string(),
    status: v.union(
      v.literal("inbox"),
      v.literal("reviewing"),
      v.literal("ready"),
      v.literal("used"),
      v.literal("archived")
    ),
    tags: v.array(v.string()),
    sourceUrl: v.optional(v.string()),
    normalizedSourceUrl: v.optional(v.string()),
    sourceTitle: v.optional(v.string()),
    sourceDomain: v.optional(v.string()),
    latestEntryPreview: v.string(),
    lastCapturedAt: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
    archivedAt: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_status", ["userId", "status"])
    .index("by_user_and_source", ["userId", "normalizedSourceUrl"]),

  ideaEntries: defineTable({
    ideaId: v.id("ideas"),
    userId: v.string(),
    content: v.string(),
    captureChannel: v.union(
      v.literal("web"),
      v.literal("extension"),
      v.literal("ios_share")
    ),
    createdAt: v.number(),
  })
    .index("by_idea", ["ideaId"])
    .index("by_user", ["userId"]),

  ideaPostLinks: defineTable({
    ideaId: v.id("ideas"),
    postId: v.id("posts"),
    userId: v.string(),
    createdAt: v.number(),
  })
    .index("by_idea", ["ideaId"])
    .index("by_post", ["postId"])
    .index("by_user", ["userId"]),

  posts: defineTable({
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
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_scheduled_date", ["scheduledDate"]),

  settings: defineTable({
    blogEnabled: v.boolean(),
    blogFrequency: v.string(),
    linkedinEnabled: v.boolean(),
    linkedinFrequency: v.string(),
  }),
});
