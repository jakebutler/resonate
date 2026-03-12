"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import {
  Archive,
  ArrowLeft,
  BookOpenText,
  Compass,
  Link2,
  Plus,
  SearchCheck,
  Sparkles,
} from "lucide-react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import {
  RESEARCH_MODES,
  RESEARCH_SOURCES,
  formatWorkflowTimestamp,
  type ResearchMode,
  type ResearchSource,
} from "@/lib/workflow";

interface WorkflowIdeaModalProps {
  open: boolean;
  ideaId: Id<"ideas"> | null;
  onClose: () => void;
}

export function WorkflowIdeaModal({
  open,
  ideaId,
  onClose,
}: WorkflowIdeaModalProps) {
  const idea = useQuery(api.workflow.getIdea, ideaId ? { id: ideaId } : "skip");
  const updateIdea = useMutation(api.workflow.updateIdea);
  const addIdeaReference = useMutation(api.workflow.addIdeaReference);
  const extractIdeaReferences = useMutation(api.workflow.extractIdeaReferences);
  const moveIdeaToStatus = useMutation(api.workflow.moveIdeaToStatus);

  const [title, setTitle] = useState("");
  const [text, setText] = useState("");
  const [researchObjective, setResearchObjective] = useState("");
  const [researchNotes, setResearchNotes] = useState("");
  const [researchModes, setResearchModes] = useState<ResearchMode[]>([]);
  const [researchSources, setResearchSources] = useState<ResearchSource[]>([]);
  const [referenceUrl, setReferenceUrl] = useState("");
  const [referenceTitle, setReferenceTitle] = useState("");
  const [referenceKind, setReferenceKind] = useState("");
  const [saving, setSaving] = useState(false);
  const [extracting, setExtracting] = useState(false);

  useEffect(() => {
    if (!idea) return;
    setTitle(idea.title || "");
    setText(idea.text);
    setResearchObjective(idea.researchObjective || "");
    setResearchNotes(idea.researchNotes || "");
    setResearchModes(idea.researchModes || []);
    setResearchSources(idea.researchSources || []);
  }, [idea]);

  const toggleSelection = <T extends string>(
    value: T,
    current: T[],
    setter: (next: T[]) => void
  ) => {
    setter(
      current.includes(value)
        ? current.filter((entry) => entry !== value)
        : [...current, value]
    );
  };

  const handleSave = async () => {
    if (!ideaId) return;
    setSaving(true);
    try {
      await updateIdea({
        id: ideaId,
        title: title.trim() || undefined,
        text,
        researchObjective: researchObjective.trim() || undefined,
        researchNotes: researchNotes.trim() || undefined,
        researchModes,
        researchSources,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  const handleAddReference = async () => {
    if (!ideaId || !referenceUrl.trim()) return;
    await addIdeaReference({
      id: ideaId,
      reference: {
        url: referenceUrl.trim(),
        title: referenceTitle.trim() || undefined,
        kind: referenceKind.trim() || undefined,
        addedBy: "user",
      },
    });
    setReferenceUrl("");
    setReferenceTitle("");
    setReferenceKind("");
  };

  const handleExtractReferences = async () => {
    if (!ideaId) return;
    setExtracting(true);
    try {
      await extractIdeaReferences({ id: ideaId });
    } finally {
      setExtracting(false);
    }
  };

  const handleMoveToBacklog = async () => {
    if (!ideaId) return;
    await moveIdeaToStatus({ id: ideaId, status: "backlog" });
    onClose();
  };

  const handleArchive = async () => {
    if (!ideaId) return;
    await moveIdeaToStatus({ id: ideaId, status: "archived" });
    onClose();
  };

  const footer = idea ? (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="ghost" onClick={handleMoveToBacklog}>
          <ArrowLeft size={14} />
          Send to Inspiration
        </Button>
        <Button variant="ghost" onClick={handleArchive}>
          <Archive size={14} />
          Archive
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" onClick={onClose}>
          <Link2 size={14} />
          Close
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={saving || !text.trim()}>
          <Sparkles size={14} />
          {saving ? "Saving…" : "Save Idea"}
        </Button>
      </div>
    </div>
  ) : undefined;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Idea Workspace"
      size="xl"
      bodyClassName="p-0"
      footer={footer}
      panelClassName="bg-[#fcfaf6]"
    >
      {!ideaId || idea === undefined ? (
        <div className="p-6 text-sm text-gray-500">Loading idea…</div>
      ) : !idea ? (
        <div className="p-6 text-sm text-gray-500">Idea not found.</div>
      ) : (
        <div className="grid min-h-0 lg:grid-cols-[minmax(0,1.15fr)_360px]">
          <div className="min-h-0 overflow-y-auto border-r border-gray-200/80 px-6 py-6">
            <div className="mx-auto max-w-3xl space-y-6">
              <div className="rounded-[26px] border border-[#ffdfb6] bg-[linear-gradient(135deg,#fff8ef_0%,#fff2df_100%)] p-5 shadow-[0_14px_30px_rgba(120,41,15,0.06)]">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="max-w-2xl">
                    <p className="text-xs uppercase tracking-[0.22em] text-[#8b4513]">
                      Primitive Idea
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[#001524]">
                      Original insight stays intact here. Research and downstream posts
                      should sharpen it, not replace it.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="rounded-full bg-white/80 px-3 py-1.5 text-[#8b4513]">
                      {idea.draftCount} downstream draft{idea.draftCount === 1 ? "" : "s"}
                    </span>
                    <span className="rounded-full bg-white/80 px-3 py-1.5 text-gray-600">
                      Updated {formatWorkflowTimestamp(idea.updatedAt)}
                    </span>
                  </div>
                </div>
              </div>

              <section className="space-y-4 rounded-[26px] border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#ffecd1] text-[#8b4513]">
                    <BookOpenText size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                      Core Brief
                    </p>
                    <p className="text-sm text-gray-600">
                      Keep the main idea legible first. Everything else is supporting structure.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4">
                  <div>
                    <label
                      htmlFor="idea-title"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Working Title
                    </label>
                    <input
                      id="idea-title"
                      value={title}
                      onChange={(event) => setTitle(event.target.value)}
                      className="w-full rounded-2xl border border-gray-200 bg-[#fcfaf6] px-4 py-3 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#ff7d00]"
                      placeholder="Optional title for the idea"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="idea-text"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Core Idea
                    </label>
                    <textarea
                      id="idea-text"
                      value={text}
                      onChange={(event) => setText(event.target.value)}
                      rows={8}
                      className="w-full rounded-[24px] border border-gray-200 bg-[#fcfaf6] px-4 py-4 text-sm leading-7 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#ff7d00]"
                      placeholder="What is the original thought worth exploring?"
                    />
                  </div>
                </div>
              </section>

              <section className="space-y-4 rounded-[26px] border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-[#dff2f4] text-[#135b64]">
                    <Compass size={18} />
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                      Research Angle
                    </p>
                    <p className="text-sm text-gray-600">
                      Capture the question, then the notes that support or challenge it.
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 lg:grid-cols-2">
                  <div>
                    <label
                      htmlFor="idea-objective"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Research Objective
                    </label>
                    <textarea
                      id="idea-objective"
                      value={researchObjective}
                      onChange={(event) => setResearchObjective(event.target.value)}
                      rows={5}
                      className="w-full rounded-[24px] border border-gray-200 bg-[#fcfaf6] px-4 py-4 text-sm leading-7 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#ff7d00]"
                      placeholder="What should the research prove, challenge, or clarify?"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="idea-research-notes"
                      className="mb-1.5 block text-sm font-medium text-gray-700"
                    >
                      Research Notes
                    </label>
                    <textarea
                      id="idea-research-notes"
                      value={researchNotes}
                      onChange={(event) => setResearchNotes(event.target.value)}
                      rows={10}
                      className="w-full rounded-[24px] border border-gray-200 bg-[#fcfaf6] px-4 py-4 text-sm leading-7 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#ff7d00]"
                      placeholder="Capture source notes, examples, stats, and objections here."
                    />
                  </div>
                </div>
              </section>

              <div className="grid gap-4 lg:grid-cols-2">
                <div className="rounded-[26px] border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-medium text-[#001524]">Research Modes</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {RESEARCH_MODES.map((mode) => (
                      <button
                        key={mode}
                        type="button"
                        onClick={() => toggleSelection(mode, researchModes, setResearchModes)}
                        className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                          researchModes.includes(mode)
                            ? "bg-[#001524] text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {mode.replace(/-/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-[26px] border border-gray-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-medium text-[#001524]">Source Buckets</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {RESEARCH_SOURCES.map((source) => (
                      <button
                        key={source}
                        type="button"
                        onClick={() =>
                          toggleSelection(source, researchSources, setResearchSources)
                        }
                        className={`rounded-full px-3 py-1.5 text-sm transition-colors ${
                          researchSources.includes(source)
                            ? "bg-[#15616d] text-white"
                            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                        }`}
                      >
                        {source.replace(/-/g, " ")}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <aside className="min-h-0 overflow-y-auto bg-[#f7f3ec] px-5 py-6">
            <div className="space-y-4">
              <div className="rounded-[26px] border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                      References
                    </p>
                    <p className="mt-1 text-sm text-gray-600">
                      Pull links out of the note or attach sources manually.
                    </p>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={handleExtractReferences}
                    disabled={extracting}
                  >
                    <SearchCheck size={14} />
                    {extracting ? "Extracting…" : "Extract Links"}
                  </Button>
                </div>

                <div className="mt-4 max-h-56 space-y-2 overflow-y-auto pr-1">
                  {(idea.references || []).length === 0 ? (
                    <p className="rounded-2xl bg-gray-50 px-3 py-3 text-sm text-gray-500">
                      No references attached yet.
                    </p>
                  ) : (
                    idea.references.map((reference) => (
                      <div
                        key={reference.url}
                        className="rounded-2xl border border-gray-100 bg-gray-50 px-3 py-3"
                      >
                        <p className="text-sm font-medium text-[#001524]">
                          {reference.title || reference.url}
                        </p>
                        {reference.title && (
                          <p className="mt-1 text-xs leading-5 text-gray-500">
                            {reference.url}
                          </p>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 grid gap-2">
                  <input
                    value={referenceUrl}
                    onChange={(event) => setReferenceUrl(event.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-[#fcfaf6] px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#ff7d00]"
                    placeholder="https://example.com/source"
                  />
                  <input
                    value={referenceTitle}
                    onChange={(event) => setReferenceTitle(event.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-[#fcfaf6] px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#ff7d00]"
                    placeholder="Optional title"
                  />
                  <input
                    value={referenceKind}
                    onChange={(event) => setReferenceKind(event.target.value)}
                    className="w-full rounded-2xl border border-gray-200 bg-[#fcfaf6] px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#ff7d00]"
                    placeholder="article, talk, report..."
                  />
                  <Button variant="secondary" size="sm" onClick={handleAddReference}>
                    <Plus size={14} />
                    Add Reference
                  </Button>
                </div>
              </div>

              <div className="rounded-[26px] border border-gray-200 bg-white p-5 shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-gray-400">
                  Workflow Note
                </p>
                <p className="mt-2 text-sm leading-7 text-gray-600">
                  The board card stays intentionally compact. Full context, cleanup, and
                  source management happen here in the editor.
                </p>
              </div>
            </div>
          </aside>
        </div>
      )}
    </Modal>
  );
}
