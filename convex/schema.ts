import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import { authTables } from "@convex-dev/auth/server";

export default defineSchema({
  ...authTables,
  users: defineTable({
    tokenIdentifier: v.string(),
    coins: v.number(),
  }).index("by_token", ["tokenIdentifier"]),
  games: defineTable({
    playerChoice: v.string(),
    computerChoice: v.string(),
    result: v.string(),
    createdAt: v.number(),
  }),
});