"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, Copy, CheckCheck, Check, ChevronUp } from "lucide-react";
import { MODELS, DEFAULT_MODEL, type ModelOption } from "@/lib/models";

interface Message {
  role: "user" | "assistant";
  content: string;
}

interface AIAssistantProps {
  onUsePost: (content: string) => void;
}

const GREETING =
  "Hi! I'm here to help you craft the perfect LinkedIn post. Tell me about what you'd like to share — a company update, industry insight, or perhaps a thought leadership piece?";

export function AIAssistant({ onUsePost }: AIAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: GREETING },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelOption>(DEFAULT_MODEL);
  const [modelMenuOpen, setModelMenuOpen] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const modelMenuRef = useRef<HTMLDivElement>(null);
  const modelTriggerRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streaming]);

  useEffect(() => {
    if (!modelMenuOpen) return;
    function handleKeyOrClick(e: KeyboardEvent | MouseEvent) {
      if (e instanceof KeyboardEvent) {
        if (e.key === "Escape") {
          setModelMenuOpen(false);
          modelTriggerRef.current?.focus();
        }
        return;
      }
      if (modelMenuRef.current && !modelMenuRef.current.contains(e.target as Node)) {
        setModelMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleKeyOrClick);
    document.addEventListener("keydown", handleKeyOrClick);
    return () => {
      document.removeEventListener("mousedown", handleKeyOrClick);
      document.removeEventListener("keydown", handleKeyOrClick);
    };
  }, [modelMenuOpen]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setStreaming(true);

    // Add empty assistant message to stream into
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/llm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: newMessages
            .filter((m) => m.role !== "assistant" || m.content !== GREETING)
            .map((m) => ({ role: m.role, content: m.content })),
          model: selectedModel.id,
        }),
      });

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(errText || `Request failed (${res.status})`);
      }
      if (!res.body) throw new Error("No response body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n").filter((l) => l.startsWith("data: "));

        let streamError: Error | null = null;
        for (const line of lines) {
          const data = line.slice(6);
          if (data === "[DONE]") break;
          try {
            const json = JSON.parse(data);
            // Responses API: signal stream end
            if (json.type === "response.completed") break;
            // Responses API: surface errors — store and break so it escapes the inner catch
            if (json.type === "response.failed") {
              streamError = new Error(json.response?.error ?? "response.failed");
              break;
            }
            // Anthropic native, OpenAI Responses API, or OpenAI Chat Completions delta
            const delta =
              json.type === "content_block_delta" && json.delta?.type === "text_delta"
                ? json.delta.text
                : json.type === "response.output_text.delta"
                ? json.delta
                : json.choices?.[0]?.delta?.content;
            if (delta) {
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: updated[updated.length - 1].content + delta,
                };
                return updated;
              });
            }
          } catch {
            // skip non-JSON lines
          }
        }
        if (streamError) throw streamError;
      }
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      console.error("AI Assistant error:", detail);
      setMessages((prev) => {
        const updated = [...prev];
        updated[updated.length - 1] = {
          role: "assistant",
          content: detail || "Sorry, something went wrong. Please try again.",
        };
        return updated;
      });
    } finally {
      setStreaming(false);
    }
  };

  const handleCopy = (idx: number, content: string) => {
    navigator.clipboard.writeText(content);
    setCopied(idx);
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3 bg-[#4f46e5] rounded-xl mb-4">
        <Sparkles size={18} className="text-white" />
        <span className="font-semibold text-white">AI Writing Assistant</span>
      </div>

      {/* Messages */}
      <div className="flex-1 space-y-3 overflow-y-auto pb-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
            {msg.role === "assistant" && (
              <div className="w-8 h-8 rounded-full bg-[#4f46e5] flex items-center justify-center shrink-0 mr-2 mt-0.5">
                <Sparkles size={14} className="text-white" />
              </div>
            )}
            <div
              className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm ${
                msg.role === "user"
                  ? "bg-[#001524] text-white rounded-tr-sm"
                  : "bg-gray-100 text-[#001524] rounded-tl-sm"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.role === "assistant" && msg.content && i > 0 && (
                <div className="flex items-center gap-2 mt-3 pt-2 border-t border-gray-200">
                  <button
                    onClick={() => handleCopy(i, msg.content)}
                    className="flex items-center gap-1 text-xs text-gray-500 hover:text-gray-700 transition-colors"
                  >
                    {copied === i ? <CheckCheck size={12} /> : <Copy size={12} />}
                    {copied === i ? "Copied" : "Copy"}
                  </button>
                  <button
                    onClick={() => onUsePost(msg.content)}
                    className="flex items-center gap-1 text-xs font-medium text-[#ff7d00] hover:text-[#e67200] transition-colors"
                  >
                    Use this post →
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
        {streaming && (
          <div className="flex justify-start">
            <div className="w-8 h-8 rounded-full bg-[#4f46e5] flex items-center justify-center shrink-0 mr-2">
              <Sparkles size={14} className="text-white" />
            </div>
            <div className="bg-gray-100 rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:0ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]" />
                <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="mt-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
          placeholder="Describe what you want to post about..."
          disabled={streaming}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#4f46e5] focus:border-transparent disabled:opacity-50"
        />
        <div className="flex items-center justify-between mt-1.5">
          {/* Model selector */}
          <div className="relative pl-4" ref={modelMenuRef}>
            <button
              ref={modelTriggerRef}
              onClick={() => setModelMenuOpen((o) => !o)}
              aria-haspopup="listbox"
              aria-expanded={modelMenuOpen}
              aria-label={`Select AI model. Current: ${selectedModel.label}`}
              className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              {selectedModel.label}
              <ChevronUp
                size={13}
                aria-hidden="true"
                className={`transition-transform ${modelMenuOpen ? "" : "rotate-180"}`}
              />
            </button>
            {modelMenuOpen && (
              <div
                role="listbox"
                aria-label="AI model options"
                className="absolute bottom-full mb-2 left-0 bg-[#1a1a2e] rounded-xl shadow-xl py-1.5 z-10 min-w-[160px]"
              >
                {MODELS.map((m) => (
                  <button
                    key={m.id}
                    role="option"
                    aria-selected={selectedModel.id === m.id}
                    onClick={() => {
                      setSelectedModel(m);
                      setModelMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-white hover:bg-white/10 focus-visible:bg-white/10 focus-visible:outline-none flex items-center justify-between transition-colors"
                  >
                    {m.label}
                    {selectedModel.id === m.id && (
                      <Check size={13} aria-hidden="true" className="text-[#4f46e5]" />
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Send button */}
          <button
            onClick={sendMessage}
            disabled={!input.trim() || streaming}
            className="px-4 py-1.5 bg-[#4f46e5] text-white rounded-xl text-sm font-medium hover:bg-[#4338ca] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
