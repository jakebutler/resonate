/**
 * Generated data model stubs. Run `npx convex dev` to generate these from your schema.
 */
import type { GenericId } from "convex/values";

export type Id<TableName extends string> = GenericId<TableName>;

export type TableNames = "posts" | "settings";

export type DataModel = {
  posts: {
    _id: Id<"posts">;
    _creationTime: number;
    type: "blog" | "linkedin";
    title?: string;
    content: string;
    status: "draft" | "scheduled" | "published";
    scheduledDate?: string;
    scheduledTime?: string;
    fileIds?: Id<"_storage">[];
    linkedBlogPostId?: Id<"posts">;
    externalUrl?: string;
    isRepost?: boolean;
    githubPrUrl?: string;
    publishedAt?: number;
    createdAt: number;
    updatedAt: number;
  };
  settings: {
    _id: Id<"settings">;
    _creationTime: number;
    blogEnabled: boolean;
    blogFrequency: string;
    linkedinEnabled: boolean;
    linkedinFrequency: string;
  };
};
