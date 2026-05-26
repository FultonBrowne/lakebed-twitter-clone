import { SignInWithGoogle, signOut, useAuth, useMutation, useQuery } from "lakebed/client";
import { useCallback, useEffect, useMemo, useRef, useState } from "preact/hooks";
import type { JSX } from "preact";
import {
 cleanChirpText,
  cleanHandle,
  cleanMessageText,
  conversationId,
  isValidChirp,
  isValidHandle,
  isValidMessage,
  MAX_CHIRP_LENGTH,
  MAX_MESSAGE_LENGTH,
  parseHashtags,
  parseRichText,
  type Chirp,
  type Follow,
  type ConversationRead,
  type Like,
  type Message,
  type Notification,
  type NotificationRead,
  type Profile,
  type Repost,
  type UserSummary
} from "../shared/types";

// ---------------------------------------------------------------------------
// Icons — inlined Lucide SVGs (ISC). No npm imports allowed in app code.
// ---------------------------------------------------------------------------

type IconProps = { className?: string; size?: number };

function Icon({ children, className, size = 20 }: IconProps & { children: JSX.Element | JSX.Element[] }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      stroke-width="2"
      stroke-linecap="round"
      stroke-linejoin="round"
      className={className}
    >
      {children}
    </svg>
  );
}

const HomeIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 9.5 12 3l9 6.5V21a1 1 0 0 1-1 1h-5v-7h-6v7H4a1 1 0 0 1-1-1z" />
  </Icon>
);
const SearchIcon = (p: IconProps) => (
  <Icon {...p}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </Icon>
);
const BellIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
    <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
  </Icon>
);
const MailIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect width="20" height="16" x="2" y="4" rx="2" />
    <path d="m22 7-10 5L2 7" />
  </Icon>
);
const UserIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Icon>
);
const FeatherIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z" />
    <path d="M16 8 2 22" />
    <path d="M17.5 15H9" />
  </Icon>
);
const HeartIcon = ({ filled, ...p }: IconProps & { filled?: boolean }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width={p.size ?? 18}
    height={p.size ?? 18}
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"
    className={p.className}
  >
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.29 1.51 4.04 3 5.5l7 7z" />
  </svg>
);
const MessageIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
  </Icon>
);
const RepeatIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m17 2 4 4-4 4" />
    <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
    <path d="m7 22-4-4 4-4" />
    <path d="M21 13v1a4 4 0 0 1-4 4H3" />
  </Icon>
);
const ShareIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
    <polyline points="16 6 12 2 8 6" />
    <line x1="12" y1="2" x2="12" y2="15" />
  </Icon>
);
const TrashIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M3 6h18" />
    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
    <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
  </Icon>
);
const LogOutIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </Icon>
);
const SparklesIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m12 3-1.9 5.8a2 2 0 0 1-1.3 1.3L3 12l5.8 1.9a2 2 0 0 1 1.3 1.3L12 21l1.9-5.8a2 2 0 0 1 1.3-1.3L21 12l-5.8-1.9a2 2 0 0 1-1.3-1.3z" />
  </Icon>
);
const SendIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="m22 2-7 20-4-9-9-4z" />
    <path d="M22 2 11 13" />
  </Icon>
);
const ArrowLeftIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M19 12H5" />
    <path d="m12 19-7-7 7-7" />
  </Icon>
);
const XIcon = (p: IconProps) => (
  <Icon {...p}>
    <path d="M18 6 6 18" />
    <path d="m6 6 12 12" />
  </Icon>
);
const CalendarIcon = (p: IconProps) => (
  <Icon {...p}>
    <rect x="3" y="4" width="18" height="18" rx="2" />
    <path d="M16 2v4M8 2v4M3 10h18" />
  </Icon>
);
// ---------------------------------------------------------------------------
// Primitives
// ---------------------------------------------------------------------------

function cn(...parts: (string | false | null | undefined)[]): string {
  return parts.filter(Boolean).join(" ");
}

type ButtonProps = JSX.HTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "ghost" | "outline" | "danger";
  size?: "sm" | "md" | "lg" | "icon";
};

function Button({ variant = "primary", size = "md", className, children, ...rest }: ButtonProps) {
  const variants: Record<string, string> = {
    primary: "bg-white text-black hover:bg-neutral-200 disabled:opacity-50",
    ghost: "text-neutral-300 hover:bg-neutral-900 hover:text-white",
    outline: "border border-neutral-800 text-neutral-200 hover:bg-neutral-900 hover:border-neutral-700",
    danger: "border border-neutral-800 text-neutral-200 hover:border-red-900 hover:bg-red-950/40 hover:text-red-400"
  };
  const sizes: Record<string, string> = {
    sm: "h-8 px-3 text-sm",
    md: "h-10 px-4 text-sm",
    lg: "h-12 px-6 text-base",
    icon: "h-9 w-9 p-0"
  };
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-purple-500 disabled:cursor-not-allowed",
        variants[variant],
        sizes[size],
        className
      )}
      {...rest}
    >
      {children}
    </button>
  );
}

function Avatar({
  name,
  picture,
  size = 40,
  onClick
}: {
  name: string;
  picture?: string;
  size?: number;
  onClick?: () => void;
}) {
  const initial = (name?.trim().slice(0, 1) || "?").toUpperCase();
  const style = { width: `${size}px`, height: `${size}px` };
  const cls = cn(
    "shrink-0 rounded-full border border-neutral-800 bg-neutral-900 object-cover",
    onClick && "cursor-pointer hover:opacity-90"
  );
  if (picture) {
    return <img alt="" referrerPolicy="no-referrer" src={picture} style={style} className={cls} onClick={onClick} />;
  }
  return (
    <span
      aria-hidden="true"
      style={style}
      onClick={onClick}
      className={cn(
        "flex shrink-0 items-center justify-center rounded-full border border-neutral-800 bg-gradient-to-br from-purple-700 to-fuchsia-900 text-sm font-bold text-white",
        onClick && "cursor-pointer hover:opacity-90"
      )}
    >
      {initial}
    </span>
  );
}

// ---------------------------------------------------------------------------
// Routing
// ---------------------------------------------------------------------------

type Route =
  | { name: "home" }
  | { name: "explore" }
  | { name: "notifications" }
  | { name: "messages"; peerId?: string }
  | { name: "profile"; userId: string; view?: "chirps" | "likes" | "followers" | "following" }
  | { name: "chirp"; chirpId: string }
  | { name: "hashtag"; tag: string };

function parseHash(hash: string): Route {
  const h = hash.replace(/^#\/?/, "");
  const parts = h.split("/").filter(Boolean).map((p) => {
    try {
      return decodeURIComponent(p);
    } catch {
      return p;
    }
  });
  switch (parts[0]) {
    case "explore":
      return { name: "explore" };
    case "notifications":
      return { name: "notifications" };
    case "messages":
      return { name: "messages", peerId: parts[1] };
    case "profile":
      if (parts[1]) {
        const view = parts[2];
        if (view === "likes" || view === "followers" || view === "following" || view === "chirps") {
          return { name: "profile", userId: parts[1], view };
        }
        return { name: "profile", userId: parts[1] };
      }
      return { name: "home" };
    case "chirp":
      if (parts[1]) return { name: "chirp", chirpId: parts[1] };
      return { name: "home" };
    case "hashtag":
      if (parts[1]) return { name: "hashtag", tag: parts[1].toLowerCase() };
      return { name: "explore" };
    default:
      return { name: "home" };
  }
}

function routeToHash(route: Route): string {
  const enc = encodeURIComponent;
  switch (route.name) {
    case "home":
      return "#/home";
    case "explore":
      return "#/explore";
    case "notifications":
      return "#/notifications";
    case "messages":
      return route.peerId ? `#/messages/${enc(route.peerId)}` : "#/messages";
    case "profile":
      return route.view
        ? `#/profile/${enc(route.userId)}/${route.view}`
        : `#/profile/${enc(route.userId)}`;
    case "chirp":
      return `#/chirp/${enc(route.chirpId)}`;
    case "hashtag":
      return `#/hashtag/${enc(route.tag)}`;
  }
}

function useRoute(): [Route, (r: Route) => void] {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));
  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);
  const navigate = useCallback((r: Route) => {
    window.location.hash = routeToHash(r);
  }, []);
  return [route, navigate];
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function timeAgo(iso: string): string {
  const then = new Date(iso).getTime();
  const now = Date.now();
  const s = Math.max(1, Math.floor((now - then) / 1000));
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

function RichText({
  text,
  navigate,
  handleToUserId
}: {
  text: string;
  navigate: (r: Route) => void;
  handleToUserId: Map<string, string>;
}) {
  const segments = useMemo(() => parseRichText(text), [text]);
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.kind === "text") return <span key={i}>{seg.value}</span>;
        if (seg.kind === "mention") {
          const userId = handleToUserId.get(seg.handle);
          if (!userId) return <span key={i} className="text-purple-400">@{seg.handle}</span>;
          return (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                navigate({ name: "profile", userId });
              }}
              className="text-purple-400 hover:underline"
            >
              @{seg.handle}
            </button>
          );
        }
        if (seg.kind === "hashtag") {
          return (
            <button
              key={i}
              onClick={(e) => {
                e.stopPropagation();
                navigate({ name: "hashtag", tag: seg.tag });
              }}
              className="text-purple-400 hover:underline"
            >
              #{seg.tag}
            </button>
          );
        }
        return (
          <a
            key={i}
            href={seg.href}
            target="_blank"
            rel="noreferrer noopener"
            onClick={(e) => e.stopPropagation()}
            className="text-purple-400 hover:underline"
          >
            {seg.href}
          </a>
        );
      })}
    </>
  );
}

const FAVICON_SVG =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="rgb(168 85 247)" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/><path d="M16 8 2 22"/><path d="M17.5 15H9"/></svg>';

function useFavicon() {
  useEffect(() => {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.head.appendChild(link);
    }
    link.type = "image/svg+xml";
    link.href = "data:image/svg+xml;utf8," + encodeURIComponent(FAVICON_SVG);
  }, []);
}

function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

function useAnimateOnEnter(seen: { current: Set<string> }) {
  return useCallback(
    (id: string) =>
      (el: HTMLElement | null) => {
        if (!el) return;
        if (seen.current.has(id)) return;
        seen.current.add(id);
        try {
          el.animate(
            [
              { opacity: 0, transform: "translateY(-6px)" },
              { opacity: 1, transform: "translateY(0)" }
            ],
            { duration: 220, easing: "ease-out" }
          );
        } catch {}
      },
    [seen]
  );
}

function usePulseOnIncrease(value: number) {
  const ref = useRef<HTMLElement | null>(null);
  const prev = useRef(value);
  useEffect(() => {
    if (value > prev.current) pulse(ref.current, 1.3);
    prev.current = value;
  }, [value]);
  return ref;
}

function pulse(el: HTMLElement | null, max = 1.4) {
  if (!el) return;
  try {
    el.animate(
      [{ transform: "scale(1)" }, { transform: `scale(${max})` }, { transform: "scale(1)" }],
      { duration: 320, easing: "ease-out" }
    );
  } catch {}
}

function shortHandle(userId: string, handles?: Map<string, string>): string {
  const custom = handles?.get(userId);
  if (custom) return custom;
  const stripped = userId.includes(":") ? userId.slice(userId.indexOf(":") + 1) : userId;
  return stripped.slice(0, 8);
}

// ---------------------------------------------------------------------------
// Hooks deriving derived state from queries
// ---------------------------------------------------------------------------

type Stores = {
  chirps: Chirp[];
  myLikes: Like[];
  allLikes: Like[];
  myFollowing: Follow[];
  allFollows: Follow[];
  inboxMessages: Message[];
  sentMessages: Message[];
  profiles: Profile[];
  reposts: Repost[];
  myReposts: Repost[];
  notifications: Notification[];
  conversationReads: ConversationRead[];
  notificationReads: NotificationRead[];
};

function useStores(): Stores {
  return {
    chirps: useQuery<Chirp[]>("feed") ?? [],
    myLikes: useQuery<Like[]>("myLikes") ?? [],
    allLikes: useQuery<Like[]>("allLikes") ?? [],
    myFollowing: useQuery<Follow[]>("myFollowing") ?? [],
    allFollows: useQuery<Follow[]>("allFollows") ?? [],
    inboxMessages: useQuery<Message[]>("inboxMessages") ?? [],
    sentMessages: useQuery<Message[]>("sentMessages") ?? [],
    profiles: useQuery<Profile[]>("allProfiles") ?? [],
    reposts: useQuery<Repost[]>("allReposts") ?? [],
    myReposts: useQuery<Repost[]>("myReposts") ?? [],
    notifications: useQuery<Notification[]>("myNotifications") ?? [],
    conversationReads: useQuery<ConversationRead[]>("myConversationReads") ?? [],
    notificationReads: useQuery<NotificationRead[]>("myNotificationReads") ?? []
  };
}

function buildUserDirectory(stores: Stores): Map<string, UserSummary> {
  const dir = new Map<string, UserSummary>();
  for (const c of stores.chirps) {
    if (!dir.has(c.authorId)) {
      dir.set(c.authorId, { id: c.authorId, name: c.authorName, picture: c.authorPicture });
    }
  }
  for (const m of [...stores.inboxMessages, ...stores.sentMessages]) {
    if (!dir.has(m.fromId)) dir.set(m.fromId, { id: m.fromId, name: m.fromName, picture: m.fromPicture });
    if (!dir.has(m.toId)) dir.set(m.toId, { id: m.toId, name: m.toName, picture: m.toPicture });
  }
  return dir;
}

// ---------------------------------------------------------------------------
// Composer
// ---------------------------------------------------------------------------

function Composer({
  authorName,
  authorPicture,
  onPost,
  disabled,
  placeholder = "What's happening?",
  submitLabel = "Chirp"
}: {
  authorName: string;
  authorPicture?: string;
  onPost: (text: string) => Promise<void> | void;
  disabled?: boolean;
  placeholder?: string;
  submitLabel?: string;
}) {
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const clean = cleanChirpText(text);
  const valid = isValidChirp(clean);
  const remaining = MAX_CHIRP_LENGTH - clean.length;
  const danger = remaining < 20;

  async function submit() {
    if (!valid || busy) return;
    setBusy(true);
    try {
      await onPost(clean);
      setText("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex gap-3 border-b border-neutral-900 px-4 py-4">
      <Avatar name={authorName} picture={authorPicture} />
      <div className="flex min-w-0 flex-1 flex-col">
        <textarea
          disabled={disabled || busy}
          value={text}
          onInput={(e) => setText((e.currentTarget as HTMLTextAreaElement).value)}
          onKeyDown={(e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
              e.preventDefault();
              void submit();
            }
          }}
          placeholder={placeholder}
          rows={2}
          className="w-full resize-none bg-transparent text-lg text-white placeholder-neutral-500 outline-none disabled:opacity-50"
        />
        <div className="mt-2 flex items-center justify-between">
          <span
            className={cn(
              "font-mono text-xs",
              danger ? "text-amber-400" : "text-neutral-500",
              remaining < 0 && "text-red-500"
            )}
          >
            {remaining}
          </span>
          <Button onClick={() => void submit()} disabled={!valid || busy || disabled} size="sm">
            <FeatherIcon size={16} />
            {submitLabel}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Chirp card
// ---------------------------------------------------------------------------

function ChirpCard({
  chirp,
  liked,
  likeCount,
  reposted,
  repostCount,
  reposter,
  isOwn,
  isFollowing,
  handles,
  handleToUserId,
  navigate,
  onOpen,
  onReply,
  onToggleLike,
  onToggleFollow,
  onToggleRepost,
  onDelete,
  rootRef
}: {
  chirp: Chirp;
  liked: boolean;
  likeCount: number;
  reposted: boolean;
  repostCount: number;
  reposter?: UserSummary;
  isOwn: boolean;
  isFollowing: boolean;
  handles: Map<string, string>;
  handleToUserId: Map<string, string>;
  navigate: (r: Route) => void;
  onToggleLike: () => void;
  onToggleFollow: () => void;
  onToggleRepost: () => void;
  onReply: () => void;
  onOpen: () => void;
  onDelete: () => void;
  rootRef?: (el: HTMLElement | null) => void;
}) {
  const openProfile = () => navigate({ name: "profile", userId: chirp.authorId });
  const heartRef = useRef<HTMLSpanElement | null>(null);
  const repostRef = useRef<HTMLSpanElement | null>(null);
  const prevLiked = useRef(liked);
  const prevReposted = useRef(reposted);
  useEffect(() => {
    if (!prevLiked.current && liked) pulse(heartRef.current, 1.5);
    prevLiked.current = liked;
  }, [liked]);
  useEffect(() => {
    if (!prevReposted.current && reposted) pulse(repostRef.current, 1.35);
    prevReposted.current = reposted;
  }, [reposted]);
  return (
    <article
      ref={rootRef as any}
      className="border-b border-neutral-900 px-4 py-3 transition-colors hover:bg-neutral-950"
    >
      {reposter ? (
        <div className="mb-1 flex items-center gap-2 pl-8 text-xs text-neutral-500">
          <RepeatIcon size={14} />
          <button
            onClick={() => navigate({ name: "profile", userId: reposter.id })}
            className="hover:underline"
          >
            {reposter.name || "anon"} reposted
          </button>
        </div>
      ) : null}
      <div className="flex gap-3">
      <Avatar name={chirp.authorName} picture={chirp.authorPicture} onClick={openProfile} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex flex-wrap items-center gap-x-2 text-sm">
          <button onClick={openProfile} className="truncate font-semibold text-white hover:underline">
            {chirp.authorName || "anon"}
          </button>
          <button onClick={openProfile} className="truncate text-neutral-500 hover:underline">
            @{shortHandle(chirp.authorId, handles)}
          </button>
          <span className="text-neutral-600">·</span>
          <time className="text-neutral-500" title={new Date(chirp.createdAt).toLocaleString()}>
            {timeAgo(chirp.createdAt)}
          </time>
          {!isOwn ? (
            <button
              onClick={onToggleFollow}
              className={cn(
                "ml-auto rounded-full border px-3 py-0.5 text-xs font-semibold transition-colors",
                isFollowing
                  ? "border-neutral-800 text-neutral-300 hover:border-red-900 hover:bg-red-950/40 hover:text-red-400"
                  : "border-neutral-700 text-white hover:bg-neutral-900"
              )}
            >
              {isFollowing ? "Following" : "Follow"}
            </button>
          ) : null}
        </header>
        {chirp.replyToAuthorId ? (
          <div className="text-xs text-neutral-500">
            Replying to{" "}
            <button
              onClick={() => navigate({ name: "profile", userId: chirp.replyToAuthorId })}
              className="text-purple-400 hover:underline"
            >
              @{chirp.replyToAuthorHandle || shortHandle(chirp.replyToAuthorId, handles)}
            </button>
          </div>
        ) : null}
        <p
          onClick={onOpen}
          className="mt-1 cursor-pointer whitespace-pre-wrap break-words text-[15px] text-neutral-100"
        >
          <RichText text={chirp.text} navigate={navigate} handleToUserId={handleToUserId} />
        </p>
        <footer className="mt-3 flex max-w-md items-center justify-between text-neutral-500">
          <ActionButton
            icon={<MessageIcon size={18} />}
            hoverColor="hover:text-purple-400"
            label="Reply"
            onClick={onReply}
          />
          <button
            onClick={onToggleRepost}
            className={cn(
              "group flex items-center gap-1.5 text-sm transition-colors",
              reposted ? "text-emerald-400" : "hover:text-emerald-400"
            )}
            aria-label="Repost"
          >
            <span ref={repostRef} className="rounded-full p-2 group-hover:bg-emerald-950/40">
              <RepeatIcon size={18} />
            </span>
            {repostCount > 0 ? <span className="tabular-nums">{repostCount}</span> : null}
          </button>
          <button
            onClick={onToggleLike}
            className={cn(
              "group flex items-center gap-1.5 text-sm transition-colors",
              liked ? "text-pink-500" : "hover:text-pink-500"
            )}
          >
            <span ref={heartRef} className="rounded-full p-2 group-hover:bg-pink-950/40">
              <HeartIcon size={18} filled={liked} />
            </span>
            {likeCount > 0 ? <span className="tabular-nums">{likeCount}</span> : null}
          </button>
          <ActionButton icon={<ShareIcon size={18} />} hoverColor="hover:text-purple-400" label="Share" />
          {isOwn ? (
            <button
              onClick={onDelete}
              className="group flex items-center gap-1.5 text-sm transition-colors hover:text-red-500"
              aria-label="Delete chirp"
            >
              <span className="rounded-full p-2 group-hover:bg-red-950/40">
                <TrashIcon size={18} />
              </span>
            </button>
          ) : null}
        </footer>
      </div>
      </div>
    </article>
  );
}

function ActionButton({
  icon,
  hoverColor,
  label,
  onClick
}: {
  icon: JSX.Element;
  hoverColor: string;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      aria-label={label}
      type="button"
      onClick={onClick}
      className={cn("group flex items-center gap-1.5 text-sm transition-colors", hoverColor)}
    >
      <span className="rounded-full p-2 group-hover:bg-neutral-900">{icon}</span>
    </button>
  );
}

// ---------------------------------------------------------------------------
// Chirp list (handles empty state)
// ---------------------------------------------------------------------------

type FeedEntry = { chirp: Chirp; reposter?: UserSummary; key: string };

function ChirpList({
  entries,
  emptyMessage,
  ctx
}: {
  entries: FeedEntry[];
  emptyMessage: string;
  ctx: AppCtx;
}) {
  const seen = useRef(new Set<string>());
  const animateRef = useAnimateOnEnter(seen);
  if (entries.length === 0) {
    return <div className="px-4 py-16 text-center text-sm text-neutral-500">{emptyMessage}</div>;
  }
  return (
    <>
      {entries.map(({ chirp, reposter, key }) => (
        <ChirpCard
          key={key}
          rootRef={animateRef(key)}
          chirp={chirp}
          liked={ctx.likedSet.has(chirp.id)}
          likeCount={ctx.likeCounts.get(chirp.id) ?? 0}
          reposted={ctx.myRepostSet.has(chirp.id)}
          repostCount={ctx.repostCounts.get(chirp.id) ?? 0}
          reposter={reposter}
          isOwn={chirp.authorId === ctx.me}
          isFollowing={ctx.followingSet.has(chirp.authorId)}
          handles={ctx.handles}
          handleToUserId={ctx.handleToUserId}
          navigate={ctx.navigate}
          onOpen={() => ctx.navigate({ name: "chirp", chirpId: chirp.id })}
          onReply={() => ctx.navigate({ name: "chirp", chirpId: chirp.id })}
          onToggleLike={() => void ctx.toggleLike(chirp.id)}
          onToggleFollow={() => void ctx.toggleFollow(chirp.authorId)}
          onToggleRepost={() => void ctx.toggleRepost(chirp.id)}
          onDelete={() => {
            if (confirm("Delete this chirp?")) void ctx.deleteChirp(chirp.id);
          }}
        />
      ))}
    </>
  );
}

function entriesFromChirps(chirps: Chirp[]): FeedEntry[] {
  return chirps.map((c) => ({ chirp: c, key: c.id }));
}

function buildTimeline(ctx: AppCtx, chirps: Chirp[]): FeedEntry[] {
  const chirpById = new Map(ctx.stores.chirps.map((c) => [c.id, c]));
  const entries: FeedEntry[] = chirps.map((c) => ({
    chirp: c,
    key: `c:${c.id}`,
    at: c.createdAt
  } as FeedEntry & { at: string }));
  for (const r of ctx.stores.reposts) {
    const c = chirpById.get(r.chirpId);
    if (!c) continue;
    entries.push({
      chirp: c,
      reposter: { id: r.userId, name: r.userName, picture: r.userPicture },
      key: `r:${r.id}`,
      at: r.createdAt
    } as FeedEntry & { at: string });
  }
  entries.sort((a, b) => ((b as any).at as string).localeCompare((a as any).at as string));
  return entries;
}

// ---------------------------------------------------------------------------
// Page chrome
// ---------------------------------------------------------------------------

function PageHeader({
  title,
  subtitle,
  onBack
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}) {
  return (
    <header className="sticky top-0 z-10 flex items-center gap-4 border-b border-neutral-900 bg-black/80 px-4 py-3 backdrop-blur">
      {onBack ? (
        <button
          onClick={onBack}
          className="-ml-2 rounded-full p-2 text-neutral-300 hover:bg-neutral-900 hover:text-white"
          aria-label="Back"
        >
          <ArrowLeftIcon size={18} />
        </button>
      ) : null}
      <div className="min-w-0">
        <h1 className="truncate text-xl font-bold">{title}</h1>
        {subtitle ? <p className="truncate text-xs text-neutral-500">{subtitle}</p> : null}
      </div>
    </header>
  );
}

function TabBar<T extends string>({
  tabs,
  active,
  onChange
}: {
  tabs: { key: T; label: string }[];
  active: T;
  onChange: (k: T) => void;
}) {
  return (
    <div
      className="grid border-b border-neutral-900 text-sm"
      style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}
    >
      {tabs.map(({ key, label }) => (
        <button
          key={key}
          onClick={() => onChange(key)}
          className={cn(
            "relative py-3.5 font-medium transition-colors hover:bg-neutral-950",
            active === key ? "text-white" : "text-neutral-500"
          )}
        >
          {label}
          {active === key ? (
            <span className="absolute bottom-0 left-1/2 h-1 w-14 -translate-x-1/2 rounded-full bg-purple-500" />
          ) : null}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Left nav and right rail
// ---------------------------------------------------------------------------

function LeftNav({
  authorName,
  authorPicture,
  isGuest,
  route,
  navigate,
  me,
  unreadMessages,
  unreadNotifications
}: {
  authorName: string;
  authorPicture?: string;
  isGuest: boolean;
  route: Route;
  navigate: (r: Route) => void;
  me: string;
  unreadMessages: number;
  unreadNotifications: number;
}) {
  const notifPulseRef = usePulseOnIncrease(unreadNotifications);
  const msgPulseRef = usePulseOnIncrease(unreadMessages);
  const items: { icon: typeof HomeIcon; label: string; target: Route; badge?: number; badgeRef?: any }[] = [
    { icon: HomeIcon, label: "Home", target: { name: "home" } },
    { icon: SearchIcon, label: "Explore", target: { name: "explore" } },
    { icon: BellIcon, label: "Notifications", target: { name: "notifications" }, badge: unreadNotifications, badgeRef: notifPulseRef },
    { icon: MailIcon, label: "Messages", target: { name: "messages" }, badge: unreadMessages, badgeRef: msgPulseRef },
    { icon: UserIcon, label: "Profile", target: { name: "profile", userId: me } }
  ];
  return (
    <nav className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col gap-1 border-r border-neutral-900 px-3 py-4 md:flex">
      <button onClick={() => navigate({ name: "home" })} className="mb-2 flex items-center gap-2 px-3 py-2 text-white">
        <FeatherIcon size={28} />
        <span className="text-xl font-bold tracking-tight">chirper</span>
      </button>
      {items.map(({ icon: I, label, target, badge, badgeRef }) => {
        const active = route.name === target.name;
        return (
          <button
            key={label}
            onClick={() => navigate(target)}
            className={cn(
              "flex items-center gap-4 rounded-full px-4 py-2.5 text-left text-lg transition-colors hover:bg-neutral-900",
              active ? "font-bold text-white" : "text-neutral-300"
            )}
          >
            <I size={22} />
            <span className="flex-1">{label}</span>
            {badge && badge > 0 ? (
              <span
                ref={badgeRef}
                className="ml-auto rounded-full bg-purple-500 px-2 py-0.5 text-xs font-bold text-white"
              >
                {badge > 99 ? "99+" : badge}
              </span>
            ) : null}
          </button>
        );
      })}
      <Button
        onClick={() => navigate({ name: "home" })}
        size="lg"
        className="mt-3 w-full"
        disabled={isGuest}
      >
        <FeatherIcon size={18} />
        Chirp
      </Button>
      {!isGuest ? (
        <button
          onClick={() => signOut()}
          className="mt-auto flex items-center gap-3 rounded-full px-3 py-3 text-left transition-colors hover:bg-neutral-900"
        >
          <Avatar name={authorName} picture={authorPicture} size={36} />
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-semibold text-white">{authorName}</div>
            <div className="truncate text-xs text-neutral-500">Sign out</div>
          </div>
          <LogOutIcon size={16} />
        </button>
      ) : null}
    </nav>
  );
}

function RightRail({
  suggestions,
  trendingTags,
  followingSet,
  handles,
  navigate,
  onToggleFollow,
  onSearch,
  searchValue
}: {
  suggestions: UserSummary[];
  trendingTags: { tag: string; count: number }[];
  followingSet: Set<string>;
  handles: Map<string, string>;
  navigate: (r: Route) => void;
  onToggleFollow: (id: string) => void;
  onSearch: (v: string) => void;
  searchValue: string;
}) {
  return (
    <aside className="sticky top-0 hidden h-screen w-80 shrink-0 flex-col gap-4 px-4 py-4 lg:flex">
      <div className="flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-neutral-400 focus-within:ring-1 focus-within:ring-purple-500">
        <SearchIcon size={18} />
        <input
          placeholder="Search Chirper"
          value={searchValue}
          onInput={(e) => onSearch((e.currentTarget as HTMLInputElement).value)}
          onFocus={() => navigate({ name: "explore" })}
          className="w-full bg-transparent text-sm text-white placeholder-neutral-500 outline-none"
        />
      </div>
      {trendingTags.length > 0 ? (
        <section className="rounded-2xl border border-neutral-900 bg-neutral-950 p-4">
          <h2 className="mb-3 text-lg font-bold text-white">Trends</h2>
          <ul className="flex flex-col">
            {trendingTags.map((t) => (
              <li key={t.tag}>
                <button
                  onClick={() => navigate({ name: "hashtag", tag: t.tag })}
                  className="-mx-2 flex w-full items-center justify-between rounded px-2 py-1.5 text-left hover:bg-neutral-900"
                >
                  <span className="truncate text-sm font-semibold text-white">#{t.tag}</span>
                  <span className="text-xs text-neutral-500">{t.count}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <section className="rounded-2xl border border-neutral-900 bg-neutral-950 p-4">
        <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-white">
          <SparklesIcon size={18} /> Who to follow
        </h2>
        {suggestions.length === 0 ? (
          <p className="text-sm text-neutral-500">No suggestions yet. Be the first to chirp!</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {suggestions.map((s) => {
              const following = followingSet.has(s.id);
              return (
                <li key={s.id} className="flex items-center gap-3">
                  <Avatar
                    name={s.name}
                    picture={s.picture}
                    size={36}
                    onClick={() => navigate({ name: "profile", userId: s.id })}
                  />
                  <div
                    className="min-w-0 flex-1 cursor-pointer"
                    onClick={() => navigate({ name: "profile", userId: s.id })}
                  >
                    <div className="truncate text-sm font-semibold text-white hover:underline">{s.name}</div>
                    <div className="truncate text-xs text-neutral-500">@{shortHandle(s.id, handles)}</div>
                  </div>
                  <button
                    onClick={() => onToggleFollow(s.id)}
                    className={cn(
                      "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                      following
                        ? "border border-neutral-800 text-neutral-200 hover:border-red-900 hover:bg-red-950/40 hover:text-red-400"
                        : "bg-white text-black hover:bg-neutral-200"
                    )}
                  >
                    {following ? "Following" : "Follow"}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <footer className="px-2 text-xs text-neutral-600">
        Built on Lakebed · Sign in with Google to chirp
      </footer>
    </aside>
  );
}

// ---------------------------------------------------------------------------
// AppCtx — shared bag passed down to pages
// ---------------------------------------------------------------------------

type AppCtx = {
  me: string;
  isGuest: boolean;
  authLoading: boolean;
  displayName: string;
  picture: string;
  stores: Stores;
  userDir: Map<string, UserSummary>;
  likedSet: Set<string>;
  followingSet: Set<string>;
  followerCounts: Map<string, number>;
  followingCounts: Map<string, number>;
  likeCounts: Map<string, number>;
  repostCounts: Map<string, number>;
  myRepostSet: Set<string>;
  handles: Map<string, string>;
  setHandle: (h: string) => Promise<void> | void;
  navigate: (r: Route) => void;
  postChirp: (payload: { text: string; replyToId?: string }) => Promise<void> | void;
  handleToUserId: Map<string, string>;
  deleteChirp: (id: string) => Promise<void> | void;
  toggleLike: (id: string) => Promise<void> | void;
  toggleFollow: (id: string) => Promise<void> | void;
  toggleRepost: (id: string) => Promise<void> | void;
  sendMessage: (p: { toId: string; toName: string; toPicture: string; text: string }) => Promise<void> | void;
  dismissNotification: (id: string) => Promise<void> | void;
  clearNotifications: () => Promise<void> | void;
  deleteMessage: (id: string) => Promise<void> | void;
  deleteConversation: (peerId: string) => Promise<void> | void;
  markConversationRead: (peerId: string) => Promise<void> | void;
  markNotificationsRead: () => Promise<void> | void;
  unreadByConversation: Map<string, number>;
  unreadMessageTotal: number;
  unreadNotificationsCount: number;
};

// ---------------------------------------------------------------------------
// Pages
// ---------------------------------------------------------------------------

function HomePage({ ctx }: { ctx: AppCtx }) {
  const [filter, setFilter] = useState<"foryou" | "following">("foryou");
  const visible = useMemo(() => {
    if (filter === "following") {
      return ctx.stores.chirps.filter((c) => c.authorId === ctx.me || ctx.followingSet.has(c.authorId));
    }
    return ctx.stores.chirps;
  }, [ctx.stores.chirps, filter, ctx.followingSet, ctx.me]);

  return (
    <>
      <PageHeader title="Home" />
      <TabBar
        tabs={[
          { key: "foryou", label: "For you" },
          { key: "following", label: "Following" }
        ]}
        active={filter}
        onChange={setFilter}
      />
      {ctx.isGuest ? (
        <GuestGate />
      ) : (
        <Composer
          authorName={ctx.displayName}
          authorPicture={ctx.picture}
          disabled={ctx.authLoading}
          onPost={(text) => ctx.postChirp({ text })}
        />
      )}
      <ChirpList
        entries={buildTimeline(ctx, visible)}
        emptyMessage={
          filter === "following" ? "Follow people to see their chirps here." : "No chirps yet. Be the first to post."
        }
        ctx={ctx}
      />
    </>
  );
}

function ExplorePage({ ctx }: { ctx: AppCtx }) {
  const [tab, setTab] = useState<"trending" | "latest" | "people">("trending");
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();

  const trending = useMemo(() => {
    const scored = ctx.stores.chirps.map((c) => {
      const likes = ctx.likeCounts.get(c.id) ?? 0;
      const ageHours = Math.max(1, (Date.now() - new Date(c.createdAt).getTime()) / 3_600_000);
      return { chirp: c, score: likes * 4 + 1 / ageHours };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.map((s) => s.chirp);
  }, [ctx.stores.chirps, ctx.likeCounts]);

  const filterByQuery = (list: Chirp[]) =>
    query ? list.filter((c) => c.text.toLowerCase().includes(query) || c.authorName.toLowerCase().includes(query)) : list;

  const people = useMemo(() => {
    const all = Array.from(ctx.userDir.values()).filter((u) => u.id !== ctx.me);
    if (!query) return all;
    return all.filter((u) => u.name.toLowerCase().includes(query) || u.id.toLowerCase().includes(query));
  }, [ctx.userDir, ctx.me, query]);

  return (
    <>
      <PageHeader title="Explore" />
      <div className="border-b border-neutral-900 px-4 py-3">
        <div className="flex items-center gap-2 rounded-full bg-neutral-900 px-4 py-2 text-neutral-400 focus-within:ring-1 focus-within:ring-purple-500">
          <SearchIcon size={18} />
          <input
            placeholder="Search chirps and people"
            value={q}
            onInput={(e) => setQ((e.currentTarget as HTMLInputElement).value)}
            className="w-full bg-transparent text-sm text-white placeholder-neutral-500 outline-none"
          />
        </div>
      </div>
      <TabBar
        tabs={[
          { key: "trending", label: "Trending" },
          { key: "latest", label: "Latest" },
          { key: "people", label: "People" }
        ]}
        active={tab}
        onChange={setTab}
      />
      {tab === "people" ? (
        <PeopleList people={people} ctx={ctx} />
      ) : (
        <ChirpList
          entries={entriesFromChirps(filterByQuery(tab === "trending" ? trending : ctx.stores.chirps))}
          emptyMessage={query ? "No matches. Try a different search." : "No chirps yet."}
          ctx={ctx}
        />
      )}
    </>
  );
}

function PeopleList({ people, ctx }: { people: UserSummary[]; ctx: AppCtx }) {
  if (people.length === 0) {
    return <div className="px-4 py-16 text-center text-sm text-neutral-500">No people to show.</div>;
  }
  return (
    <ul>
      {people.map((u) => {
        const following = ctx.followingSet.has(u.id);
        const isMe = u.id === ctx.me;
        return (
          <li
            key={u.id}
            className="flex items-center gap-3 border-b border-neutral-900 px-4 py-3 hover:bg-neutral-950"
          >
            <Avatar
              name={u.name}
              picture={u.picture}
              onClick={() => ctx.navigate({ name: "profile", userId: u.id })}
            />
            <div
              className="min-w-0 flex-1 cursor-pointer"
              onClick={() => ctx.navigate({ name: "profile", userId: u.id })}
            >
              <div className="truncate text-sm font-semibold text-white hover:underline">{u.name || "anon"}</div>
              <div className="truncate text-xs text-neutral-500">@{shortHandle(u.id, ctx.handles)}</div>
            </div>
            {!isMe ? (
              <button
                onClick={() => ctx.toggleFollow(u.id)}
                className={cn(
                  "rounded-full px-3 py-1 text-xs font-semibold transition-colors",
                  following
                    ? "border border-neutral-800 text-neutral-200 hover:border-red-900 hover:bg-red-950/40 hover:text-red-400"
                    : "bg-white text-black hover:bg-neutral-200"
                )}
              >
                {following ? "Following" : "Follow"}
              </button>
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

function ProfilePage({
  ctx,
  userId,
  view
}: {
  ctx: AppCtx;
  userId: string;
  view?: "chirps" | "likes" | "followers" | "following";
}) {
  const profileTab: "chirps" | "likes" = view === "likes" ? "likes" : "chirps";
  const user = ctx.userDir.get(userId) ?? { id: userId, name: "Unknown", picture: "" };
  const userChirps = useMemo(
    () => ctx.stores.chirps.filter((c) => c.authorId === userId),
    [ctx.stores.chirps, userId]
  );
  const chirpEntries = useMemo<FeedEntry[]>(() => {
    const chirpById = new Map(ctx.stores.chirps.map((c) => [c.id, c]));
    const entries: (FeedEntry & { at: string })[] = userChirps.map((c) => ({
      chirp: c,
      key: `c:${c.id}`,
      at: c.createdAt
    }));
    for (const r of ctx.stores.reposts) {
      if (r.userId !== userId) continue;
      const c = chirpById.get(r.chirpId);
      if (!c) continue;
      entries.push({
        chirp: c,
        reposter: { id: r.userId, name: r.userName, picture: r.userPicture },
        key: `r:${r.id}`,
        at: r.createdAt
      });
    }
    entries.sort((a, b) => b.at.localeCompare(a.at));
    return entries;
  }, [userChirps, ctx.stores.chirps, ctx.stores.reposts, userId]);
  const likedEntries = useMemo<FeedEntry[]>(() => {
    const ids = new Set(ctx.stores.allLikes.filter((l) => l.userId === userId).map((l) => l.chirpId));
    return ctx.stores.chirps.filter((c) => ids.has(c.id)).map((c) => ({ chirp: c, key: c.id }));
  }, [ctx.stores.allLikes, ctx.stores.chirps, userId]);

  const followers = ctx.followerCounts.get(userId) ?? 0;
  const following = ctx.followingCounts.get(userId) ?? 0;
  const isMe = userId === ctx.me;
  const amFollowing = ctx.followingSet.has(userId);
  const joinedAt = userChirps[userChirps.length - 1]?.createdAt;

  if (view === "followers" || view === "following") {
    const ids = new Set(
      view === "followers"
        ? ctx.stores.allFollows.filter((f) => f.followeeId === userId).map((f) => f.followerId)
        : ctx.stores.allFollows.filter((f) => f.followerId === userId).map((f) => f.followeeId)
    );
    const people = Array.from(ids).map(
      (id) => ctx.userDir.get(id) ?? { id, name: "anon", picture: "" }
    );
    return (
      <>
        <PageHeader
          title={user.name || "Profile"}
          subtitle={view === "followers" ? `${followers} followers` : `${following} following`}
          onBack={() => ctx.navigate({ name: "profile", userId })}
        />
        <TabBar
          tabs={[
            { key: "followers", label: "Followers" },
            { key: "following", label: "Following" }
          ]}
          active={view}
          onChange={(k) => ctx.navigate({ name: "profile", userId, view: k })}
        />
        <PeopleList people={people} ctx={ctx} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        title={user.name || "Profile"}
        subtitle={`${userChirps.length} chirps · ${chirpEntries.length - userChirps.length} reposts`}
        onBack={() => window.history.length > 1 ? window.history.back() : ctx.navigate({ name: "home" })}
      />
      <div className="h-32 bg-gradient-to-br from-purple-800 via-fuchsia-900 to-neutral-900" />
      <div className="px-4 pb-4">
        <div className="-mt-12 mb-3 flex items-end justify-between">
          <Avatar name={user.name} picture={user.picture} size={96} />
          {!isMe && !ctx.isGuest ? (
            <div className="flex gap-2">
              <button
                onClick={() => ctx.navigate({ name: "messages", peerId: userId })}
                className="rounded-full border border-neutral-800 p-2 text-neutral-200 hover:bg-neutral-900"
                aria-label="Message"
              >
                <MailIcon size={18} />
              </button>
              <button
                onClick={() => ctx.toggleFollow(userId)}
                className={cn(
                  "rounded-full px-4 py-1.5 text-sm font-semibold transition-colors",
                  amFollowing
                    ? "border border-neutral-800 text-neutral-200 hover:border-red-900 hover:bg-red-950/40 hover:text-red-400"
                    : "bg-white text-black hover:bg-neutral-200"
                )}
              >
                {amFollowing ? "Following" : "Follow"}
              </button>
            </div>
          ) : null}
        </div>
        <h2 className="text-xl font-bold text-white">{user.name || "anon"}</h2>
        <p className="text-sm text-neutral-500">@{shortHandle(userId, ctx.handles)}</p>
        {isMe && !ctx.isGuest ? <HandleEditor ctx={ctx} /> : null}
        {joinedAt ? (
          <p className="mt-2 flex items-center gap-1.5 text-sm text-neutral-500">
            <CalendarIcon size={14} />
            Joined {formatDate(joinedAt)}
          </p>
        ) : null}
        <div className="mt-3 flex gap-5 text-sm">
          <button
            onClick={() => ctx.navigate({ name: "profile", userId, view: "following" })}
            className="text-neutral-300 hover:underline"
          >
            <span className="font-bold text-white">{following}</span>{" "}
            <span className="text-neutral-500">Following</span>
          </button>
          <button
            onClick={() => ctx.navigate({ name: "profile", userId, view: "followers" })}
            className="text-neutral-300 hover:underline"
          >
            <span className="font-bold text-white">{followers}</span>{" "}
            <span className="text-neutral-500">Followers</span>
          </button>
        </div>
      </div>
      <TabBar
        tabs={[
          { key: "chirps", label: "Chirps" },
          { key: "likes", label: "Likes" }
        ]}
        active={profileTab}
        onChange={(k) => ctx.navigate({ name: "profile", userId, view: k })}
      />
      <ChirpList
        entries={profileTab === "chirps" ? chirpEntries : likedEntries}
        emptyMessage={profileTab === "chirps" ? "No chirps yet." : "No likes yet."}
        ctx={ctx}
      />
    </>
  );
}

type Conversation = {
  peerId: string;
  peer: UserSummary;
  lastMessage: Message;
  unread: number;
};

function buildConversations(ctx: AppCtx): Conversation[] {
  const all: Message[] = [...ctx.stores.inboxMessages, ...ctx.stores.sentMessages];
  const byPeer = new Map<string, Message[]>();
  for (const m of all) {
    const peerId = m.fromId === ctx.me ? m.toId : m.fromId;
    if (!byPeer.has(peerId)) byPeer.set(peerId, []);
    byPeer.get(peerId)!.push(m);
  }
  const list: Conversation[] = [];
  for (const [peerId, msgs] of byPeer) {
    msgs.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const last = msgs[msgs.length - 1];
    const peer: UserSummary = ctx.userDir.get(peerId) ?? {
      id: peerId,
      name: last.fromId === peerId ? last.fromName : last.toName,
      picture: last.fromId === peerId ? last.fromPicture : last.toPicture
    };
    list.push({ peerId, peer, lastMessage: last, unread: 0 });
  }
  list.sort((a, b) => b.lastMessage.createdAt.localeCompare(a.lastMessage.createdAt));
  return list;
}

function MessagesPage({ ctx, peerId }: { ctx: AppCtx; peerId?: string }) {
  const conversations = useMemo(() => buildConversations(ctx), [ctx]);
  const seen = useRef(new Set<string>());
  const animateRef = useAnimateOnEnter(seen);

  if (ctx.isGuest) {
    return (
      <>
        <PageHeader title="Messages" />
        <GuestGate />
      </>
    );
  }

  if (peerId) {
    const peer: UserSummary = ctx.userDir.get(peerId) ?? { id: peerId, name: "Unknown", picture: "" };
    return <Thread ctx={ctx} peer={peer} />;
  }

  return (
    <>
      <PageHeader title="Messages" subtitle={`${conversations.length} conversations`} />
      {conversations.length === 0 ? (
        <div className="px-4 py-16 text-center text-sm text-neutral-500">
          No messages yet. Open someone's profile to start a conversation.
        </div>
      ) : (
        <ul>
          {conversations.map((conv) => {
            const unread = ctx.unreadByConversation.get(conv.peerId) ?? 0;
            return (
            <li
              key={conv.peerId}
              ref={animateRef(conv.lastMessage.id) as any}
              onClick={() => ctx.navigate({ name: "messages", peerId: conv.peerId })}
              className="group flex cursor-pointer gap-3 border-b border-neutral-900 px-4 py-3 hover:bg-neutral-950"
            >
              <Avatar name={conv.peer.name} picture={conv.peer.picture} />
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("truncate text-sm", unread > 0 ? "font-bold text-white" : "font-semibold text-white")}>
                    {conv.peer.name || "anon"}
                  </span>
                  <span className="shrink-0 text-xs text-neutral-500">{timeAgo(conv.lastMessage.createdAt)}</span>
                </div>
                <p className={cn("truncate text-sm", unread > 0 ? "text-white" : "text-neutral-400")}>
                  {conv.lastMessage.fromId === ctx.me ? "You: " : ""}
                  {conv.lastMessage.text}
                </p>
              </div>
              {unread > 0 ? (
                <span className="ml-1 self-center rounded-full bg-purple-500 px-2 py-0.5 text-xs font-bold text-white">
                  {unread > 99 ? "99+" : unread}
                </span>
              ) : null}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete conversation with ${conv.peer.name || "anon"}?`)) {
                    void ctx.deleteConversation(conv.peerId);
                  }
                }}
                aria-label="Delete conversation"
                className="opacity-0 transition-opacity group-hover:opacity-100 text-neutral-500 hover:text-red-500"
              >
                <TrashIcon size={16} />
              </button>
            </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function Thread({ ctx, peer }: { ctx: AppCtx; peer: UserSummary }) {
  const convoId = conversationId(ctx.me, peer.id);
  const unreadHere = ctx.unreadByConversation.get(peer.id) ?? 0;
  const seen = useRef(new Set<string>());
  const animateRef = useAnimateOnEnter(seen);
  useEffect(() => {
    if (unreadHere > 0) void ctx.markConversationRead(peer.id);
  }, [peer.id, unreadHere]);
  const messages = useMemo(() => {
    const all = [...ctx.stores.inboxMessages, ...ctx.stores.sentMessages].filter(
      (m) => m.conversationId === convoId
    );
    const seen = new Set<string>();
    const unique = all.filter((m) => (seen.has(m.id) ? false : (seen.add(m.id), true)));
    unique.sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    return unique;
  }, [ctx.stores.inboxMessages, ctx.stores.sentMessages, convoId]);

  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length]);

  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const clean = cleanMessageText(draft);
  const valid = isValidMessage(clean);

  async function send() {
    if (!valid || busy) return;
    setBusy(true);
    try {
      await ctx.sendMessage({ toId: peer.id, toName: peer.name, toPicture: peer.picture, text: clean });
      setDraft("");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-screen flex-col">
      <PageHeader
        title={peer.name || "anon"}
        subtitle={`@${shortHandle(peer.id, ctx.handles)}`}
        onBack={() => ctx.navigate({ name: "messages" })}
      />
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4">
        {messages.length === 0 ? (
          <div className="flex h-full flex-col items-center justify-center text-center text-sm text-neutral-500">
            <Avatar name={peer.name} picture={peer.picture} size={64} />
            <p className="mt-3 text-base font-semibold text-white">{peer.name || "anon"}</p>
            <p className="text-xs text-neutral-500">@{shortHandle(peer.id, ctx.handles)}</p>
            <p className="mt-4 max-w-xs">Say hi — this is the start of your conversation.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            {messages.map((m, i) => {
              const mine = m.fromId === ctx.me;
              const prev = messages[i - 1];
              const showTime = !prev || new Date(m.createdAt).getTime() - new Date(prev.createdAt).getTime() > 5 * 60_000;
              return (
                <li key={m.id} ref={animateRef(m.id) as any} className="flex flex-col">
                  {showTime ? (
                    <div className="my-2 text-center text-xs text-neutral-600">
                      {new Date(m.createdAt).toLocaleString()}
                    </div>
                  ) : null}
                  <div className={cn("group/msg flex items-end gap-2", mine ? "justify-end" : "justify-start")}>
                    {mine ? (
                      <button
                        onClick={() => void ctx.deleteMessage(m.id)}
                        aria-label="Delete message"
                        className="mb-1 opacity-0 transition-opacity group-hover/msg:opacity-100 text-neutral-500 hover:text-red-500"
                      >
                        <TrashIcon size={14} />
                      </button>
                    ) : null}
                    <div
                      className={cn(
                        "max-w-[75%] whitespace-pre-wrap break-words rounded-2xl px-4 py-2 text-[15px]",
                        mine ? "bg-purple-600 text-white" : "bg-neutral-900 text-neutral-100"
                      )}
                    >
                      {m.text}
                    </div>
                    {!mine ? (
                      <button
                        onClick={() => void ctx.deleteMessage(m.id)}
                        aria-label="Delete message"
                        className="mb-1 opacity-0 transition-opacity group-hover/msg:opacity-100 text-neutral-500 hover:text-red-500"
                      >
                        <TrashIcon size={14} />
                      </button>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      <div className="border-t border-neutral-900 px-3 py-3">
        <div className="flex items-end gap-2 rounded-2xl bg-neutral-900 px-3 py-2 focus-within:ring-1 focus-within:ring-purple-500">
          <textarea
            value={draft}
            onInput={(e) => setDraft((e.currentTarget as HTMLTextAreaElement).value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder="Start a new message"
            rows={1}
            maxLength={MAX_MESSAGE_LENGTH + 1}
            className="max-h-32 min-h-[24px] w-full resize-none bg-transparent text-[15px] text-white placeholder-neutral-500 outline-none"
          />
          <Button
            size="icon"
            onClick={() => void send()}
            disabled={!valid || busy}
            className="bg-purple-600 text-white hover:bg-purple-500"
          >
            <SendIcon size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function NotificationsPage({ ctx }: { ctx: AppCtx }) {
  const events = ctx.stores.notifications;
  const unread = ctx.unreadNotificationsCount;
  const seen = useRef(new Set<string>());
  const animateRef = useAnimateOnEnter(seen);
  useEffect(() => {
    if (unread > 0) void ctx.markNotificationsRead();
  }, [unread]);
  return (
    <>
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-900 bg-black/80 px-4 py-3 backdrop-blur">
        <h1 className="text-xl font-bold">Notifications</h1>
        {events.length > 0 ? (
          <button
            onClick={() => {
              if (confirm("Clear all notifications?")) void ctx.clearNotifications();
            }}
            className="text-xs text-neutral-400 hover:text-white"
          >
            Clear all
          </button>
        ) : null}
      </header>
      {events.length === 0 ? (
        <div className="px-4 py-16 text-center text-sm text-neutral-500">
          Nothing yet. Likes, reposts, and follows on your chirps will show up here.
        </div>
      ) : (
        <ul>
          {events.map((n) => {
            const verb =
              n.kind === "like"
                ? "liked your chirp"
                : n.kind === "repost"
                  ? "reposted your chirp"
                  : n.kind === "reply"
                    ? "replied to your chirp"
                    : n.kind === "mention"
                      ? "mentioned you"
                      : "followed you";
            const iconColor =
              n.kind === "like"
                ? "text-pink-500"
                : n.kind === "repost"
                  ? "text-emerald-400"
                  : n.kind === "reply" || n.kind === "mention"
                    ? "text-purple-400"
                    : "text-purple-500";
            const icon =
              n.kind === "like" ? (
                <HeartIcon size={20} filled />
              ) : n.kind === "repost" ? (
                <RepeatIcon size={20} />
              ) : n.kind === "reply" || n.kind === "mention" ? (
                <MessageIcon size={20} />
              ) : (
                <UserIcon size={20} />
              );
            return (
              <li
                key={n.id}
                ref={animateRef(n.id) as any}
                onClick={() => {
                  if (n.chirpId) ctx.navigate({ name: "chirp", chirpId: n.chirpId });
                  else ctx.navigate({ name: "profile", userId: n.actorId });
                }}
                className="group flex cursor-pointer items-start gap-3 border-b border-neutral-900 px-4 py-3 hover:bg-neutral-950"
              >
                <div className={cn("mt-1 rounded-full p-1.5", iconColor)}>{icon}</div>
                <div className="min-w-0 flex-1">
                  <button
                    onClick={() => ctx.navigate({ name: "profile", userId: n.actorId })}
                    className="font-semibold text-white hover:underline"
                  >
                    {n.actorName || "someone"}
                  </button>{" "}
                  <span className="text-neutral-400">{verb}</span>
                  <div className="text-xs text-neutral-500">{timeAgo(n.createdAt)}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    void ctx.dismissNotification(n.id);
                  }}
                  aria-label="Dismiss"
                  className="opacity-0 transition-opacity group-hover:opacity-100 text-neutral-500 hover:text-white"
                >
                  <XIcon size={16} />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

function ChirpDetailPage({ ctx, chirpId }: { ctx: AppCtx; chirpId: string }) {
  const chirp = useMemo(
    () => ctx.stores.chirps.find((c) => c.id === chirpId),
    [ctx.stores.chirps, chirpId]
  );

  const ancestors = useMemo(() => {
    const list: Chirp[] = [];
    let cursor = chirp;
    const seen = new Set<string>();
    while (cursor && cursor.replyToId && !seen.has(cursor.replyToId)) {
      seen.add(cursor.replyToId);
      const parent = ctx.stores.chirps.find((c) => c.id === cursor!.replyToId);
      if (!parent) break;
      list.unshift(parent);
      cursor = parent;
    }
    return list;
  }, [ctx.stores.chirps, chirp]);

  const replies = useMemo(() => {
    if (!chirp) return [];
    return ctx.stores.chirps
      .filter((c) => c.replyToId === chirp.id)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  }, [ctx.stores.chirps, chirp]);

  if (!chirp) {
    return (
      <>
        <PageHeader title="Chirp" onBack={() => ctx.navigate({ name: "home" })} />
        <div className="px-4 py-16 text-center text-sm text-neutral-500">Chirp not found.</div>
      </>
    );
  }

  const replyHandle = ctx.handles.get(chirp.authorId) ?? shortHandle(chirp.authorId, ctx.handles);

  return (
    <>
      <PageHeader title="Chirp" onBack={() => window.history.length > 1 ? window.history.back() : ctx.navigate({ name: "home" })} />
      {ancestors.map((parent) => (
        <ChirpCard
          key={parent.id}
          chirp={parent}
          liked={ctx.likedSet.has(parent.id)}
          likeCount={ctx.likeCounts.get(parent.id) ?? 0}
          reposted={ctx.myRepostSet.has(parent.id)}
          repostCount={ctx.repostCounts.get(parent.id) ?? 0}
          isOwn={parent.authorId === ctx.me}
          isFollowing={ctx.followingSet.has(parent.authorId)}
          handles={ctx.handles}
          handleToUserId={ctx.handleToUserId}
          navigate={ctx.navigate}
          onOpen={() => ctx.navigate({ name: "chirp", chirpId: parent.id })}
          onReply={() => ctx.navigate({ name: "chirp", chirpId: parent.id })}
          onToggleLike={() => void ctx.toggleLike(parent.id)}
          onToggleFollow={() => void ctx.toggleFollow(parent.authorId)}
          onToggleRepost={() => void ctx.toggleRepost(parent.id)}
          onDelete={() => {
            if (confirm("Delete this chirp?")) void ctx.deleteChirp(parent.id);
          }}
        />
      ))}
      <article className="border-b border-neutral-900 px-4 py-4">
        <div className="flex items-center gap-3">
          <Avatar
            name={chirp.authorName}
            picture={chirp.authorPicture}
            onClick={() => ctx.navigate({ name: "profile", userId: chirp.authorId })}
          />
          <div className="min-w-0">
            <button
              onClick={() => ctx.navigate({ name: "profile", userId: chirp.authorId })}
              className="block truncate text-sm font-semibold text-white hover:underline"
            >
              {chirp.authorName || "anon"}
            </button>
            <button
              onClick={() => ctx.navigate({ name: "profile", userId: chirp.authorId })}
              className="block truncate text-sm text-neutral-500 hover:underline"
            >
              @{shortHandle(chirp.authorId, ctx.handles)}
            </button>
          </div>
        </div>
        {chirp.replyToAuthorId ? (
          <div className="mt-2 text-xs text-neutral-500">
            Replying to{" "}
            <button
              onClick={() => ctx.navigate({ name: "profile", userId: chirp.replyToAuthorId })}
              className="text-purple-400 hover:underline"
            >
              @{chirp.replyToAuthorHandle || shortHandle(chirp.replyToAuthorId, ctx.handles)}
            </button>
          </div>
        ) : null}
        <p className="mt-3 whitespace-pre-wrap break-words text-xl text-neutral-100">
          <RichText text={chirp.text} navigate={ctx.navigate} handleToUserId={ctx.handleToUserId} />
        </p>
        <div className="mt-3 text-sm text-neutral-500">
          {new Date(chirp.createdAt).toLocaleString()}
        </div>
        <div className="mt-3 flex gap-5 border-y border-neutral-900 py-2 text-sm text-neutral-400">
          <span>
            <span className="font-bold text-white">{ctx.repostCounts.get(chirp.id) ?? 0}</span> Reposts
          </span>
          <span>
            <span className="font-bold text-white">{ctx.likeCounts.get(chirp.id) ?? 0}</span> Likes
          </span>
          <span>
            <span className="font-bold text-white">{replies.length}</span> Replies
          </span>
        </div>
        <div className="mt-2 flex max-w-md items-center justify-between text-neutral-500">
          <ActionButton icon={<MessageIcon size={18} />} hoverColor="hover:text-purple-400" label="Reply" />
          <button
            onClick={() => void ctx.toggleRepost(chirp.id)}
            className={cn(
              "group flex items-center gap-1.5 text-sm transition-colors",
              ctx.myRepostSet.has(chirp.id) ? "text-emerald-400" : "hover:text-emerald-400"
            )}
            aria-label="Repost"
          >
            <span className="rounded-full p-2 group-hover:bg-emerald-950/40">
              <RepeatIcon size={18} />
            </span>
          </button>
          <button
            onClick={() => void ctx.toggleLike(chirp.id)}
            className={cn(
              "group flex items-center gap-1.5 text-sm transition-colors",
              ctx.likedSet.has(chirp.id) ? "text-pink-500" : "hover:text-pink-500"
            )}
            aria-label="Like"
          >
            <span className="rounded-full p-2 group-hover:bg-pink-950/40">
              <HeartIcon size={18} filled={ctx.likedSet.has(chirp.id)} />
            </span>
          </button>
          <ActionButton icon={<ShareIcon size={18} />} hoverColor="hover:text-purple-400" label="Share" />
        </div>
      </article>
      {ctx.isGuest ? (
        <GuestGate />
      ) : (
        <Composer
          authorName={ctx.displayName}
          authorPicture={ctx.picture}
          placeholder={`Reply to @${replyHandle}`}
          submitLabel="Reply"
          onPost={(text) => ctx.postChirp({ text, replyToId: chirp.id })}
        />
      )}
      <ChirpList
        entries={entriesFromChirps(replies)}
        emptyMessage="No replies yet. Be the first."
        ctx={ctx}
      />
    </>
  );
}

function HashtagPage({ ctx, tag }: { ctx: AppCtx; tag: string }) {
  const matches = useMemo(() => {
    const needle = tag.toLowerCase();
    return ctx.stores.chirps.filter((c) =>
      parseHashtags(c.text).includes(needle)
    );
  }, [ctx.stores.chirps, tag]);
  return (
    <>
      <PageHeader
        title={`#${tag}`}
        subtitle={`${matches.length} chirps`}
        onBack={() => window.history.length > 1 ? window.history.back() : ctx.navigate({ name: "explore" })}
      />
      <ChirpList entries={entriesFromChirps(matches)} emptyMessage="No chirps with that hashtag yet." ctx={ctx} />
    </>
  );
}

function HandleEditor({ ctx }: { ctx: AppCtx }) {
  const current = ctx.handles.get(ctx.me) ?? "";
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(current);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!editing) setValue(current);
  }, [current, editing]);

  if (!editing) {
    return (
      <button
        onClick={() => {
          setValue(current);
          setError(null);
          setEditing(true);
        }}
        className="mt-1 text-xs text-purple-400 hover:underline"
      >
        {current ? "Change @handle" : "Set your @handle"}
      </button>
    );
  }

  const clean = cleanHandle(value);
  const taken = clean !== current && Array.from(ctx.handles.entries()).some(([uid, h]) => h === clean && uid !== ctx.me);
  const ok = isValidHandle(clean) && !taken;

  async function save() {
    if (!ok || busy) return;
    setBusy(true);
    setError(null);
    try {
      await ctx.setHandle(clean);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-2 flex flex-col gap-1">
      <div className="flex items-center gap-2">
        <div className="flex items-center gap-1 rounded-full bg-neutral-900 px-3 py-1.5 text-sm focus-within:ring-1 focus-within:ring-purple-500">
          <span className="text-neutral-500">@</span>
          <input
            value={value}
            autoFocus
            disabled={busy}
            onInput={(e) => setValue((e.currentTarget as HTMLInputElement).value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") void save();
              if (e.key === "Escape") setEditing(false);
            }}
            placeholder="your_handle"
            maxLength={15}
            className="w-32 bg-transparent text-white outline-none placeholder-neutral-600"
          />
        </div>
        <Button size="sm" onClick={() => void save()} disabled={!ok || busy}>
          Save
        </Button>
        <button onClick={() => setEditing(false)} className="text-xs text-neutral-400 hover:text-white">
          Cancel
        </button>
      </div>
      <p className="text-xs text-neutral-500">
        {taken
          ? "That handle is taken."
          : !isValidHandle(clean)
            ? "3–15 chars, letters/numbers/underscore."
            : "Looks good."}
      </p>
      {error ? <p className="text-xs text-red-500">{error}</p> : null}
    </div>
  );
}

function GuestGate() {
  return (
    <div className="flex flex-col items-center gap-3 border-b border-neutral-900 px-4 py-10 text-center">
      <FeatherIcon size={32} />
      <h2 className="text-2xl font-bold">Join Chirper</h2>
      <p className="max-w-sm text-sm text-neutral-400">
        Sign in to post chirps, like posts, follow people, and send messages.
      </p>
      <SignInWithGoogle className="mt-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-black hover:bg-neutral-200" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// App
// ---------------------------------------------------------------------------

export function App() {
  useFavicon();
  const auth = useAuth();
  const stores = useStores();

  const postChirp = useMutation<[payload: { text: string; replyToId?: string }], void>("postChirp");
  const deleteChirp = useMutation<[id: string], void>("deleteChirp");
  const toggleLike = useMutation<[chirpId: string], void>("toggleLike");
  const toggleFollow = useMutation<[followeeId: string], void>("toggleFollow");
  const sendMessage = useMutation<
    [payload: { toId: string; toName: string; toPicture: string; text: string }],
    void
  >("sendMessage");
  const setHandle = useMutation<[handle: string], void>("setHandle");
  const toggleRepost = useMutation<[chirpId: string], void>("toggleRepost");
  const dismissNotification = useMutation<[id: string], void>("dismissNotification");
  const clearNotifications = useMutation<[], void>("clearNotifications");
  const deleteMessage = useMutation<[id: string], void>("deleteMessage");
  const deleteConversation = useMutation<[peerId: string], void>("deleteConversation");
  const markConversationRead = useMutation<[peerId: string], void>("markConversationRead");
  const markNotificationsRead = useMutation<[], void>("markNotificationsRead");

  const [route, navigate] = useRoute();
  const [searchValue, setSearchValue] = useState("");

  const me = auth.userId;
  const userDir = useMemo(() => buildUserDirectory(stores), [stores]);

  const likedSet = useMemo(() => new Set(stores.myLikes.map((l) => l.chirpId)), [stores.myLikes]);
  const followingSet = useMemo(() => new Set(stores.myFollowing.map((f) => f.followeeId)), [stores.myFollowing]);

  const likeCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const l of stores.allLikes) counts.set(l.chirpId, (counts.get(l.chirpId) ?? 0) + 1);
    return counts;
  }, [stores.allLikes]);

  const repostCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const r of stores.reposts) counts.set(r.chirpId, (counts.get(r.chirpId) ?? 0) + 1);
    return counts;
  }, [stores.reposts]);

  const myRepostSet = useMemo(() => new Set(stores.myReposts.map((r) => r.chirpId)), [stores.myReposts]);

  const lastReadByConvo = useMemo(() => {
    const m = new Map<string, string>();
    for (const r of stores.conversationReads) {
      const prev = m.get(r.conversationId);
      if (!prev || prev < r.createdAt) m.set(r.conversationId, r.createdAt);
    }
    return m;
  }, [stores.conversationReads]);

  const lastReadNotifications = useMemo(() => {
    let latest = "";
    for (const r of stores.notificationReads) if (r.createdAt > latest) latest = r.createdAt;
    return latest;
  }, [stores.notificationReads]);

  const unreadByConversation = useMemo(() => {
    const m = new Map<string, number>();
    for (const msg of stores.inboxMessages) {
      const peerId = msg.fromId;
      const readAt = lastReadByConvo.get(msg.conversationId) ?? "";
      if (msg.createdAt > readAt) m.set(peerId, (m.get(peerId) ?? 0) + 1);
    }
    return m;
  }, [stores.inboxMessages, lastReadByConvo]);

  const unreadMessageTotal = useMemo(() => {
    let total = 0;
    for (const n of unreadByConversation.values()) total += n;
    return total;
  }, [unreadByConversation]);

  const unreadNotificationsCount = useMemo(() => {
    if (!lastReadNotifications) return stores.notifications.length;
    return stores.notifications.filter((n) => n.createdAt > lastReadNotifications).length;
  }, [stores.notifications, lastReadNotifications]);

  const handles = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of stores.profiles) m.set(p.userId, p.handle);
    return m;
  }, [stores.profiles]);

  const handleToUserId = useMemo(() => {
    const m = new Map<string, string>();
    for (const p of stores.profiles) m.set(p.handle.toLowerCase(), p.userId);
    return m;
  }, [stores.profiles]);

  const { followerCounts, followingCounts } = useMemo(() => {
    const followerCounts = new Map<string, number>();
    const followingCounts = new Map<string, number>();
    for (const f of stores.allFollows) {
      followerCounts.set(f.followeeId, (followerCounts.get(f.followeeId) ?? 0) + 1);
      followingCounts.set(f.followerId, (followingCounts.get(f.followerId) ?? 0) + 1);
    }
    return { followerCounts, followingCounts };
  }, [stores.allFollows]);

  const ctx: AppCtx = {
    me,
    isGuest: auth.isGuest,
    authLoading: auth.isLoading,
    displayName: auth.displayName,
    picture: auth.picture,
    stores,
    userDir,
    likedSet,
    followingSet,
    followerCounts,
    followingCounts,
    likeCounts,
    repostCounts,
    myRepostSet,
    handles,
    setHandle: (h) => setHandle(h),
    navigate,
    handleToUserId,
    postChirp: (p) => postChirp(p),
    deleteChirp: (id) => deleteChirp(id),
    toggleLike: (id) => toggleLike(id),
    toggleFollow: (id) => toggleFollow(id),
    toggleRepost: (id) => toggleRepost(id),
    sendMessage: (p) => sendMessage(p),
    dismissNotification: (id) => dismissNotification(id),
    clearNotifications: () => clearNotifications(),
    deleteMessage: (id) => deleteMessage(id),
    deleteConversation: (peerId) => deleteConversation(peerId),
    markConversationRead: (peerId) => markConversationRead(peerId),
    markNotificationsRead: () => markNotificationsRead(),
    unreadByConversation,
    unreadMessageTotal,
    unreadNotificationsCount
  };

  const trendingTags = useMemo(() => {
    const counts = new Map<string, number>();
    for (const c of stores.chirps) {
      for (const t of parseHashtags(c.text)) counts.set(t, (counts.get(t) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6)
      .map(([tag, count]) => ({ tag, count }));
  }, [stores.chirps]);

  const suggestions = useMemo(() => {
    const list: UserSummary[] = [];
    for (const u of userDir.values()) {
      if (u.id === me) continue;
      if (followingSet.has(u.id)) continue;
      list.push(u);
      if (list.length >= 5) break;
    }
    return list;
  }, [userDir, me, followingSet]);

  const titleBase = useMemo(() => {
    switch (route.name) {
      case "home":
        return "Home / Chirper";
      case "explore":
        return "Explore / Chirper";
      case "notifications":
        return "Notifications / Chirper";
      case "messages":
        if (route.peerId) {
          const peer = userDir.get(route.peerId);
          return `Chat with ${peer?.name || "anon"} / Chirper`;
        }
        return "Messages / Chirper";
      case "profile": {
        const user = userDir.get(route.userId);
        const handle = handles.get(route.userId);
        return `${user?.name || "Profile"} (@${handle ?? shortHandle(route.userId)}) / Chirper`;
      }
      case "chirp": {
        const c = stores.chirps.find((x) => x.id === route.chirpId);
        if (!c) return "Chirp / Chirper";
        return `${c.authorName || "anon"} on Chirper: "${c.text.slice(0, 40)}${c.text.length > 40 ? "…" : ""}"`;
      }
      case "hashtag":
        return `#${route.tag} / Chirper`;
    }
  }, [route, userDir, handles, stores.chirps]);

  const badge = unreadMessageTotal + unreadNotificationsCount;
  useDocumentTitle(badge > 0 ? `(${badge}) ${titleBase}` : titleBase);

  let page: JSX.Element;
  switch (route.name) {
    case "home":
      page = <HomePage ctx={ctx} />;
      break;
    case "explore":
      page = <ExplorePage ctx={ctx} />;
      break;
    case "notifications":
      page = <NotificationsPage ctx={ctx} />;
      break;
    case "messages":
      page = <MessagesPage ctx={ctx} peerId={route.peerId} />;
      break;
    case "profile":
      page = <ProfilePage ctx={ctx} userId={route.userId} view={route.view} />;
      break;
    case "chirp":
      page = <ChirpDetailPage ctx={ctx} chirpId={route.chirpId} />;
      break;
    case "hashtag":
      page = <HashtagPage ctx={ctx} tag={route.tag} />;
      break;
  }

  return (
    <div className="min-h-screen bg-black text-white antialiased">
      <div className="mx-auto flex max-w-6xl">
        <LeftNav
          authorName={auth.displayName}
          authorPicture={auth.picture}
          isGuest={auth.isGuest}
          route={route}
          navigate={navigate}
          me={me}
          unreadMessages={unreadMessageTotal}
          unreadNotifications={unreadNotificationsCount}
        />
        <main className="min-h-screen w-full flex-1 border-x border-neutral-900">{page}</main>
        <RightRail
          suggestions={suggestions}
          trendingTags={trendingTags}
          followingSet={followingSet}
          handles={ctx.handles}
          navigate={navigate}
          onToggleFollow={(id) => void toggleFollow(id)}
          onSearch={setSearchValue}
          searchValue={searchValue}
        />
      </div>
    </div>
  );
}
