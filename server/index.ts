import { capsule, mutation, query, string, table } from "lakebed/server";
import {
  cleanChirpText,
  cleanHandle,
  cleanMessageText,
  conversationId,
  isValidChirp,
  isValidHandle,
  isValidMessage,
  parseMentions
} from "../shared/types";

export default capsule({
  name: "chirper",

  schema: {
    chirps: table({
      text: string(),
      authorId: string(),
      authorName: string(),
      authorPicture: string().default(""),
      replyToId: string().default(""),
      replyToAuthorId: string().default(""),
      replyToAuthorHandle: string().default("")
    }),
    likes: table({
      chirpId: string(),
      userId: string()
    }),
    follows: table({
      followerId: string(),
      followeeId: string()
    }),
    profiles: table({
      userId: string(),
      handle: string()
    }),
    reposts: table({
      chirpId: string(),
      userId: string(),
      userName: string(),
      userPicture: string().default("")
    }),
    notifications: table({
      userId: string(),
      kind: string(),
      actorId: string(),
      actorName: string(),
      actorPicture: string().default(""),
      chirpId: string().default("")
    }),
    conversationReads: table({
      userId: string(),
      conversationId: string()
    }),
    notificationReads: table({
      userId: string()
    }),
    messages: table({
      conversationId: string(),
      fromId: string(),
      toId: string(),
      fromName: string(),
      fromPicture: string().default(""),
      toName: string(),
      toPicture: string().default(""),
      text: string()
    })
  },

  queries: {
    feed: query((ctx) => ctx.db.chirps.orderBy("createdAt", "desc").all()),
    myLikes: query((ctx) => ctx.db.likes.where("userId", ctx.auth.userId).all()),
    allLikes: query((ctx) => ctx.db.likes.all()),
    myFollowing: query((ctx) => ctx.db.follows.where("followerId", ctx.auth.userId).all()),
    allFollows: query((ctx) => ctx.db.follows.all()),
    inboxMessages: query((ctx) => ctx.db.messages.where("toId", ctx.auth.userId).all()),
    sentMessages: query((ctx) => ctx.db.messages.where("fromId", ctx.auth.userId).all()),
    allProfiles: query((ctx) => ctx.db.profiles.all()),
    allReposts: query((ctx) => ctx.db.reposts.all()),
    myReposts: query((ctx) => ctx.db.reposts.where("userId", ctx.auth.userId).all()),
    myNotifications: query((ctx) =>
      ctx.db.notifications.where("userId", ctx.auth.userId).orderBy("createdAt", "desc").all()
    ),
    myConversationReads: query((ctx) =>
      ctx.db.conversationReads.where("userId", ctx.auth.userId).all()
    ),
    myNotificationReads: query((ctx) =>
      ctx.db.notificationReads.where("userId", ctx.auth.userId).all()
    )
  },

  mutations: {
    postChirp: mutation((ctx, payload: { text: string; replyToId?: string }) => {
      const clean = cleanChirpText(payload.text);
      if (!isValidChirp(clean) || ctx.auth.isGuest) return;

      let replyToId = "";
      let replyToAuthorId = "";
      let replyToAuthorHandle = "";
      if (payload.replyToId) {
        const parent = ctx.db.chirps.where("id", payload.replyToId).all()[0];
        if (parent) {
          replyToId = parent.id;
          replyToAuthorId = parent.authorId;
          const parentProfile = ctx.db.profiles.where("userId", parent.authorId).all()[0];
          replyToAuthorHandle = parentProfile?.handle ?? "";
        }
      }

      const inserted = ctx.db.chirps.insert({
        text: clean,
        authorId: ctx.auth.userId,
        authorName: ctx.auth.displayName || "anon",
        authorPicture: ctx.auth.picture || "",
        replyToId,
        replyToAuthorId,
        replyToAuthorHandle
      });

      const newChirpId = inserted?.id ?? "";
      const notified = new Set<string>();

      if (replyToAuthorId && replyToAuthorId !== ctx.auth.userId) {
        ctx.db.notifications.insert({
          userId: replyToAuthorId,
          kind: "reply",
          actorId: ctx.auth.userId,
          actorName: ctx.auth.displayName || "anon",
          actorPicture: ctx.auth.picture || "",
          chirpId: newChirpId
        });
        notified.add(replyToAuthorId);
      }

      const handles = parseMentions(clean);
      for (const h of handles) {
        const profile = ctx.db.profiles.where("handle", h).all()[0];
        if (!profile) continue;
        if (profile.userId === ctx.auth.userId) continue;
        if (notified.has(profile.userId)) continue;
        ctx.db.notifications.insert({
          userId: profile.userId,
          kind: "mention",
          actorId: ctx.auth.userId,
          actorName: ctx.auth.displayName || "anon",
          actorPicture: ctx.auth.picture || "",
          chirpId: newChirpId
        });
        notified.add(profile.userId);
      }
    }),

    deleteChirp: mutation((ctx, chirpId: string) => {
      const chirp = ctx.db.chirps.where("id", chirpId).all()[0];
      if (!chirp || chirp.authorId !== ctx.auth.userId) return;
      ctx.db.chirps.where("id", chirpId).delete();
      for (const l of ctx.db.likes.where("chirpId", chirpId).all()) {
        ctx.db.likes.where("id", l.id).delete();
      }
      for (const r of ctx.db.reposts.where("chirpId", chirpId).all()) {
        ctx.db.reposts.where("id", r.id).delete();
      }
      for (const n of ctx.db.notifications.where("chirpId", chirpId).all()) {
        ctx.db.notifications.where("id", n.id).delete();
      }
    }),

    toggleLike: mutation((ctx, chirpId: string) => {
      if (ctx.auth.isGuest) return;
      const mine = ctx.db.likes.where("userId", ctx.auth.userId).all();
      const existing = mine.find((l) => l.chirpId === chirpId);
      if (existing) {
        ctx.db.likes.where("id", existing.id).delete();
        return;
      }
      ctx.db.likes.insert({ chirpId, userId: ctx.auth.userId });
      const chirp = ctx.db.chirps.where("id", chirpId).all()[0];
      if (chirp && chirp.authorId !== ctx.auth.userId) {
        ctx.db.notifications.insert({
          userId: chirp.authorId,
          kind: "like",
          actorId: ctx.auth.userId,
          actorName: ctx.auth.displayName || "anon",
          actorPicture: ctx.auth.picture || "",
          chirpId
        });
      }
    }),

    toggleFollow: mutation((ctx, followeeId: string) => {
      if (ctx.auth.isGuest || followeeId === ctx.auth.userId) return;
      const mine = ctx.db.follows.where("followerId", ctx.auth.userId).all();
      const existing = mine.find((f) => f.followeeId === followeeId);
      if (existing) {
        ctx.db.follows.where("id", existing.id).delete();
        return;
      }
      ctx.db.follows.insert({ followerId: ctx.auth.userId, followeeId });
      ctx.db.notifications.insert({
        userId: followeeId,
        kind: "follow",
        actorId: ctx.auth.userId,
        actorName: ctx.auth.displayName || "anon",
        actorPicture: ctx.auth.picture || "",
        chirpId: ""
      });
    }),

    toggleRepost: mutation((ctx, chirpId: string) => {
      if (ctx.auth.isGuest) return;
      const mine = ctx.db.reposts.where("userId", ctx.auth.userId).all();
      const existing = mine.find((r) => r.chirpId === chirpId);
      if (existing) {
        ctx.db.reposts.where("id", existing.id).delete();
        return;
      }
      const chirp = ctx.db.chirps.where("id", chirpId).all()[0];
      if (!chirp) return;
      ctx.db.reposts.insert({
        chirpId,
        userId: ctx.auth.userId,
        userName: ctx.auth.displayName || "anon",
        userPicture: ctx.auth.picture || ""
      });
      if (chirp.authorId !== ctx.auth.userId) {
        ctx.db.notifications.insert({
          userId: chirp.authorId,
          kind: "repost",
          actorId: ctx.auth.userId,
          actorName: ctx.auth.displayName || "anon",
          actorPicture: ctx.auth.picture || "",
          chirpId
        });
      }
    }),

    dismissNotification: mutation((ctx, notificationId: string) => {
      const n = ctx.db.notifications.where("id", notificationId).all()[0];
      if (!n || n.userId !== ctx.auth.userId) return;
      ctx.db.notifications.where("id", notificationId).delete();
    }),

    clearNotifications: mutation((ctx) => {
      for (const n of ctx.db.notifications.where("userId", ctx.auth.userId).all()) {
        ctx.db.notifications.where("id", n.id).delete();
      }
    }),

    deleteMessage: mutation((ctx, messageId: string) => {
      const m = ctx.db.messages.where("id", messageId).all()[0];
      if (!m) return;
      if (m.fromId !== ctx.auth.userId && m.toId !== ctx.auth.userId) return;
      ctx.db.messages.where("id", messageId).delete();
    }),

    markConversationRead: mutation((ctx, peerId: string) => {
      if (ctx.auth.isGuest) return;
      ctx.db.conversationReads.insert({
        userId: ctx.auth.userId,
        conversationId: conversationId(ctx.auth.userId, peerId)
      });
    }),

    markNotificationsRead: mutation((ctx) => {
      if (ctx.auth.isGuest) return;
      ctx.db.notificationReads.insert({ userId: ctx.auth.userId });
    }),

    deleteConversation: mutation((ctx, peerId: string) => {
      if (ctx.auth.isGuest) return;
      const inbox = ctx.db.messages.where("toId", ctx.auth.userId).all().filter((m) => m.fromId === peerId);
      const sent = ctx.db.messages.where("fromId", ctx.auth.userId).all().filter((m) => m.toId === peerId);
      for (const m of [...inbox, ...sent]) {
        ctx.db.messages.where("id", m.id).delete();
      }
    }),

    setHandle: mutation((ctx, raw: string) => {
      if (ctx.auth.isGuest) return;
      const handle = cleanHandle(raw);
      if (!isValidHandle(handle)) return;
      const taken = ctx.db.profiles
        .where("handle", handle)
        .all()
        .find((p) => p.userId !== ctx.auth.userId);
      if (taken) return;
      for (const p of ctx.db.profiles.where("userId", ctx.auth.userId).all()) {
        ctx.db.profiles.where("id", p.id).delete();
      }
      ctx.db.profiles.insert({ userId: ctx.auth.userId, handle });
    }),

    sendMessage: mutation(
      (ctx, payload: { toId: string; toName: string; toPicture: string; text: string }) => {
        if (ctx.auth.isGuest) return;
        const clean = cleanMessageText(payload.text);
        if (!isValidMessage(clean)) return;
        if (!payload.toId || payload.toId === ctx.auth.userId) return;
        ctx.db.messages.insert({
          conversationId: conversationId(ctx.auth.userId, payload.toId),
          fromId: ctx.auth.userId,
          toId: payload.toId,
          fromName: ctx.auth.displayName || "anon",
          fromPicture: ctx.auth.picture || "",
          toName: payload.toName || "anon",
          toPicture: payload.toPicture || "",
          text: clean
        });
      }
    )
  }
});
