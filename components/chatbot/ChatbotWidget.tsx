"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, Loader2, MessageCircle, Send, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { chatbotService } from "@/services/chatbot/chatbot.service";
import { getToken } from "@/lib/api";

type ChatMessage = {
  id: string;
  role: "bot" | "user";
  text: string;
  suggestions?: string[];
};

function createSessionId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }

  if (
    typeof crypto !== "undefined" &&
    typeof crypto.getRandomValues === "function"
  ) {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);

    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;

    const hex = Array.from(bytes, (byte) =>
      byte.toString(16).padStart(2, "0")
    ).join("");

    return [
      hex.slice(0, 8),
      hex.slice(8, 12),
      hex.slice(12, 16),
      hex.slice(16, 20),
      hex.slice(20),
    ].join("-");
  }

  return `session-${Date.now()}-${Math.random().toString(36).slice(2, 12)}`;
}


function sessionId() {
  if (typeof window === "undefined") return "server";

  const existing = localStorage.getItem("mesob_chatbot_session_id");
  if (existing) return existing;

  const next = createSessionId();
  localStorage.setItem("mesob_chatbot_session_id", next);

  return next;
}

function isAuthenticated() {
  return Boolean(getToken());
}

export default function ChatbotWidget({ source = "web" }: { source?: string }) {
  const { t } = useTranslation();

  const defaultSuggestions = useMemo(
    () => [
      t("chatbot.suggestions.services"),
      t("chatbot.suggestions.criteria"),
      t("chatbot.suggestions.apply"),
      t("chatbot.suggestions.report"),
    ],
    [t]
  );

  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);

  const listRef = useRef<HTMLDivElement | null>(null);
  const chatSessionId = useMemo(() => sessionId(), []);

  useEffect(() => {
    setMessages((current) => {
      if (current.length > 0) return current;

      return [
        {
          id: "welcome",
          role: "bot",
          text: t("chatbot.welcome"),
          suggestions: defaultSuggestions,
        },
      ];
    });
  }, [defaultSuggestions, t]);

  useEffect(() => {
    listRef.current?.scrollTo({
      top: listRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending, open]);

  async function sendMessage(event?: FormEvent, manualText?: string) {
    event?.preventDefault();

    const text = (manualText ?? message).trim();

    if (!text || sending) return;

    setMessages((current) => [
      ...current,
      {
        id: `user-${Date.now()}`,
        role: "user",
        text,
      },
    ]);
    setMessage("");
    setSending(true);

    try {
      const response = await chatbotService.send(
        {
          message: text,
          session_id: chatSessionId,
          source,
        },
        isAuthenticated()
      );

      setMessages((current) => [
        ...current,
        {
          id: `bot-${Date.now()}`,
          role: "bot",
          text: response.reply,
          suggestions: response.suggestions?.length ? response.suggestions : defaultSuggestions,
        },
      ]);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : t("chatbot.failed"));
      setMessages((current) => [
        ...current,
        {
          id: `bot-error-${Date.now()}`,
          role: "bot",
          text: t("chatbot.error"),
          suggestions: defaultSuggestions,
        },
      ]);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="fixed bottom-5 right-5 z-[80]">
      {open && (
        <div className="mb-4 flex h-[560px] w-[calc(100vw-2rem)] max-w-[400px] flex-col overflow-hidden rounded-3xl border bg-background shadow-2xl">
          <div className="flex items-center justify-between bg-primary px-4 py-3 text-primary-foreground">
            <div className="flex items-center gap-2">
              <div className="rounded-full bg-white/20 p-2">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <p className="font-bold">{t("chatbot.title")}</p>
                <p className="text-xs text-primary-foreground/80">
                  {t("chatbot.subtitle")}
                </p>
              </div>
            </div>

            <Button
              type="button"
              size="icon"
              variant="ghost"
              className="text-primary-foreground hover:bg-white/20 hover:text-primary-foreground"
              onClick={() => setOpen(false)}
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          <div ref={listRef} className="flex-1 space-y-3 overflow-y-auto p-4">
            {messages.map((item) => (
              <div
                key={item.id}
                className={`space-y-2 ${item.role === "user" ? "text-right" : "text-left"}`}
              >
                <div
                  className={`inline-block max-w-[86%] whitespace-pre-line rounded-2xl px-4 py-3 text-sm ${
                    item.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  }`}
                >
                  {item.text}
                </div>

                {item.role === "bot" && item.suggestions?.length ? (
                  <div className="flex flex-wrap gap-2">
                    {item.suggestions.slice(0, 4).map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => sendMessage(undefined, suggestion)}
                        className="rounded-full border px-3 py-1 text-xs text-muted-foreground transition hover:bg-muted"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}

            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  {t("chatbot.typing")}
                </div>
              </div>
            )}
          </div>

          <form onSubmit={sendMessage} className="flex gap-2 border-t p-3">
            <Input
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              placeholder={t("chatbot.placeholder")}
              className="rounded-2xl"
            />
            <Button
              type="submit"
              size="icon"
              className="rounded-2xl"
              disabled={sending || !message.trim()}
            >
              {sending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </form>
        </div>
      )}

      <Button
        type="button"
        className="h-14 w-14 rounded-full shadow-2xl"
        size="icon"
        onClick={() => setOpen((current) => !current)}
      >
        {open ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>
    </div>
  );
}
