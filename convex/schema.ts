import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export const linkedinBrandValidator = v.union(
  v.literal("corvo_labs"),
  v.literal("lower_db")
);

export default defineSchema({
  capturedIdeas: defineTable({
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

  capturedIdeaEntries: defineTable({
    ideaId: v.id("capturedIdeas"),
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

  capturedIdeaPostLinks: defineTable({
    ideaId: v.id("capturedIdeas"),
    postId: v.id("posts"),
    userId: v.string(),
    createdAt: v.number(),
  })
    .index("by_idea", ["ideaId"])
    .index("by_post", ["postId"])
    .index("by_user", ["userId"]),

  posts: defineTable({
    type: v.union(v.literal("blog"), v.literal("linkedin")),
    linkedinBrand: v.optional(linkedinBrandValidator),
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
    // Full-screen editor fields (all optional for backward compatibility)
    heroImageId: v.optional(v.id("_storage")),
    tags: v.optional(v.array(v.string())),
    seoDescription: v.optional(v.string()),
    subtitle: v.optional(v.string()),
    excerpt: v.optional(v.string()),
    author: v.optional(v.string()),
    category: v.optional(v.string()),
    featured: v.optional(v.boolean()),
    coverImageAlt: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_type", ["type"])
    .index("by_status", ["status"])
    .index("by_scheduled_date", ["scheduledDate"])
    .index("by_external_url", ["externalUrl"]),

  settings: defineTable({
    blogEnabled: v.boolean(),
    blogFrequency: v.string(),
    linkedinEnabled: v.boolean(),
    linkedinFrequency: v.string(),
  }),

  ideas: defineTable({
    userId: v.string(),
    title: v.optional(v.string()),
    text: v.string(),
    status: v.union(
      v.literal("backlog"),
      v.literal("idea"),
      v.literal("research"),
      v.literal("archived")
    ),
    researchObjective: v.optional(v.string()),
    researchNotes: v.optional(v.string()),
    researchModes: v.optional(
      v.array(
        v.union(
          v.literal("current-news"),
          v.literal("trends"),
          v.literal("literature-review"),
          v.literal("academic"),
          v.literal("competitive"),
          v.literal("visual")
        )
      )
    ),
    researchSources: v.optional(
      v.array(
        v.union(
          v.literal("blogs"),
          v.literal("news"),
          v.literal("x"),
          v.literal("arxiv"),
          v.literal("academic-publications"),
          v.literal("reddit"),
          v.literal("dribbble")
        )
      )
    ),
    researchStatus: v.optional(
      v.union(v.literal("idle"), v.literal("queued"), v.literal("completed"))
    ),
    references: v.optional(
      v.array(
        v.object({
          url: v.string(),
          title: v.optional(v.string()),
          kind: v.optional(v.string()),
          addedBy: v.union(
            v.literal("user"),
            v.literal("extractor"),
            v.literal("agent")
          ),
        })
      )
    ),
    lastResearchRunAt: v.optional(v.number()),
    lastGateStage: v.optional(v.string()),
    lastGateReady: v.optional(v.boolean()),
    lastGateSummary: v.optional(v.string()),
    lastGateIssues: v.optional(v.array(v.string())),
    lastGateCheckedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_status", ["status"])
    .index("by_updated_at", ["updatedAt"])
    .index("by_user_id", ["userId"])
    .index("by_user_id_and_status", ["userId", "status"])
    .index("by_user_id_and_updated_at", ["userId", "updatedAt"]),

  workflowDrafts: defineTable({
    userId: v.string(),
    ideaId: v.id("ideas"),
    postId: v.id("posts"),
    type: v.union(v.literal("blog"), v.literal("linkedin")),
    stage: v.union(
      v.literal("outline"),
      v.literal("copyedit"),
      v.literal("seo"),
      v.literal("final"),
      v.literal("published")
    ),
    title: v.optional(v.string()),
    stageNotes: v.optional(v.string()),
    lastAgentStage: v.optional(v.string()),
    lastAgentSummary: v.optional(v.string()),
    lastAgentRunAt: v.optional(v.number()),
    lastGateStage: v.optional(v.string()),
    lastGateReady: v.optional(v.boolean()),
    lastGateSummary: v.optional(v.string()),
    lastGateIssues: v.optional(v.array(v.string())),
    lastGateCheckedAt: v.optional(v.number()),
    publishedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_stage", ["stage"])
    .index("by_idea_id", ["ideaId"])
    .index("by_post_id", ["postId"])
    .index("by_user_id", ["userId"])
    .index("by_user_id_and_stage", ["userId", "stage"])
    .index("by_user_id_and_idea_id", ["userId", "ideaId"])
    .index("by_user_id_and_post_id", ["userId", "postId"]),
});
