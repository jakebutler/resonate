import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("generated ideas API", () => {
  it("includes ideas in the generated data model", () => {
    const generated = readFileSync(
      join(process.cwd(), "convex/_generated/api.d.ts"),
      "utf8"
    );

    expect(generated).toContain('import type * as ideas from "../ideas.js";');
  });
});
