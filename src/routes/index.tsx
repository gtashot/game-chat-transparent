import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useLayoutEffect, useRef, useState, type FormEvent, type KeyboardEvent, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Smile, Sticker, Image as ImageIcon, Hash, Settings, CornerDownLeft, ArrowDown, UserPlus, EyeOff, Ban, Flag, Reply, Crown, Briefcase, Phone, ShieldAlert, Car, DollarSign, Radio, type LucideIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";


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
    const distance = el.scrollHeight - el.scrollTop - el.clientHeight;
    const isBottom = distance < 8;
    atBottomRef.current = isBottom;
    if (isBottom) {
      setUnread(0);
    } else {
      // Dynamically reduce unread as user scrolls down toward the bottom.
      // Approximate one message ~ one line-height (≈ 20px).
      const perMessage = 20;
      const remaining = Math.min(unread, Math.ceil(distance / perMessage));
      if (remaining !== unread) setUnread(remaining);
    }
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
      

      {/* HUD hint */}
      <div className="samp-text pointer-events-none absolute right-5 top-5 select-none text-right text-[12px] font-semibold leading-tight text-white">
        <div className="flex items-center justify-end gap-1.5">
          <span>Press</span>
          <kbd className="rounded border border-white/20 bg-neutral-950 px-1.5 py-0.5 font-mono text-[11px] text-white">T</kbd>
          <span>to chat</span>
        </div>
        <div className="mt-1 text-white/80">Try /me waves</div>
      </div>

      {/* GTA V style notifications */}
      <Notifications />

      {/* Minimap */}
      <Minimap />

      {/* Chat overlay */}
      <div className="absolute left-5 top-5 w-[min(520px,70vw)]">
        <div className="relative">
          <div
            ref={listRef}
            onScroll={onListScroll}
            className={`samp-text pointer-events-auto flex flex-col gap-1 overflow-y-auto pr-1 text-[14px] leading-[1.45] ${typing ? "samp-scroll" : "samp-scroll-hidden"}`}
            style={{ height: "calc(16 * 1.45 * 14px + 15 * 4px)" }}
          >
            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, y: 6, filter: "blur(2px)" }}
                  animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                  exit={{ opacity: 0, filter: "blur(2px)" }}
                  transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
                >
                  <ChatLine m={m} />
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          <AnimatePresence>
            {typing && unread > 0 && (
              <motion.button
                key="unread-pill"
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={scrollToBottom}
                initial={{ opacity: 0, y: 8, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.9 }}
                transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                className="pointer-events-auto absolute -bottom-1 left-1/2 flex -translate-x-1/2 items-center gap-1.5 rounded-full border border-white/15 bg-black/60 px-3 py-1 text-[11px] font-medium text-white/90 shadow-lg backdrop-blur-md transition hover:bg-black/80 hover:text-white"
              >
                <ArrowDown className="size-3" />
                {unread} nuevo{unread > 1 ? "s" : ""} mensaje{unread > 1 ? "s" : ""}
              </motion.button>
            )}
          </AnimatePresence>
        </div>

        <AnimatePresence initial={false}>
          {typing && (
            <motion.div
              key="chat-input"
              initial={{ opacity: 0, y: -8, scale: 0.98, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -8, scale: 0.98, filter: "blur(4px)" }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="pointer-events-auto mt-3 origin-top overflow-hidden rounded-lg border border-white/15 bg-neutral-950"
            >
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
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}

function ChatLine({ m }: { m: ChatMessage }) {
  const [openMenu, setOpenMenu] = useState<null | "name" | "msg">(null);

  if (m.type === "chat") {
    const isOther = !!m.author && m.author !== "You";
    return (
      <div className="text-white/90">
        <Popover
          open={openMenu === "name"}
          onOpenChange={(o) => setOpenMenu(o ? "name" : null)}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={!isOther}
              onMouseDown={(e) => e.preventDefault()}
              className="font-semibold text-white hover:underline disabled:no-underline disabled:cursor-default"
            >
              {m.author}
            </button>
          </PopoverTrigger>
          {isOther && (
            <PopoverContent
              align="start"
              sideOffset={4}
              className="z-[60] w-auto min-w-[180px] overflow-hidden rounded-md border border-white/15 bg-neutral-950 p-0 text-white"
            >
              <div className="border-b border-white/10 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider" style={{ color: m.color ?? "#fff" }}>
                {m.author}
              </div>
              <MenuItem icon={<UserPlus className="size-3.5" />}>Agregar como amigo</MenuItem>
              <MenuItem icon={<EyeOff className="size-3.5" />}>Ocultar</MenuItem>
              <MenuItem icon={<Ban className="size-3.5" />}>Ignorar</MenuItem>
            </PopoverContent>
          )}
        </Popover>
        <span className="text-white/50">: </span>
        <Popover
          open={openMenu === "msg"}
          onOpenChange={(o) => setOpenMenu(o ? "msg" : null)}
        >
          <PopoverTrigger asChild>
            <button
              type="button"
              disabled={!isOther}
              onMouseDown={(e) => e.preventDefault()}
              className="text-left text-white/85 hover:text-white disabled:hover:text-white/85 disabled:cursor-default"
            >
              {m.text}
            </button>
          </PopoverTrigger>
          {isOther && (
            <PopoverContent
              align="start"
              sideOffset={4}
              className="z-[60] w-auto min-w-[160px] overflow-hidden rounded-md border border-white/15 bg-neutral-950 p-0 text-white"
            >
              <MenuItem icon={<Reply className="size-3.5" />}>Responder</MenuItem>
              <MenuItem icon={<Flag className="size-3.5" />}>Reportar</MenuItem>
            </PopoverContent>
          )}
        </Popover>
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

// ====================== GTA V Notifications ======================

type NotifSize = "sm" | "md" | "lg";

type Notif = {
  id: number;
  icon: LucideIcon;
  accent: string; // tailwind text color class for icon tile
  title: string;
  body?: string;
  size: NotifSize;
};

const NOTIF_POOL: Omit<Notif, "id">[] = [
  {
    icon: Crown,
    accent: "text-amber-400",
    title: "Haviland",
    body: "I am happy to report that your security team have prevented a police raid on one of your businesses. Excellent news. Production continues as normal.",
    size: "lg",
  },
  {
    icon: DollarSign,
    accent: "text-emerald-400",
    title: "Bank of Los Santos",
    body: "Deposit received: $24,500",
    size: "sm",
  },
  {
    icon: Phone,
    accent: "text-sky-400",
    title: "Lamar",
    body: "Yo homie, meet me at the Vespucci pier in 5.",
    size: "md",
  },
  {
    icon: ShieldAlert,
    accent: "text-rose-400",
    title: "LSPD Alert",
    body: "Wanted level increased. Lose the cops to evade.",
    size: "md",
  },
  {
    icon: Briefcase,
    accent: "text-amber-400",
    title: "Mission Available",
    body: "Heist setup ready at the planning board.",
    size: "md",
  },
  {
    icon: Car,
    accent: "text-sky-400",
    title: "Vehicle Delivered",
    body: "Your Pegassi Zentorno is at the garage.",
    size: "sm",
  },
  {
    icon: Radio,
    accent: "text-violet-400",
    title: "Weazel News",
    body: "Breaking: stock market spikes after CEO scandal.",
    size: "md",
  },
  {
    icon: DollarSign,
    accent: "text-emerald-400",
    title: "Maze Bank",
    body: "Loan approved",
    size: "sm",
  },
];

function Notifications() {
  const [items, setItems] = useState<Notif[]>([]);
  const counter = useRef(0);

  useEffect(() => {
    let cancelled = false;

    const push = () => {
      if (cancelled) return;
      const tpl = NOTIF_POOL[Math.floor(Math.random() * NOTIF_POOL.length)];
      counter.current += 1;
      const id = counter.current;
      setItems((prev) => [...prev.slice(-4), { ...tpl, id }]);
      const lifetime = tpl.size === "lg" ? 8000 : tpl.size === "md" ? 6000 : 4500;
      setTimeout(() => {
        if (cancelled) return;
        setItems((prev) => prev.filter((n) => n.id !== id));
      }, lifetime);
    };

    const first = setTimeout(push, 1500);
    const interval = setInterval(push, 6500);
    return () => {
      cancelled = true;
      clearTimeout(first);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="pointer-events-none absolute right-5 top-20 z-30 flex w-[340px] flex-col items-end gap-2">
      <AnimatePresence initial={false}>
        {items.map((n) => (
          <motion.div
            key={n.id}
            layout
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 40, scale: 0.96, transition: { duration: 0.25 } }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="w-full"
          >
            <NotificationCard n={n} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

function NotificationCard({ n }: { n: Notif }) {
  const Icon = n.icon;
  const padX = n.size === "sm" ? "px-3" : "px-4";
  const padY = n.size === "sm" ? "py-2.5" : n.size === "lg" ? "py-3.5" : "py-3";
  const titleSize = n.size === "lg" ? "text-[15px]" : "text-[13px]";
  const bodySize = n.size === "lg" ? "text-[13.5px]" : "text-[12.5px]";
  const iconBox = n.size === "lg" ? "size-12" : n.size === "md" ? "size-10" : "size-9";
  const iconSize = n.size === "lg" ? "size-6" : n.size === "md" ? "size-5" : "size-[18px]";

  const stripeColor: Record<string, string> = {
    "text-amber-400": "bg-amber-400",
    "text-emerald-400": "bg-emerald-400",
    "text-sky-400": "bg-sky-400",
    "text-rose-400": "bg-rose-400",
    "text-violet-400": "bg-violet-400",
  };
  const stripe = stripeColor[n.accent] ?? "bg-white";

  return (
    <div
      className={`relative flex w-full items-start gap-3 overflow-hidden rounded-md border border-white/[0.06] bg-[#0a0a0a] ${padX} ${padY}`}
    >
      {/* left accent stripe */}
      <span className={`absolute inset-y-0 left-0 w-[3px] ${stripe}`} />

      <div className={`flex ${iconBox} shrink-0 items-center justify-center rounded-sm bg-[#141414] ${n.accent}`}>
        <Icon className={iconSize} strokeWidth={2.2} />
      </div>

      <div className="flex min-w-0 flex-1 flex-col">
        <div className={`samp-text font-semibold text-white ${titleSize} leading-tight`}>
          {n.title}
        </div>
        {n.body && (
          <div className={`mt-1 ${bodySize} font-normal leading-snug text-white/85`} style={{ textShadow: "none" }}>
            {n.body}
          </div>
        )}
      </div>
    </div>
  );
}

function Minimap() {
  const stats = [
    { value: 78, from: "from-emerald-500", to: "to-emerald-400" },
    { value: 60, from: "from-sky-500", to: "to-sky-400" },
    { value: 45, from: "from-amber-400", to: "to-yellow-300" },
  ];
  return (
    <div className="pointer-events-none absolute bottom-5 left-5 select-none">
      <div className="rounded-xl border border-white/10 bg-black/70 p-[3px] pb-2 shadow-[0_6px_24px_rgba(0,0,0,0.5)] backdrop-blur-xl">
        <div className="relative h-[170px] w-[250px] overflow-hidden rounded-[10px] bg-white">
          {/* Subtle grid */}
          <div
            className="absolute inset-0 opacity-[0.06]"
            style={{
              backgroundImage:
                "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)",
              backgroundSize: "25px 25px",
            }}
          />
          {/* Inner border highlight */}
          <div className="pointer-events-none absolute inset-0 rounded-[10px] ring-1 ring-inset ring-black/[0.08]" />
          {/* Player marker */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
            <div className="absolute -inset-3 rounded-full bg-black/10 blur-md" />
            <svg
              viewBox="0 0 24 24"
              className="relative h-5 w-5 drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]"
              fill="#111"
              stroke="#fff"
              strokeWidth="1.5"
              strokeLinejoin="round"
            >
              <path d="M5 3 L5 19 L10 15 L13 21 L16 19.5 L13 13.5 L19 13 Z" />
            </svg>
          </div>
          {/* Location label */}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-2 py-1.5">
            <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-white/95">
              Grove Street
            </div>
            <div className="text-[9px] font-medium uppercase tracking-wider text-white/60">
              Los Santos
            </div>
          </div>
        </div>
        {/* Status bars - inline, flush together */}
        <div className="mx-2 mt-2 flex h-[5px] gap-[1px]">

          {stats.map((s, i) => (
            <div key={i} className="h-full flex-1 overflow-hidden bg-white/10 first:rounded-l-full last:rounded-r-full">
              <div
                className={`h-full bg-gradient-to-r ${s.from} ${s.to}`}
                style={{ width: `${s.value}%` }}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}




