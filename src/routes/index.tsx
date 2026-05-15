import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Smile, Sticker, Image as ImageIcon, Hash, Settings, CornerDownLeft, ArrowDown, UserPlus, EyeOff, Ban, Flag, Reply } from "lucide-react";

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
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [typing]);

  // Sync scroll to bottom + focus the moment typing opens, before paint
  useLayoutEffect(() => {
    if (typing) {
      const el = listRef.current;
      if (el) el.scrollTop = el.scrollHeight;
      atBottomRef.current = true;
      setUnread(0);
      inputRef.current?.focus();
    }
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
      <div className="absolute inset-0 bg-samp-scene" aria-hidden />
      <div className="absolute inset-0 bg-samp-vignette" aria-hidden />

      {/* HUD hint */}
      <div className="samp-text pointer-events-none absolute right-5 top-5 select-none text-right text-[12px] font-semibold leading-tight text-white">
        <div className="flex items-center justify-end gap-1.5">
          <span>Press</span>
          <kbd className="rounded border border-white/20 bg-neutral-950 px-1.5 py-0.5 font-mono text-[11px] text-white shadow">T</kbd>
          <span>to chat</span>
        </div>
        <div className="mt-1 text-white/80">Try /me waves</div>
      </div>

      {/* Chat overlay */}
      <div className="absolute left-5 top-5 w-[min(520px,70vw)]">
        <div className="relative">
          <div
            ref={listRef}
            onScroll={onListScroll}
            className={`samp-text flex flex-col gap-1 overflow-y-auto samp-scroll pr-1 text-[14px] leading-[1.45] ${
              typing ? "pointer-events-auto" : "pointer-events-none"
            }`}
            style={{ height: "calc(16 * 1.45 * 14px + 15 * 4px)" }}
          >
            <AnimatePresence initial={false}>
              {(typing ? messages : messages.slice(-16)).map((m) => (
                <motion.div
                  key={m.id}
                  layout
                  initial={{ opacity: 0, y: 6, filter: "blur(2px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, y: -4, filter: "blur(2px)" }}
                  transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ChatLine m={m} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {typing && unread > 0 && (
            <button
              type="button"
              onMouseDown={(e) => e.preventDefault()}
              onClick={scrollToBottom}
              className="pointer-events-auto absolute bottom-2 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/10 bg-black/70 px-3 py-1 text-[11px] font-medium text-white/80 backdrop-blur-md transition hover:bg-black/85 hover:text-white"
            >
              <ArrowDown className="size-3" />
              {unread} nuevo{unread > 1 ? "s" : ""}
            </button>
          )}
        </div>

        {typing && (
          <div className="pointer-events-auto mt-3 overflow-hidden rounded-lg border border-white/15 bg-neutral-950 shadow-2xl">
            <form onSubmit={submit}>
              <div className="flex items-center gap-2 px-3 py-2">
                <span className="select-none text-[12px] font-medium uppercase tracking-wider text-white/40">Say</span>
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={onInputKey}
                  onBlur={() => !input && setTyping(false)}
                  maxLength={144}
                  className="flex-1 bg-transparent text-[14px] font-normal text-white outline-none placeholder:text-white/30"
                  placeholder="Message…"
                  autoComplete="off"
                  spellCheck={false}
                />
                <button
                  type="submit"
                  onMouseDown={(e) => e.preventDefault()}
                  title="Enviar (Enter)"
                  className="flex shrink-0 items-center gap-1 rounded-md border border-white/10 bg-white/[0.06] px-2.5 py-1 text-[11px] font-medium text-white/70 transition hover:border-white/20 hover:bg-white/[0.12] hover:text-white"
                >
                  Enter
                  <CornerDownLeft className="size-3" />
                </button>
              </div>
              <div className="flex items-center gap-0.5 border-t border-white/[0.06] px-2 py-1.5">
                <ToolBtn title="Emojis"><Smile className="size-3.5" /></ToolBtn>
                <ToolBtn title="Stickers"><Sticker className="size-3.5" /></ToolBtn>
                <ToolBtn title="GIF"><ImageIcon className="size-3.5" /></ToolBtn>
                <Divider />
                <ToolBtn title="Último comando"><span className="font-mono text-[11px]">/me waves</span></ToolBtn>
                <ToolBtn title="Penúltimo comando"><span className="font-mono text-[11px]">/help</span></ToolBtn>
                <Divider />
                <ToolBtn title="Canales"><Hash className="size-3.5" /></ToolBtn>
                <ToolBtn title="Configuración"><Settings className="size-3.5" /></ToolBtn>
              </div>
            </form>
          </div>
        )}
      </div>
    </main>
  );
}

function ChatLine({ m }: { m: ChatMessage }) {
  const [openMenu, setOpenMenu] = useState<null | "name" | "msg">(null);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    const onDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpenMenu(null);
    };
    window.addEventListener("mousedown", onDown);
    return () => window.removeEventListener("mousedown", onDown);
  }, [openMenu]);

  if (m.type === "chat") {
    const isOther = m.author && m.author !== "You";
    return (
      <div ref={ref} className="relative text-white/90">
        <button
          type="button"
          disabled={!isOther}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => isOther && setOpenMenu(openMenu === "name" ? null : "name")}
          className="font-semibold text-white hover:underline disabled:no-underline disabled:cursor-default"
        >
          {m.author}
        </button>
        <span className="text-white/40"> · </span>
        <button
          type="button"
          disabled={!isOther}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => isOther && setOpenMenu(openMenu === "msg" ? null : "msg")}
          className="text-left text-white/85 hover:text-white disabled:hover:text-white/85 disabled:cursor-default"
        >
          {m.text}
        </button>
        {openMenu === "name" && isOther && (
          <div className="absolute left-0 top-full z-20 mt-1 min-w-[180px] overflow-hidden rounded-md border border-white/15 bg-neutral-950 shadow-2xl">
            <div className="border-b border-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: m.color ?? "#fff" }}>
              {m.author}
            </div>
            <MenuItem icon={<UserPlus className="size-3.5" />}>Agregar como amigo</MenuItem>
            <MenuItem icon={<EyeOff className="size-3.5" />}>Ocultar</MenuItem>
            <MenuItem icon={<Ban className="size-3.5" />}>Ignorar</MenuItem>
          </div>
        )}
        {openMenu === "msg" && isOther && (
          <div className="absolute left-0 top-full z-20 mt-1 min-w-[160px] overflow-hidden rounded-md border border-white/15 bg-neutral-950 shadow-2xl">
            <MenuItem icon={<Reply className="size-3.5" />}>Responder</MenuItem>
            <MenuItem icon={<Flag className="size-3.5" />}>Reportar</MenuItem>
          </div>
        )}
      </div>
    );
  }
  if (m.type === "action") return <div className="italic text-white/55">{m.text}</div>;
  if (m.type === "server") return <div className="text-white/45">{m.text}</div>;
  return <div className="text-white/60">{m.text}</div>;
}

function MenuItem({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-white/75 transition hover:bg-white/[0.06] hover:text-white"
    >
      {icon}
      {children}
    </button>
  );
}

function ToolBtn({ title, children }: { title: string; children: ReactNode }) {
  return (
    <button
      type="button"
      title={title}
      onMouseDown={(e) => e.preventDefault()}
      className="flex h-7 items-center justify-center rounded-md px-2 text-white/50 transition hover:bg-white/[0.06] hover:text-white/90"
    >
      {children}
    </button>
  );
}

function Divider() {
  return <span className="mx-1 h-4 w-px bg-white/10" />;
}
