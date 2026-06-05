"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  buildCorvoBlogDraft,
  buildFallbackDraft,
  buildIdeaSeedText,
  DEFAULT_V2_STATE,
  filterPostsForView,
  makeId,
  normalizeIdeaSourceUrl,
  V2_BRANDS,
  V2_CHANNEL_LABELS,
  type V2BrandId,
  type V2ChannelId,
  type V2DraftVariant,
  type V2Idea,
  type V2Post,
  type V2WorkspaceState,
} from "@/lib/v2";

const STORAGE_KEY = "resonate:v2:workspace";
const CORVO_HERO_IMAGE = "/images/corvo-labs-stacked.svg";

function nowIso() {
  return new Date().toISOString();
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function loadState(): V2WorkspaceState {
  if (typeof window === "undefined") return DEFAULT_V2_STATE;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return DEFAULT_V2_STATE;
  try {
    const parsed = JSON.parse(raw) as V2WorkspaceState;
    return {
      ideas: Array.isArray(parsed.ideas) ? parsed.ideas : DEFAULT_V2_STATE.ideas,
      posts: Array.isArray(parsed.posts) ? parsed.posts : [],
      voicePacks: Array.isArray(parsed.voicePacks)
        ? parsed.voicePacks
        : DEFAULT_V2_STATE.voicePacks,
    };
  } catch {
    return DEFAULT_V2_STATE;
  }
}

function saveState(state: V2WorkspaceState) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

const STATUS_LABELS: Record<V2Post["status"], string> = {
  draft: "Draft",
  scheduled: "Scheduled",
  "pr-created": "PR Created",
};

export function V2ResonateApp() {
  const [state, setState] = useState<V2WorkspaceState>(DEFAULT_V2_STATE);
  const [brandId, setBrandId] = useState<V2BrandId>("corvo");
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaNote, setIdeaNote] = useState("");
  const [ideaSourceUrl, setIdeaSourceUrl] = useState("");
  const [ideaTags, setIdeaTags] = useState("");
  const [selectedIdeaId, setSelectedIdeaId] = useState("idea-corvo-golden-sets");
  const [selectedChannels, setSelectedChannels] = useState<Set<V2ChannelId>>(
    new Set(["corvo-blog"])
  );
  const [variants, setVariants] = useState<V2DraftVariant[]>([]);
  const [generatingChannels, setGeneratingChannels] = useState<Set<V2ChannelId>>(new Set());
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [scheduleDates, setScheduleDates] = useState<Record<string, string>>({});
  const [allBrandsDrafts, setAllBrandsDrafts] = useState(false);
  const [draftStatusFilter, setDraftStatusFilter] = useState<V2Post["status"] | "">("");

  useEffect(() => {
    setState(loadState());
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") saveState(state);
  }, [state]);

  const brand = V2_BRANDS.find((item) => item.id === brandId) ?? V2_BRANDS[1];
  const ideas = state.ideas.filter((idea) => idea.brandId === brandId);
  const selectedIdea =
    ideas.find((idea) => idea.id === selectedIdeaId) ?? ideas[0] ?? null;
  const visiblePosts = filterPostsForView(
    state.posts,
    brandId,
    allBrandsDrafts,
    draftStatusFilter || undefined
  );
  const voicePack =
    state.voicePacks.find((pack) => pack.brandId === brandId && pack.isDefault) ??
    state.voicePacks.find((pack) => pack.brandId === brandId) ??
    state.voicePacks[0];

  const targetOptions = useMemo(() => {
    const channels = new Set<V2ChannelId>([
      ...brand.validatedChannels,
      ...brand.targetChannels,
    ]);
    return [...channels];
  }, [brand.targetChannels, brand.validatedChannels]);

  // Clear variant state when the selected Idea changes
  useEffect(() => {
    setVariants([]);
    setGeneratingChannels(new Set());
  }, [selectedIdeaId]);

  // Sync channel selection to available options when brand changes
  useEffect(() => {
    setSelectedChannels((prev) => {
      const available = new Set(targetOptions);
      const next = new Set([...prev].filter((c) => available.has(c)));
      return next.size > 0 ? next : new Set(targetOptions.slice(0, 1));
    });
    setVariants([]);
  }, [brandId, targetOptions]);

  function updateState(updater: (current: V2WorkspaceState) => V2WorkspaceState) {
    setState((current) => updater(current));
  }

  function toggleChannel(channelId: V2ChannelId) {
    setSelectedChannels((prev) => {
      const next = new Set(prev);
      if (next.has(channelId)) {
        next.delete(channelId);
      } else {
        next.add(channelId);
      }
      return next;
    });
  }

  function createIdea() {
    if (!ideaNote.trim()) {
      setNotice("Add a note before capturing an Idea.");
      return;
    }

    const id = makeId("idea");
    const sourceUrl = ideaSourceUrl.trim() || undefined;
    const normalizedSourceUrl = normalizeIdeaSourceUrl(sourceUrl);
    const tags = ideaTags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
    const createdAt = nowIso();

    const matchingIdea = normalizedSourceUrl
      ? ideas.find((idea) => idea.normalizedSourceUrl === normalizedSourceUrl)
      : undefined;

    if (matchingIdea) {
      updateState((current) => ({
        ...current,
        ideas: current.ideas.map((idea) =>
          idea.id === matchingIdea.id
            ? {
                ...idea,
                entries: [
                  ...idea.entries,
                  { id: makeId("entry"), content: ideaNote.trim(), createdAt },
                ],
                updatedAt: createdAt,
              }
            : idea
        ),
      }));
      setSelectedIdeaId(matchingIdea.id);
      setNotice("Matched existing source and appended this note to the Idea.");
    } else {
      const nextIdea: V2Idea = {
        id,
        brandId,
        title: ideaTitle.trim() || ideaNote.trim().slice(0, 80),
        sourceUrl,
        normalizedSourceUrl,
        tags,
        status: "inbox",
        entries: [{ id: makeId("entry"), content: ideaNote.trim(), createdAt }],
        linkedPostIds: [],
        createdAt,
        updatedAt: createdAt,
      };
      updateState((current) => ({ ...current, ideas: [nextIdea, ...current.ideas] }));
      setSelectedIdeaId(id);
      setNotice("Captured a new Idea.");
    }

    setIdeaTitle("");
    setIdeaNote("");
    setIdeaSourceUrl("");
    setIdeaTags("");
  }

  async function generateVariants() {
    if (!selectedIdea || !voicePack || selectedChannels.size === 0) return;
    setNotice(null);
    setVariants([]);

    const channels = [...selectedChannels];
    setGeneratingChannels(new Set(channels));

    await Promise.all(
      channels.map(async (channelId) => {
        try {
          const response = await fetch("/api/v2/generate-draft", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              idea: selectedIdea,
              voicePackMarkdown: voicePack.markdown,
              channel: channelId,
            }),
          });
          const data = await response.json();
          const content =
            typeof data.draft === "string"
              ? data.draft
              : buildFallbackDraft({
                  idea: selectedIdea,
                  channelId,
                  voicePackMarkdown: voicePack.markdown,
                });

          const variant: V2DraftVariant = {
            id: makeId("variant"),
            ideaId: selectedIdea.id,
            channelId,
            content,
            provider: data.provider ?? "local-placeholder",
            status: "pending",
          };

          setVariants((prev) => [...prev, variant]);
        } finally {
          setGeneratingChannels((prev) => {
            const next = new Set(prev);
            next.delete(channelId);
            return next;
          });
        }
      })
    );

    setNotice(
      `Generated ${channels.length} variant${channels.length > 1 ? "s" : ""}. Review and accept or reject each one.`
    );
  }

  function acceptVariant(variant: V2DraftVariant) {
    if (!selectedIdea) return;
    const postId = makeId("post");
    const createdAt = nowIso();
    const post: V2Post = {
      id: postId,
      brandId,
      channelId: variant.channelId,
      ideaId: selectedIdea.id,
      title:
        variant.channelId === "youtube"
          ? `${selectedIdea.title} - YouTube outline`
          : selectedIdea.title,
      content: variant.content,
      status: "draft",
      scheduledDate: today(),
      createdAt,
      updatedAt: createdAt,
    };

    updateState((current) => ({
      ...current,
      posts: [post, ...current.posts],
      ideas: current.ideas.map((idea) =>
        idea.id === selectedIdea.id
          ? {
              ...idea,
              status: idea.status === "inbox" ? "reviewing" : idea.status,
              linkedPostIds: [...new Set([...idea.linkedPostIds, postId])],
              updatedAt: createdAt,
            }
          : idea
      ),
    }));

    setVariants((prev) =>
      prev.map((v) =>
        v.id === variant.id ? { ...v, status: "accepted", postId } : v
      )
    );
  }

  function rejectVariant(variantId: string) {
    setVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, status: "rejected" } : v))
    );
  }

  async function validateYouTube(post: V2Post) {
    setBusy("Validating YouTube placeholder");
    setNotice(null);
    try {
      const response = await fetch("/api/v2/validate-youtube", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: post.title,
          description: post.content,
          scheduledDate: post.scheduledDate,
        }),
      });
      const data = await response.json();
      if (data.ok) {
        updateState((current) => ({
          ...current,
          posts: current.posts.map((item) =>
            item.id === post.id
              ? { ...item, status: "scheduled", updatedAt: nowIso() }
              : item
          ),
        }));
      }
      setNotice(data.ok ? data.message : `${data.message} ${data.issues?.join(" ")}`);
    } finally {
      setBusy(null);
    }
  }

  async function createCorvoBlogPr(post: V2Post) {
    setBusy("Creating Corvo Labs PR");
    setNotice(null);
    try {
      const response = await fetch("/api/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: post.title,
          content: post.content,
          scheduledDate: post.scheduledDate ?? today(),
          status: "draft",
          excerpt:
            "A Corvo Labs draft generated from the Postiz-based Resonate v2 workflow.",
          author: "Jake Butler",
          tags: ["Corvo Labs", "Evals", "Claim Validation"],
          category: "strategy",
          featured: false,
          coverImageAlt: "Corvo Labs logo used as a placeholder blog hero.",
          images: [
            {
              sourceUrl: CORVO_HERO_IMAGE,
              alt: "Corvo Labs logo used as a placeholder blog hero.",
              isCover: true,
            },
          ],
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setNotice(data.error || "GitHub PR creation failed.");
        return;
      }

      updateState((current) => ({
        ...current,
        posts: current.posts.map((item) =>
          item.id === post.id
            ? {
                ...item,
                status: "pr-created",
                prUrl: data.prUrl,
                branchName: data.branchName,
                updatedAt: nowIso(),
              }
            : item
        ),
      }));
      setNotice(`Created Corvo Labs blog PR: ${data.prUrl}`);
    } finally {
      setBusy(null);
    }
  }

  function schedulePost(post: V2Post) {
    const date = scheduleDates[post.id] ?? post.scheduledDate ?? today();
    updateState((current) => ({
      ...current,
      posts: current.posts.map((item) =>
        item.id === post.id
          ? { ...item, status: "scheduled", scheduledDate: date, updatedAt: nowIso() }
          : item
      ),
    }));
    setNotice(`Scheduled "${post.title}" for ${date}.`);
  }

  function resetDemo() {
    setState(DEFAULT_V2_STATE);
    setBrandId("corvo");
    setSelectedIdeaId("idea-corvo-golden-sets");
    setVariants([]);
    setGeneratingChannels(new Set());
    setNotice("Reset v2 demo data.");
  }

  const pendingVariants = variants.filter((v) => v.status === "pending");
  const reviewedVariants = variants.filter((v) => v.status !== "pending");
  const isGenerating = generatingChannels.size > 0;

  return (
    <main className="min-h-screen bg-[#f7f7f4] text-[#111827]">
      <header className="border-b border-black/10 bg-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-5">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#15616d]">
              Resonate v2
            </p>
            <h1 className="mt-1 text-2xl font-semibold">
              Postiz-based multi-brand content operations
            </h1>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link
              href="/"
              className="rounded-md border border-black/15 px-3 py-2 text-sm font-medium hover:bg-black/5"
            >
              Legacy Resonate
            </Link>
            <button
              className="rounded-md border border-black/15 px-3 py-2 text-sm font-medium hover:bg-black/5"
              onClick={resetDemo}
              type="button"
            >
              Reset Demo
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-7xl gap-5 px-6 py-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="space-y-4">
          <section className="rounded-lg border border-black/10 bg-white p-4">
            <h2 className="text-sm font-semibold">Brand Workspaces</h2>
            <div className="mt-3 space-y-2">
              {V2_BRANDS.map((item) => (
                <button
                  className={`w-full rounded-md border px-3 py-2 text-left text-sm ${
                    item.id === brandId
                      ? "border-[#15616d] bg-[#e8f3f4]"
                      : "border-black/10 hover:bg-black/5"
                  }`}
                  key={item.id}
                  onClick={() => {
                    setBrandId(item.id);
                    setSelectedIdeaId(
                      state.ideas.find((idea) => idea.brandId === item.id)?.id ?? ""
                    );
                  }}
                  type="button"
                >
                  <span className="block font-medium">{item.name}</span>
                  <span className="block text-xs text-gray-500">
                    {item.validatedChannels.length
                      ? `${item.validatedChannels.length} validated channel(s)`
                      : "Manual-post placeholders"}
                  </span>
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-lg border border-black/10 bg-white p-4">
            <h2 className="text-sm font-semibold">Default Voice Pack</h2>
            <p className="mt-2 text-sm font-medium">{voicePack?.name}</p>
            <pre className="mt-3 max-h-72 overflow-auto whitespace-pre-wrap rounded-md bg-[#111827] p-3 text-xs text-white">
              {voicePack?.markdown}
            </pre>
          </section>
        </aside>

        <div className="space-y-5">
          <section className="rounded-lg border border-black/10 bg-white p-5">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-semibold">{brand.name}</h2>
                <p className="mt-1 max-w-2xl text-sm text-gray-600">
                  {brand.description}
                </p>
              </div>
              <div className="text-sm text-gray-600">
                Target: {brand.targetChannels.map((id) => V2_CHANNEL_LABELS[id]).join(", ")}
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              {brand.validatedChannels.map((id) => (
                <span
                  className="rounded-full bg-[#e8f3f4] px-3 py-1 text-xs font-medium text-[#15616d]"
                  key={id}
                >
                  Validated: {V2_CHANNEL_LABELS[id]}
                </span>
              ))}
              {!brand.validatedChannels.length && (
                <span className="rounded-full bg-[#fff4e6] px-3 py-1 text-xs font-medium text-[#8a4b00]">
                  Channels are manual-post placeholders for MVP
                </span>
              )}
            </div>
          </section>

          {notice && (
            <div className="rounded-lg border border-[#15616d]/30 bg-[#e8f3f4] px-4 py-3 text-sm text-[#0f4c55]">
              {notice}
            </div>
          )}

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_380px]">
            <div className="rounded-lg border border-black/10 bg-white p-5">
              <h2 className="text-lg font-semibold">Ideas</h2>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <input
                  className="rounded-md border border-black/15 px-3 py-2 text-sm"
                  onChange={(event) => setIdeaTitle(event.target.value)}
                  placeholder="Idea title"
                  value={ideaTitle}
                />
                <input
                  className="rounded-md border border-black/15 px-3 py-2 text-sm"
                  onChange={(event) => setIdeaSourceUrl(event.target.value)}
                  placeholder="Optional source URL"
                  value={ideaSourceUrl}
                />
                <input
                  className="rounded-md border border-black/15 px-3 py-2 text-sm sm:col-span-2"
                  onChange={(event) => setIdeaTags(event.target.value)}
                  placeholder="Tags, comma separated"
                  value={ideaTags}
                />
                <textarea
                  className="min-h-28 rounded-md border border-black/15 px-3 py-2 text-sm sm:col-span-2"
                  onChange={(event) => setIdeaNote(event.target.value)}
                  placeholder="Capture the thought. The note is the atomic value."
                  value={ideaNote}
                />
              </div>
              <button
                className="mt-3 rounded-md bg-[#15616d] px-4 py-2 text-sm font-semibold text-white hover:bg-[#104d56]"
                onClick={createIdea}
                type="button"
              >
                Capture Idea
              </button>

              <div className="mt-5 space-y-3">
                {ideas.map((idea) => (
                  <button
                    className={`w-full rounded-lg border p-4 text-left ${
                      selectedIdea?.id === idea.id
                        ? "border-[#15616d] bg-[#f1fbfc]"
                        : "border-black/10 hover:bg-black/5"
                    }`}
                    key={idea.id}
                    onClick={() => setSelectedIdeaId(idea.id)}
                    type="button"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <h3 className="font-medium">{idea.title}</h3>
                      <span className="rounded-full bg-black/5 px-2 py-1 text-xs">
                        {idea.status}
                      </span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm text-gray-600">
                      {idea.entries.at(-1)?.content}
                    </p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {idea.tags.map((tag) => (
                        <span className="rounded-full bg-[#fff4e6] px-2 py-1 text-xs" key={tag}>
                          {tag}
                        </span>
                      ))}
                    </div>
                    {idea.linkedPostIds.length > 0 && (
                      <p className="mt-2 text-xs text-gray-400">
                        {idea.linkedPostIds.length} linked post
                        {idea.linkedPostIds.length > 1 ? "s" : ""}
                      </p>
                    )}
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-black/10 bg-white p-5">
              <h2 className="text-lg font-semibold">Idea to Draft</h2>
              {selectedIdea ? (
                <>
                  <p className="mt-2 text-sm font-medium">{selectedIdea.title}</p>
                  <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded-md bg-black/5 p-3 text-xs">
                    {buildIdeaSeedText(selectedIdea)}
                  </pre>

                  <fieldset className="mt-4">
                    <legend className="text-sm font-medium">Target channels</legend>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {targetOptions.map((id) => {
                        const checked = selectedChannels.has(id);
                        const isValidated = brand.validatedChannels.includes(id);
                        return (
                          <label
                            key={id}
                            className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                              checked
                                ? "border-[#15616d] bg-[#e8f3f4] text-[#15616d]"
                                : "border-black/10 text-gray-600 hover:bg-black/5"
                            }`}
                          >
                            <input
                              checked={checked}
                              className="sr-only"
                              onChange={() => toggleChannel(id)}
                              type="checkbox"
                            />
                            {V2_CHANNEL_LABELS[id]}
                            {isValidated && (
                              <span className="ml-1 rounded-full bg-[#15616d] px-1 text-[10px] text-white">
                                ✓
                              </span>
                            )}
                          </label>
                        );
                      })}
                    </div>
                  </fieldset>

                  <button
                    className="mt-4 w-full rounded-md bg-[#ff7d00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#dd6d00] disabled:opacity-60"
                    disabled={isGenerating || selectedChannels.size === 0}
                    onClick={generateVariants}
                    type="button"
                  >
                    {isGenerating
                      ? `Generating ${generatingChannels.size} remaining…`
                      : `Generate ${selectedChannels.size > 1 ? `${selectedChannels.size} Variants` : "Draft"}`}
                  </button>

                  {selectedChannels.size === 0 && (
                    <p className="mt-2 text-xs text-gray-500">
                      Select at least one channel to generate variants.
                    </p>
                  )}
                </>
              ) : (
                <p className="mt-2 text-sm text-gray-600">Capture or select an Idea.</p>
              )}

              {/* Variant review panel */}
              {variants.length > 0 && (
                <div className="mt-5 space-y-4">
                  <h3 className="text-sm font-semibold">
                    Variants for Review
                    {pendingVariants.length > 0 && (
                      <span className="ml-2 rounded-full bg-[#fff4e6] px-2 py-0.5 text-xs text-[#8a4b00]">
                        {pendingVariants.length} pending
                      </span>
                    )}
                  </h3>

                  {/* Still generating placeholders */}
                  {[...generatingChannels].map((channelId) => (
                    <div
                      key={channelId}
                      className="rounded-lg border border-black/10 bg-black/[0.02] p-4"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">
                          {V2_CHANNEL_LABELS[channelId]}
                        </span>
                        <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-gray-500">
                          generating…
                        </span>
                      </div>
                    </div>
                  ))}

                  {variants.map((variant) => (
                    <div
                      key={variant.id}
                      className={`rounded-lg border p-4 ${
                        variant.status === "accepted"
                          ? "border-[#15616d]/30 bg-[#f1fbfc]"
                          : variant.status === "rejected"
                            ? "border-black/10 bg-black/[0.02] opacity-60"
                            : "border-[#ff7d00]/30 bg-[#fff8f0]"
                      }`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-sm font-semibold">
                          {V2_CHANNEL_LABELS[variant.channelId]}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs">
                            {variant.provider}
                          </span>
                          {variant.status === "pending" && (
                            <>
                              <button
                                className="rounded-md bg-[#15616d] px-3 py-1 text-xs font-semibold text-white hover:bg-[#104d56]"
                                onClick={() => acceptVariant(variant)}
                                type="button"
                              >
                                Accept
                              </button>
                              <button
                                className="rounded-md border border-black/15 px-3 py-1 text-xs font-medium hover:bg-black/5"
                                onClick={() => rejectVariant(variant.id)}
                                type="button"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          {variant.status === "accepted" && (
                            <span className="rounded-full bg-[#e8f3f4] px-2 py-0.5 text-xs font-medium text-[#15616d]">
                              Accepted → Post
                            </span>
                          )}
                          {variant.status === "rejected" && (
                            <span className="rounded-full bg-black/5 px-2 py-0.5 text-xs text-gray-500">
                              Rejected
                            </span>
                          )}
                        </div>
                      </div>
                      <pre className="mt-3 max-h-60 overflow-auto whitespace-pre-wrap rounded-md bg-black/5 p-3 text-xs">
                        {variant.content}
                      </pre>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-black/10 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-semibold">Drafts and Publishing Handoff</h2>
              <div className="flex flex-wrap items-center gap-2">
                <label className="flex cursor-pointer items-center gap-1.5 text-sm">
                  <input
                    checked={allBrandsDrafts}
                    className="accent-[#15616d]"
                    onChange={(e) => setAllBrandsDrafts(e.target.checked)}
                    type="checkbox"
                  />
                  All brands
                </label>
                <select
                  className="rounded-md border border-black/15 px-2 py-1 text-xs"
                  onChange={(e) => setDraftStatusFilter(e.target.value as V2Post["status"] | "")}
                  value={draftStatusFilter}
                >
                  <option value="">All statuses</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="pr-created">PR Created</option>
                </select>
              </div>
            </div>
            <div className="mt-4 grid gap-4">
              {visiblePosts.length === 0 && (
                <p className="text-sm text-gray-600">
                  No drafts match the current filter. Accept a variant from an Idea to create a draft.
                </p>
              )}
              {visiblePosts.map((post) => {
                const ideaTitle = state.ideas.find((i) => i.id === post.ideaId)?.title;
                const postBrand = allBrandsDrafts
                  ? V2_BRANDS.find((b) => b.id === post.brandId)?.name
                  : null;
                return (
                  <article className="rounded-lg border border-black/10 p-4" key={post.id}>
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="font-medium">{post.title}</h3>
                        <p className="mt-0.5 text-sm text-gray-500">
                          {V2_CHANNEL_LABELS[post.channelId]} ·{" "}
                          <span
                            className={
                              post.status === "scheduled" || post.status === "pr-created"
                                ? "text-[#15616d]"
                                : ""
                            }
                          >
                            {STATUS_LABELS[post.status]}
                          </span>
                        </p>
                        {postBrand && (
                          <p className="mt-0.5 text-xs font-medium text-[#15616d]">
                            {postBrand}
                          </p>
                        )}
                        {ideaTitle && (
                          <p className="mt-0.5 text-xs text-gray-400">
                            From idea: {ideaTitle}
                          </p>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        {/* Channel-specific actions */}
                        {post.channelId === "youtube" && post.status === "draft" && (
                          <button
                            className="rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium hover:bg-black/5 disabled:opacity-60"
                            disabled={Boolean(busy)}
                            onClick={() => validateYouTube(post)}
                            type="button"
                          >
                            Validate YouTube Placeholder
                          </button>
                        )}
                        {post.channelId === "corvo-blog" && post.status === "draft" && (
                          <button
                            className="rounded-md border border-black/15 px-3 py-1.5 text-sm font-medium hover:bg-black/5 disabled:opacity-60"
                            disabled={Boolean(busy)}
                            onClick={() => createCorvoBlogPr(post)}
                            type="button"
                          >
                            Create Corvo Blog PR
                          </button>
                        )}

                        {/* Generic scheduling handoff for other channels */}
                        {post.status === "draft" &&
                          post.channelId !== "youtube" &&
                          post.channelId !== "corvo-blog" && (
                            <div className="flex items-center gap-2">
                              <input
                                className="rounded-md border border-black/15 px-2 py-1.5 text-xs"
                                onChange={(e) =>
                                  setScheduleDates((prev) => ({
                                    ...prev,
                                    [post.id]: e.target.value,
                                  }))
                                }
                                type="date"
                                value={scheduleDates[post.id] ?? post.scheduledDate ?? today()}
                              />
                              <button
                                className="rounded-md bg-[#15616d] px-3 py-1.5 text-xs font-semibold text-white hover:bg-[#104d56]"
                                onClick={() => schedulePost(post)}
                                type="button"
                              >
                                Schedule
                              </button>
                            </div>
                          )}
                      </div>
                    </div>

                    <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap rounded-md bg-black/5 p-3 text-sm">
                      {post.content}
                    </pre>
                    {post.prUrl && (
                      <a
                        className="mt-3 inline-flex text-sm font-medium text-[#15616d] underline"
                        href={post.prUrl}
                        rel="noreferrer"
                        target="_blank"
                      >
                        Open PR
                      </a>
                    )}
                  </article>
                );
              })}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
