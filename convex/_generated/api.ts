/**
 * Generated `api` utility file stubs.
 * Run `npx convex dev` to regenerate these from your actual schema.
 * These stubs allow the project to compile before Convex is configured.
 */
import { anyApi } from "convex/server";
import type { ApiFromModules } from "convex/server";
import type * as posts from "../posts.js";
import type * as settings from "../settings.js";

export type API = ApiFromModules<{
  posts: typeof posts;
  settings: typeof settings;
}>;

// Runtime value uses anyApi for flexible property access
export const api: API = anyApi as unknown as API;
export const internal: API = anyApi as unknown as API;
