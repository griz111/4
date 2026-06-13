import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const choices = ["rock", "paper", "scissors"] as const;
type Choice = typeof choices[number];

export const play = mutation({
  args: { playerChoice: v.union(v.literal("rock"), v.literal("paper"), v.literal("scissors")) },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Не авторизован");

    const randomIndex = Math.floor(Math.random() * 3);
    const computerChoice = choices[randomIndex];

    let result: "win" | "lose" | "draw";
    if (args.playerChoice === computerChoice) result = "draw";
    else if (
      (args.playerChoice === "rock" && computerChoice === "scissors") ||
      (args.playerChoice === "scissors" && computerChoice === "paper") ||
      (args.playerChoice === "paper" && computerChoice === "rock")
    ) result = "win";
    else result = "lose";

    // Сохраняем игру
    await ctx.db.insert("games", {
      playerChoice: args.playerChoice,
      computerChoice,
      result,
      createdAt: Date.now(),
    });

    // Обновляем баланс пользователя
    const tokenIdentifier = identity.tokenIdentifier;
    const user = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", tokenIdentifier))
      .first();
    if (user) {
      let newCoins = user.coins;
      if (result === "win") newCoins += 10;
      else if (result === "lose") newCoins -= 5;
      // ничья – без изменений
      await ctx.db.patch(user._id, { coins: newCoins });
    }

    return { playerChoice: args.playerChoice, computerChoice, result };
  },
});

export const getLastGames = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) return [];
    const games = await ctx.db.query("games").order("desc").take(5);
    return games;
  },
});