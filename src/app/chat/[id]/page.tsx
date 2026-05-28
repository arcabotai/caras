"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Send, ArrowLeft } from "lucide-react";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { MessageCounter } from "@/components/message-counter";
import { ReactionButton } from "@/components/reaction-button";
import { ShareButton } from "@/components/share-button";
import { ReportModal } from "@/components/report-modal";
import { Flag } from "lucide-react";

// Skeleton components for chat
function ChatHeaderSkeleton() {
  return (
    <div className="flex items-center gap-3 flex-1">
      <div className="w-10 h-10 rounded-full skeleton-shimmer" />
      <div className="space-y-2 flex-1">
        <div className="h-4 w-24 skeleton-shimmer rounded" />
        <div className="h-3 w-40 skeleton-shimmer rounded" />
      </div>
    </div>
  );
}

function MessageBubbleSkeleton({ isUser = false }: { isUser?: boolean }) {
  return (
    <div className={"flex " + (isUser ? "justify-end" : "justify-start")}>
      <div
        className={
          "max-w-[80%] rounded-2xl px-4 py-3 skeleton-shimmer " +
          (isUser ? "bg-purple-900/30" : "bg-white/5")
        }
        style={{ minWidth: 80, minHeight: 44 }}
      />
    </div>
  );
}

// Typing indicator component
function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-white/10 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-1">
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface RateLimitInfo {
  used: number;
  limit: number;
  isPremium: boolean;
}

export default function ChatPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const characterId = params.id as string;

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [character, setCharacter] = useState<any>(null);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load rate limit status from API
  const loadRateLimitStatus = useCallback(async () => {
    try {
      const res = await fetch("/api/ratelimit/status");
      if (res.ok) {
        const data = await res.json();
        setRateLimitInfo({
          used: data.used ?? 0,
          limit: data.limit ?? 50,
          isPremium: data.isPremium ?? false,
        });
      }
    } catch {
      // non-fatal — UI will show fallback
    }
  }, []);

  useEffect(() => {
    // Load character details
    fetch("/api/characters?id=" + characterId)
      .then((res) => res.json())
      .then((data) => {
        if (data.characters && data.characters[0]) {
          setCharacter(data.characters[0]);
        }
        setIsInitialized(true);
      })
      .catch(() => {
        setIsInitialized(true);
      });

    // Load rate limit status
    loadRateLimitStatus();
  }, [characterId, loadRateLimitStatus]);

  // Show typing indicator when loading
  useEffect(() => {
    if (isLoading && messages.length > 0) {
      setIsTyping(true);
    } else {
      setIsTyping(false);
    }
  }, [isLoading, messages.length]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (!session) {
      toast.error("Inicia sesión para chatear");
      router.push("/auth/login");
      return;
    }

    const userMessage = input.trim();
    setInput("");
    setIsLoading(true);

    const tempId = Date.now().toString();

    // Optimistic update
    setMessages((prev) => [
      ...prev,
      { id: tempId, role: "user", content: userMessage },
    ]);

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ characterId, message: userMessage }),
      });

      // Update rate limit info from response headers
      const remaining = response.headers.get("X-RateLimit-Remaining");
      const isPremium = response.headers.get("X-RateLimit-Premium") === "true";
      if (remaining !== null) {
        const limit = rateLimitInfo?.limit ?? 50;
        setRateLimitInfo((prev) =>
          prev
            ? { ...prev, used: limit - parseInt(remaining, 10), isPremium }
            : { used: 1, limit, isPremium }
        );
      }

      if (response.status === 429) {
        const data = await response.json();
        toast.error(
          data.error || "Límite de mensajes diarios alcanzado. ¡Actualiza a Premium!",
          {
            description: data.retryAfterHours
              ? "Podrás chatear de nuevo en " + data.retryAfterHours + " horas"
              : undefined,
          }
        );
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setIsLoading(false);
        return;
      }

      if (response.status === 403) {
        const data = await response.json();
        toast.error(
          data.error || "Este personaje es exclusivo para usuarios Premium.",
          { description: "Actualiza para chatear con él" }
        );
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setIsLoading(false);
        return;
      }

      if (response.status === 401) {
        toast.error("Inicia sesión para continuar");
        router.push("/auth/login");
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setIsLoading(false);
        return;
      }

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        toast.error(data.error || "Error al enviar mensaje. Intenta de nuevo.");
        setMessages((prev) => prev.filter((m) => m.id !== tempId));
        setIsLoading(false);
        return;
      }

      // Handle SSE stream
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = "";

      if (reader) {
        setMessages((prev) => [
          ...prev,
          { id: "temp-assistant", role: "assistant", content: "" },
        ]);

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          assistantMessage += chunk;

          setMessages((prev) =>
            prev.map((m) =>
              m.id === "temp-assistant" ? { ...m, content: assistantMessage } : m
            )
          );
        }
      }
    } catch (error) {
      toast.error("Error al enviar mensaje. Intenta de nuevo.");
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setIsLoading(false);
    }
  };

  const initials = character?.name
    ?.split(" ")
    .map((n: string) => n[0])
    .join("")
    .slice(0, 2)
    .toUpperCase() || "??";

  return (
    <div className="flex flex-col h-screen bg-black page-enter">
      {/* Header */}
      <header className="flex items-center gap-2 sm:gap-4 px-3 sm:px-4 py-2 sm:py-3 border-b border-white/10 bg-black/80 backdrop-blur-md">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
          className="text-white hover:bg-white/10 flex-shrink-0"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>

        {isInitialized && character ? (
          <div className="flex items-center gap-2 sm:gap-3 flex-1 min-w-0">
            <Avatar className="w-9 h-9 sm:w-10 sm:h-10 flex-shrink-0">
              {character.avatarUrl ? (
                <AvatarImage src={character.avatarUrl} />
              ) : (
                <AvatarFallback className="bg-purple-700">{initials}</AvatarFallback>
              )}
            </Avatar>
            <div className="min-w-0 flex-1">
              <h2 className="font-bold text-white text-sm sm:text-base truncate">{character.name}</h2>
              <p className="text-xs text-gray-500 line-clamp-1 hidden sm:block">
                {character.shortDesc}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <ReactionButton characterId={character.id} size="sm" />
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => setIsReportModalOpen(true)}
                className="text-gray-400 hover:text-red-400 hover:bg-red-400/10"
                title="Reportar personaje"
              >
                <Flag className="w-4 h-4" />
              </Button>
              {character.isPremium && (
                <Badge className="bg-amber-500/20 text-amber-400 border-0 flex items-center gap-1 flex-shrink-0">
                  <span>🔒</span> PREMIUM
                </Badge>
              )}
            </div>
            <ShareButton
              characterId={characterId}
              characterName={character.name}
              shortDesc={character.shortDesc ?? ""}
              variant="chat"
              size="sm"
            />
          </div>
        ) : (
          <ChatHeaderSkeleton />
        )}
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-4">
        {!isInitialized ? (
          /* Loading skeleton for messages */
          <div className="space-y-4">
            <MessageBubbleSkeleton isUser={false} />
            <MessageBubbleSkeleton isUser={true} />
            <MessageBubbleSkeleton isUser={false} />
            <MessageBubbleSkeleton isUser={false} />
          </div>
        ) : messages.length === 0 && character ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-900 to-indigo-900 flex items-center justify-center mb-6">
              <Avatar className="w-20 h-20">
                {character.avatarUrl ? (
                  <AvatarImage src={character.avatarUrl} />
                ) : (
                  <AvatarFallback className="bg-purple-700 text-3xl">{initials}</AvatarFallback>
                )}
              </Avatar>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">
              Empieza a chatear con {character.name}
            </h3>
            <p className="text-gray-400 max-w-md">{character.shortDesc}</p>
          </div>
        ) : null}

        {messages.map((msg, index) => (
          <div
            key={msg.id}
            className={
              "flex " +
              (msg.role === "user" ? "justify-end" : "justify-start") +
              " animate-slide-in-" +
              (msg.role === "user" ? "right" : "left")
            }
            style={{ animationDelay: Math.min(index * 50, 300) + "ms" }}
          >
            <div
              className={
                "max-w-[85%] sm:max-w-[80%] rounded-2xl px-4 py-3 " +
                (msg.role === "user"
                  ? "bg-purple-600 text-white rounded-br-md"
                  : "bg-white/10 text-gray-200 rounded-bl-md")
              }
            >
              {msg.content || (
                <span className="animate-pulse">Escribiendo...</span>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && <TypingIndicator />}

        <div ref={messagesEndRef} />
      </div>

      {/* Message Counter */}
      {rateLimitInfo && (
        <div className="px-4 pb-2">
          <div className="max-w-4xl mx-auto">
            <MessageCounter
              used={rateLimitInfo.used}
              limit={rateLimitInfo.limit}
              isPremium={rateLimitInfo.isPremium}
            />
          </div>
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-white/10 bg-black/80">
        <div className="flex items-center gap-2 max-w-4xl mx-auto">
          <Input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Escribe tu mensaje..."
            disabled={isLoading || !character}
            className="flex-1 bg-white/10 border-white/10 text-white placeholder:text-gray-500 rounded-xl focus:ring-2 focus:ring-purple-500"
          />
          <Button
            onClick={handleSend}
            disabled={isLoading || !input.trim() || !character}
            className="bg-purple-600 hover:bg-purple-700 text-white rounded-xl px-6"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Report Modal */}
      {character && (
        <ReportModal
          characterId={character.id}
          characterName={character.name}
          open={isReportModalOpen}
          onOpenChange={setIsReportModalOpen}
        />
      )}
    </div>
  );
}
