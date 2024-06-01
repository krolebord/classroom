import { relations, sql } from "drizzle-orm";
import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";

const defaultNow = (name = "createdAt") =>
  integer(name, { mode: "timestamp" })
    .notNull()
    .default(sql`(unixepoch())`);

export const User = sqliteTable("user", {
  id: text("id").notNull().primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),

  passwordHash: text("passwordHash"),

  createdAt: defaultNow(),
});

export const UserRelations = relations(User, ({ many }) => ({
  boards: many(Board),
  documents: many(Document),
}));

export const Session = sqliteTable("session", {
  sessionToken: text("sessionToken", { length: 255 }).notNull().primaryKey(),
  userId: text("userId")
    .notNull()
    .references(() => User.id, { onDelete: "cascade" }),
  expires: integer("expires", {
    mode: "timestamp",
  }).notNull(),
});

export const SessionRelations = relations(Session, ({ one }) => ({
  user: one(User, { fields: [Session.userId], references: [User.id] }),
}));

export const Board = sqliteTable("board", {
  id: text("id").notNull().primaryKey(),
  name: text("name").notNull(),

  createdById: text("createdById").references(() => User.id, {
    onDelete: "cascade",
  }),
  createdAt: defaultNow(),
});

export const BoardRelations = relations(Board, ({ one }) => ({
  createdBy: one(User, { fields: [Board.createdById], references: [User.id] }),
}));

export const Document = sqliteTable("document", {
  id: text("id").notNull().primaryKey(),
  name: text("name").notNull(),

  createdById: text("createdById").references(() => User.id, {
    onDelete: "cascade",
  }),
  createdAt: defaultNow(),
});

export const DocumentRelations = relations(Document, ({ one }) => ({
  createdBy: one(User, {
    fields: [Document.createdById],
    references: [User.id],
  }),
}));
