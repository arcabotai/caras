import { pgTable, uuid, text, timestamp, boolean, integer, varchar, pgEnum } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// Enums
export const userRoleEnum = pgEnum("user_role", ["user", "admin"]);
export const characterCategoryEnum = pgEnum("character_category", [
  "anime",
  "game",
  "fiction",
  "media",
  "custom",
  "featured",
]);
export const messageRoleEnum = pgEnum("message_role", ["user", "assistant"]);
export const reportReasonEnum = pgEnum("report_reason", [
  "inappropriate",
  "spam",
  "copyright",
  "other",
]);
export const reportStatusEnum = pgEnum("report_status", [
  "pending",
  "dismissed",
  "actioned",
]);

// Users
export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  name: varchar("name", { length: 255 }),
  avatarUrl: text("avatar_url"),
  passwordHash: text("password_hash"),
  isPremium: boolean("is_premium").default(false).notNull(),
  stripeCustomerId: varchar("stripe_customer_id", { length: 255 }),
  stripeSubscriptionId: varchar("stripe_subscription_id", { length: 255 }),
  isAdmin: boolean("is_admin").default(false).notNull(),
  whatsappNumber: varchar("whatsapp_number", { length: 20 }),
  messageCount: integer("message_count").default(0).notNull(),
  mercadopagoPaymentId: varchar("mercadopago_payment_id", { length: 255 }),
  mercadopagoSubscriptionId: varchar("mercadopago_subscription_id", { length: 255 }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// NextAuth accounts (OAuth)
export const accounts = pgTable("accounts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 255 }).notNull(),
  provider: varchar("provider", { length: 255 }).notNull(),
  providerAccountId: varchar("provider_account_id", { length: 255 }).notNull(),
  refresh_token: text("refresh_token"),
  access_token: text("access_token"),
  expires_at: integer("expires_at"),
  token_type: varchar("token_type", { length: 255 }),
  scope: text("scope"),
  id_token: text("id_token"),
  session_state: text("session_state"),
});

// Sessions
export const sessions = pgTable("sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionToken: varchar("session_token", { length: 255 }).notNull().unique(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

// Characters
export const characters = pgTable("characters", {
  id: uuid("id").primaryKey().defaultRandom(),
  creatorId: uuid("creator_id").references(() => users.id, { onDelete: "set null" }),
  name: varchar("name", { length: 255 }).notNull(),
  shortDesc: text("short_desc").notNull(),
  fullPrompt: text("full_prompt").notNull(),
  avatarUrl: text("avatar_url"),
  category: characterCategoryEnum("category").default("custom").notNull(),
  tags: text("tags").array().default([]).notNull(),
  isPublic: boolean("is_public").default(true).notNull(),
  isPremium: boolean("is_premium").default(false).notNull(),
  replyCount: integer("reply_count").default(0).notNull(),
  chatCount: integer("chat_count").default(0).notNull(),
  isFlagged: boolean("is_flagged").default(false).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Chat Sessions
export const chatSessions = pgTable("chat_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  characterId: uuid("character_id").notNull().references(() => characters.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Messages
export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").notNull().references(() => chatSessions.id, { onDelete: "cascade" }),
  role: messageRoleEnum("role").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Character Memory
export const characterMemories = pgTable("character_memories", {
  id: uuid("id").primaryKey().defaultRandom(),
  characterId: uuid("character_id").notNull().references(() => characters.id, { onDelete: "cascade" }),
  sessionId: uuid("session_id").references(() => chatSessions.id, { onDelete: "cascade" }),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Character Reactions (likes/hearts)
export const characterReactions = pgTable("character_reactions", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  characterId: uuid("character_id").notNull().references(() => characters.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Reports
export const reports = pgTable("reports", {
  id: uuid("id").primaryKey().defaultRandom(),
  reporterId: uuid("reporter_id").references(() => users.id, { onDelete: "set null" }),
  characterId: uuid("character_id").references(() => characters.id, { onDelete: "cascade" }),
  reason: reportReasonEnum("reason").notNull(),
  details: text("details"),
  status: reportStatusEnum("status").default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  sessions: many(sessions),
  characters: many(characters),
  chatSessions: many(chatSessions),
  reports: many(reports),
  reactions: many(characterReactions),
}));

export const charactersRelations = relations(characters, ({ one, many }) => ({
  creator: one(users, { fields: [characters.creatorId], references: [users.id] }),
  chatSessions: many(chatSessions),
  memories: many(characterMemories),
  reports: many(reports),
  reactions: many(characterReactions),
}));

export const chatSessionsRelations = relations(chatSessions, ({ one, many }) => ({
  user: one(users, { fields: [chatSessions.userId], references: [users.id] }),
  character: one(characters, { fields: [chatSessions.characterId], references: [characters.id] }),
  messages: many(messages),
}));

export const messagesRelations = relations(messages, ({ one }) => ({
  session: one(chatSessions, { fields: [messages.sessionId], references: [chatSessions.id] }),
}));