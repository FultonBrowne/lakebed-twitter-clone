export const MAX_CHIRP_LENGTH = 280;
export const MAX_MESSAGE_LENGTH = 1000;

export type Chirp = {
  id: string;
  text: string;
  authorId: string;
  authorName: string;
  authorPicture: string;
  replyToId: string;
  replyToAuthorId: string;
  replyToAuthorHandle: string;
  createdAt: string;
  updatedAt: string;
};

export type Like = {
  id: string;
  chirpId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type Follow = {
  id: string;
  followerId: string;
  followeeId: string;
  createdAt: string;
  updatedAt: string;
};

export type Message = {
  id: string;
  conversationId: string;
  fromId: string;
  toId: string;
  fromName: string;
  fromPicture: string;
  toName: string;
  toPicture: string;
  text: string;
  createdAt: string;
  updatedAt: string;
};

export type UserSummary = {
  id: string;
  name: string;
  picture: string;
  handle?: string;
};

export type Profile = {
  id: string;
  userId: string;
  handle: string;
  createdAt: string;
  updatedAt: string;
};

export type Repost = {
  id: string;
  chirpId: string;
  userId: string;
  userName: string;
  userPicture: string;
  createdAt: string;
  updatedAt: string;
};

export type NotificationKind = "like" | "follow" | "repost" | "mention" | "reply";

const MENTION_RE = /@([a-z0-9_]{3,15})/gi;
const HASHTAG_RE = /#([a-z0-9_]{1,30})/gi;

export function parseMentions(text: string): string[] {
  const set = new Set<string>();
  const matches = text.match(MENTION_RE);
  if (!matches) return [];
  for (const m of matches) set.add(m.slice(1).toLowerCase());
  return Array.from(set);
}

export function parseHashtags(text: string): string[] {
  const set = new Set<string>();
  const matches = text.match(HASHTAG_RE);
  if (!matches) return [];
  for (const m of matches) set.add(m.slice(1).toLowerCase());
  return Array.from(set);
}

export type RichSegment =
  | { kind: "text"; value: string }
  | { kind: "mention"; handle: string }
  | { kind: "hashtag"; tag: string }
  | { kind: "url"; href: string };

export function parseRichText(text: string): RichSegment[] {
  const re = /(@[a-z0-9_]{3,15})|(#[a-z0-9_]{1,30})|(https?:\/\/[^\s]+)/gi;
  const out: RichSegment[] = [];
  let last = 0;
  text.replace(re, (token: string, ..._rest: unknown[]) => {
    const offset = _rest[_rest.length - 2] as number;
    if (offset > last) out.push({ kind: "text", value: text.slice(last, offset) });
    if (token.startsWith("@")) out.push({ kind: "mention", handle: token.slice(1).toLowerCase() });
    else if (token.startsWith("#")) out.push({ kind: "hashtag", tag: token.slice(1).toLowerCase() });
    else out.push({ kind: "url", href: token });
    last = offset + token.length;
    return token;
  });
  if (last < text.length) out.push({ kind: "text", value: text.slice(last) });
  return out;
}

export type Notification = {
  id: string;
  userId: string;
  kind: NotificationKind;
  actorId: string;
  actorName: string;
  actorPicture: string;
  chirpId: string;
  createdAt: string;
  updatedAt: string;
};

export type ConversationRead = {
  id: string;
  userId: string;
  conversationId: string;
  createdAt: string;
  updatedAt: string;
};

export type NotificationRead = {
  id: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
};

export type MessageReaction = {
  id: string;
  messageId: string;
  userId: string;
  emoji: string;
  createdAt: string;
  updatedAt: string;
};

export type Bookmark = {
  id: string;
  userId: string;
  chirpId: string;
  createdAt: string;
  updatedAt: string;
};

export const REACTION_EMOJI = ["👍", "❤️", "😂", "😮", "😢", "🔥"] as const;

export function cleanHandle(value: string): string {
  return value.trim().replace(/^@+/, "").toLowerCase().slice(0, 15);
}

export function isValidHandle(value: string): boolean {
  return /^[a-z0-9_]{3,15}$/.test(value);
}

export function cleanChirpText(value: string): string {
  return value.replace(/\s+$/g, "").slice(0, MAX_CHIRP_LENGTH);
}

export function isValidChirp(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_CHIRP_LENGTH;
}

export function cleanMessageText(value: string): string {
  return value.replace(/\s+$/g, "").slice(0, MAX_MESSAGE_LENGTH);
}

export function isValidMessage(value: string): boolean {
  const trimmed = value.trim();
  return trimmed.length > 0 && trimmed.length <= MAX_MESSAGE_LENGTH;
}

export function conversationId(a: string, b: string): string {
  return a < b ? `${a}:${b}` : `${b}:${a}`;
}
