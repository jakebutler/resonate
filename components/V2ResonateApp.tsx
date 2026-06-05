"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  buildCorvoBlogDraft,
  buildIdeaSeedText,
  DEFAULT_V2_STATE,
  makeId,
  normalizeIdeaSourceUrl,
  V2_BRANDS,
  V2_CHANNEL_LABELS,
  type V2BrandId,
  type V2ChannelId,
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

export function V2ResonateApp() {
  const [state, setState] = useState<V2WorkspaceState>(DEFAULT_V2_STATE);
  const [brandId, setBrandId] = useState<V2BrandId>("corvo");
  const [ideaTitle, setIdeaTitle] = useState("");
  const [ideaNote, setIdeaNote] = useState("");
  const [ideaSourceUrl, setIdeaSourceUrl] = useState("");
  const [ideaTags, setIdeaTags] = useState("");
  const [selectedIdeaId, setSelectedIdeaId] = useState("idea-corvo-golden-sets");
  const [targetChannel, setTargetChannel] = useState<V2ChannelId>("corvo-blog");
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
  const posts = state.posts.filter((post) => post.brandId === brandId);
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

  function updateState(updater: (current: V2WorkspaceState) => V2WorkspaceState) {
    setState((current) => updater(current));
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

  async function generateDraft() {
    if (!selectedIdea || !voicePack) return;
    setBusy("Generating draft");
    setNotice(null);

    try {
      const response = await fetch("/api/v2/generate-draft", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idea: selectedIdea,
          voicePackMarkdown: voicePack.markdown,
          channel: targetChannel,
        }),
      });
      const data = await response.json();
      const draft =
        typeof data.draft === "string"
          ? data.draft
          : buildCorvoBlogDraft({
              idea: selectedIdea,
              voicePackMarkdown: voicePack.markdown,
            });
      const postId = makeId("post");
      const createdAt = nowIso();
      const post: V2Post = {
        id: postId,
        brandId,
        channelId: targetChannel,
        ideaId: selectedIdea.id,
        title:
          targetChannel === "youtube"
            ? `${selectedIdea.title} - YouTube outline`
            : selectedIdea.title,
        content: draft,
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

      setNotice(
        data.provider === "pioneer"
          ? `Generated ${V2_CHANNEL_LABELS[targetChannel]} draft with PioneerAI.`
          : data.warning || `Generated ${V2_CHANNEL_LABELS[targetChannel]} draft.`
      );
    } finally {
      setBusy(null);
    }
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
      setNotice(
        data.ok
          ? data.message
          : `${data.message} ${data.issues?.join(" ")}`
      );
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

  function resetDemo() {
    setState(DEFAULT_V2_STATE);
    setBrandId("corvo");
    setSelectedIdeaId("idea-corvo-golden-sets");
    setNotice("Reset v2 demo data.");
  }

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

          <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
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
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-lg border border-black/10 bg-white p-5">
              <h2 className="text-lg font-semibold">Idea to Draft</h2>
              {selectedIdea ? (
                <>
                  <p className="mt-2 text-sm font-medium">{selectedIdea.title}</p>
                  <pre className="mt-3 max-h-56 overflow-auto whitespace-pre-wrap rounded-md bg-black/5 p-3 text-xs">
                    {buildIdeaSeedText(selectedIdea)}
                  </pre>
                  <label className="mt-4 block text-sm font-medium" htmlFor="v2-channel">
                    Target channel
                  </label>
                  <select
                    className="mt-2 w-full rounded-md border border-black/15 px-3 py-2 text-sm"
                    id="v2-channel"
                    onChange={(event) => setTargetChannel(event.target.value as V2ChannelId)}
                    value={targetChannel}
                  >
                    {targetOptions.map((id) => (
                      <option key={id} value={id}>
                        {V2_CHANNEL_LABELS[id]}
                      </option>
                    ))}
                  </select>
                  <button
                    className="mt-4 w-full rounded-md bg-[#ff7d00] px-4 py-2 text-sm font-semibold text-white hover:bg-[#dd6d00] disabled:opacity-60"
                    disabled={Boolean(busy)}
                    onClick={generateDraft}
                    type="button"
                  >
                    {busy === "Generating draft" ? "Generating..." : "Generate Draft"}
                  </button>
                </>
              ) : (
                <p className="mt-2 text-sm text-gray-600">Capture or select an Idea.</p>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-black/10 bg-white p-5">
            <h2 className="text-lg font-semibold">Drafts and Publishing Handoff</h2>
            <div className="mt-4 grid gap-4">
              {posts.length === 0 && (
                <p className="text-sm text-gray-600">
                  No v2 drafts yet. Generate one from an Idea to validate the flow.
                </p>
              )}
              {posts.map((post) => (
                <article className="rounded-lg border border-black/10 p-4" key={post.id}>
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="font-medium">{post.title}</h3>
                      <p className="text-sm text-gray-500">
                        {V2_CHANNEL_LABELS[post.channelId]} - {post.status}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {post.channelId === "youtube" && (
                        <button
                          className="rounded-md border border-black/15 px-3 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60"
                          disabled={Boolean(busy)}
                          onClick={() => validateYouTube(post)}
                          type="button"
                        >
                          Validate YouTube Placeholder
                        </button>
                      )}
                      {post.channelId === "corvo-blog" && (
                        <button
                          className="rounded-md border border-black/15 px-3 py-2 text-sm font-medium hover:bg-black/5 disabled:opacity-60"
                          disabled={Boolean(busy)}
                          onClick={() => createCorvoBlogPr(post)}
                          type="button"
                        >
                          Create Corvo Blog PR
                        </button>
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
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
