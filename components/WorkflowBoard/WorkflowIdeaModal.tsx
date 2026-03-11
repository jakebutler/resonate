"use client";

import { useEffect, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { Archive, ArrowLeft, Link2, Plus, SearchCheck, Sparkles } from "lucide-react";
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

  return (
    <Modal open={open} onClose={onClose} title="Idea Workspace">
      {!ideaId || idea === undefined ? (
        <p className="text-sm text-gray-500">Loading idea…</p>
      ) : !idea ? (
        <p className="text-sm text-gray-500">Idea not found.</p>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-[#ffecd1] bg-[#fff8ef] p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.2em] text-[#78290f]">
                  Primitive Idea
                </p>
                <p className="mt-1 text-sm text-[#001524]">
                  Original insight stays intact while it spawns downstream drafts.
                </p>
              </div>
              <div className="text-right text-xs text-gray-500">
                <p>{idea.draftCount} downstream draft{idea.draftCount === 1 ? "" : "s"}</p>
                <p>Updated {formatWorkflowTimestamp(idea.updatedAt)}</p>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Working Title
                </label>
                <input
                  value={title}
                  onChange={(event) => setTitle(event.target.value)}
                  className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#ff7d00]"
                  placeholder="Optional title for the idea"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Core Idea
                </label>
                <textarea
                  value={text}
                  onChange={(event) => setText(event.target.value)}
                  rows={7}
                  className="w-full rounded-2xl border border-gray-200 px-3 py-3 text-sm leading-6 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#ff7d00]"
                  placeholder="What is the original thought worth exploring?"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Research Objective
                </label>
                <textarea
                  value={researchObjective}
                  onChange={(event) => setResearchObjective(event.target.value)}
                  rows={3}
                  className="w-full rounded-2xl border border-gray-200 px-3 py-3 text-sm leading-6 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#ff7d00]"
                  placeholder="What should the research prove, challenge, or clarify?"
                />
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Research Notes
                </label>
                <textarea
                  value={researchNotes}
                  onChange={(event) => setResearchNotes(event.target.value)}
                  rows={11}
                  className="w-full rounded-2xl border border-gray-200 px-3 py-3 text-sm leading-6 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#ff7d00]"
                  placeholder="Capture source notes, examples, stats, and objections here."
                />
              </div>

              <div className="rounded-2xl border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-[#001524]">References</p>
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

                <div className="mt-3 space-y-2">
                  {(idea.references || []).length === 0 ? (
                    <p className="text-sm text-gray-500">
                      No references attached yet.
                    </p>
                  ) : (
                    idea.references.map((reference) => (
                      <div
                        key={reference.url}
                        className="rounded-xl border border-gray-100 bg-gray-50 px-3 py-2"
                      >
                        <p className="text-sm font-medium text-[#001524]">
                          {reference.title || reference.url}
                        </p>
                        {reference.title && (
                          <p className="mt-0.5 text-xs text-gray-500">{reference.url}</p>
                        )}
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-4 grid gap-2">
                  <input
                    value={referenceUrl}
                    onChange={(event) => setReferenceUrl(event.target.value)}
                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#ff7d00]"
                    placeholder="https://example.com/source"
                  />
                  <div className="grid gap-2 md:grid-cols-2">
                    <input
                      value={referenceTitle}
                      onChange={(event) => setReferenceTitle(event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#ff7d00]"
                      placeholder="Optional title"
                    />
                    <input
                      value={referenceKind}
                      onChange={(event) => setReferenceKind(event.target.value)}
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[#ff7d00]"
                      placeholder="article, talk, report..."
                    />
                  </div>
                  <Button variant="secondary" size="sm" onClick={handleAddReference}>
                    <Plus size={14} />
                    Add Reference
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-gray-200 p-4">
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

            <div className="rounded-2xl border border-gray-200 p-4">
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

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-2">
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
        </div>
      )}
    </Modal>
  );
}
