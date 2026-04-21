import { v } from "convex/values";
import { mutation } from "./_generated/server";
import type { Doc } from "./_generated/dataModel";
import { linkedinBrandValidator } from "./schema";

const importedPostValidator = v.object({
  type: v.union(v.literal("blog"), v.literal("linkedin")),
  title: v.optional(v.string()),
  content: v.string(),
  status: v.literal("published"),
  scheduledDate: v.string(),
  externalUrl: v.string(),
  publishedAt: v.number(),
  linkedinBrand: v.optional(linkedinBrandValidator),
});

export const upsertMany = mutation({
  args: {
    posts: v.array(importedPostValidator),
  },
  returns: v.object({
    inserted: v.number(),
    updated: v.number(),
    unchanged: v.number(),
  }),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity?.subject) {
      throw new Error("Unauthorized");
    }

    let inserted = 0;
    let updated = 0;
    let unchanged = 0;

    for (const post of args.posts) {
      const existing = await ctx.db
        .query("posts")
        .withIndex("by_external_url", (q) => q.eq("externalUrl", post.externalUrl))
        .unique();

      if (!existing) {
        const now = Date.now();
        const { linkedinBrand: seedBrand, ...postRest } = post;
        await ctx.db.insert("posts", {
          ...postRest,
          ...(post.type === "linkedin"
            ? { linkedinBrand: seedBrand ?? "corvo_labs" }
            : {}),
          createdAt: now,
          updatedAt: now,
        });
        inserted += 1;
        continue;
      }

      if (hasImportedPostChanged(existing, post)) {
        await ctx.db.patch(existing._id, {
          type: post.type,
          title: post.title,
          content: post.content,
          status: post.status,
          scheduledDate: post.scheduledDate,
          externalUrl: post.externalUrl,
          publishedAt: post.publishedAt,
          ...(post.type === "linkedin"
            ? {
                linkedinBrand:
                  post.linkedinBrand ?? existing.linkedinBrand ?? "corvo_labs",
              }
            : {}),
          updatedAt: Date.now(),
        });
        updated += 1;
        continue;
      }

      unchanged += 1;
    }

    return { inserted, updated, unchanged };
  },
});

function hasImportedPostChanged(
  existing: Doc<"posts">,
  incoming: {
    type: "blog" | "linkedin";
    title?: string;
    content: string;
    status: "published";
    scheduledDate: string;
    externalUrl: string;
    publishedAt: number;
    linkedinBrand?: "corvo_labs" | "lower_db";
  }
): boolean {
  const brandIncoming =
    incoming.type === "linkedin"
      ? incoming.linkedinBrand ?? "corvo_labs"
      : undefined;
  const brandExisting =
    existing.type === "linkedin"
      ? existing.linkedinBrand ?? "corvo_labs"
      : undefined;
  return (
    existing.type !== incoming.type ||
    existing.title !== incoming.title ||
    existing.content !== incoming.content ||
    existing.status !== incoming.status ||
    existing.scheduledDate !== incoming.scheduledDate ||
    existing.externalUrl !== incoming.externalUrl ||
    existing.publishedAt !== incoming.publishedAt ||
    brandExisting !== brandIncoming
  );
}
