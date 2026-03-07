import { type AuthConfig } from "convex/server";

export default {
  providers: [
    {
      domain: "https://credible-gannet-1.clerk.accounts.dev",
      applicationID: "convex",
    },
  ],
} satisfies AuthConfig;
