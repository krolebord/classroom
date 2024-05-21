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
