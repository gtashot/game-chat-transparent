import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState, type FormEvent, type KeyboardEvent } from "react";

export const Route = createFileRoute("/")({
  component: Index,
});

type ChatMessage = {
  id: number;
  type: "chat" | "server" | "action" | "info";
  author?: string;
  color?: string;
  text: string;
};

const PLAYER_COLORS = [
  "#ff6464", "#64ff64", "#64c8ff", "#ffd24a",
  "#ff7ad9", "#9b6bff", "#ffa64a", "#5ce1e6",
];

const FAKE_PLAYERS = ["CJ_Johnson", "Big_Smoke", "Ryder", "Sweet", "Tenpenny"];

const INITIAL_MESSAGES: ChatMessage[] = [
  { id: 1, type: "server", text: "Connected to ls-rp.sa-mp.com:7777" },
  { id: 2, type: "info", text: "* Welcome to Los Santos Roleplay" },
  { id: 3, type: "chat", author: "CJ_Johnson", color: PLAYER_COLORS[0], text: "Ah shit, here we go again." },
  { id: 4, type: "chat", author: "Big_Smoke", color: PLAYER_COLORS[1], text: "I'll have two number 9s, a number 9 large..." },
  { id: 5, type: "action", text: "* Ryder lights a cigarette" },
  { id: 6, type: "chat", author: "Sweet", color: PLAYER_COLORS[3], text: "Grove Street, home." },
];

function Index() {
  const [messages, setMessages] = useState<ChatMessage[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [typing, setTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const counter = useRef(INITIAL_MESSAGES.length);
  const atBottomRef = useRef(true);
  const [unread, setUnread] = useState(0);

  const scrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    atBottomRef.current = true;
    setUnread(0);
  };

  const pushMessage = (msg: Omit<ChatMessage, "id">) => {
    counter.current += 1;
    setMessages((prev) => [...prev.slice(-50), { ...msg, id: counter.current }]);
  };

  // T key opens chat (like SA-MP)
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (typing) return;
      if (e.key === "t" || e.key === "T") {
        e.preventDefault();
        setTyping(true);
        setTimeout(() => {
          inputRef.current?.focus();
          scrollToBottom();
        }, 0);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [typing]);

  // Auto-scroll only if user is already at the bottom; otherwise count unread
  useEffect(() => {
    if (atBottomRef.current) {
      if (listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
    } else {
      setUnread((u) => u + 1);
    }
  }, [messages]);

  const onListScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const isBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 8;
    atBottomRef.current = isBottom;
    if (isBottom) setUnread(0);
  };


  // Ambient fake traffic
  useEffect(() => {
    const lines = [
      "yo anyone selling a sultan?",
      "lol",
      "/me waves",
      "meet me at unity station",
      "afk 5",
      "wtb sprunk",
    ];
    const id = setInterval(() => {
      const player = FAKE_PLAYERS[Math.floor(Math.random() * FAKE_PLAYERS.length)];
      const color = PLAYER_COLORS[FAKE_PLAYERS.indexOf(player) % PLAYER_COLORS.length];
      const line = lines[Math.floor(Math.random() * lines.length)];
      if (line.startsWith("/me")) {
        pushMessage({ type: "action", text: `* ${player} ${line.slice(4)}` });
      } else {
        pushMessage({ type: "chat", author: player, color, text: line });
      }
    }, 5500);
    return () => clearInterval(id);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const text = input.trim();
    if (text) {
      if (text.startsWith("/me ")) {
        pushMessage({ type: "action", text: `* You ${text.slice(4)}` });
      } else if (text.startsWith("/")) {
        pushMessage({ type: "server", text: `SERVER: Unknown command (${text}).` });
      } else {
        pushMessage({ type: "chat", author: "You", color: "#ffffff", text });
      }
    }
    setInput("");
    setTyping(false);
  };

  const onInputKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setInput("");
      setTyping(false);
    }
  };

  return (
    <main className="relative min-h-screen w-full overflow-hidden bg-samp-bg">
      {/* Backdrop "game" scene so transparency is visible */}
      <div className="absolute inset-0 bg-samp-scene" aria-hidden />
      <div className="absolute inset-0 bg-samp-vignette" aria-hidden />

      {/* HUD hint */}
      <div className="samp-text pointer-events-none absolute right-4 top-4 select-none text-right text-[13px] leading-tight text-white/85">
        <div>Press <span className="rounded bg-black/55 px-1.5 py-0.5">T</span> to chat</div>
        <div className="opacity-70">Try /me waves</div>
      </div>

      {/* Chat overlay — top-left, transparent like SA-MP */}
      <div className="absolute left-4 top-4 w-[min(560px,70vw)]">
        <div className="relative">
          <div
            ref={listRef}
            onScroll={onListScroll}
            className={`samp-text flex flex-col gap-[2px] overflow-y-auto samp-scroll text-[15px] leading-[1.15] ${
              typing ? "pointer-events-auto" : "pointer-events-none"
            }`}
            style={{ height: "calc(16 * 1.15 * 15px + 15 * 2px)" }}
          >
            {(typing ? messages : messages.slice(-16)).map((m) => (
              <ChatLine key={m.id} m={m} />
            ))}
          </div>

          {typing && unread > 0 && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={scrollToBottom}
              className="samp-text pointer-events-auto absolute bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-samp-purple/90 px-3 py-1 text-[12px] text-white shadow-lg hover:bg-samp-purple"
            >
              {unread} mensaje{unread > 1 ? "s" : ""} nuevo{unread > 1 ? "s" : ""} ↓
            </button>
          )}
        </div>


        {typing && (
          <form onSubmit={submit} className="pointer-events-auto mt-2">
            <div className="samp-text flex items-center bg-black/45 px-2 py-1 text-[15px] text-white">
              <span className="mr-1 select-none text-white/85">Say:</span>
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={onInputKey}
                onBlur={() => !input && setTyping(false)}
                maxLength={144}
                className="flex-1 bg-transparent text-white outline-none placeholder:text-white/40"
                placeholder="type a message, /me action, or /command"
                autoComplete="off"
                spellCheck={false}
              />
            </div>
          </form>
        )}
      </div>
    </main>
  );
}

function ChatLine({ m }: { m: ChatMessage }) {
  if (m.type === "chat") {
    return (
      <div>
        <span style={{ color: m.color }}>{m.author}:</span>{" "}
        <span className="text-white">{m.text}</span>
      </div>
    );
  }
  if (m.type === "action") return <div className="text-samp-purple">{m.text}</div>;
  if (m.type === "server") return <div className="text-samp-yellow">{m.text}</div>;
  return <div className="text-samp-info">{m.text}</div>;
}
