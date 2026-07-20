import { router, createProtectedProcedure } from "../prod/trpc";
import { copilotChatInputSchema } from "shared/schemas/copilot";

export const copilotRouter = router({
  chat: createProtectedProcedure("copilot", "create")
    .input(copilotChatInputSchema)
    .mutation(async ({ ctx, input }) => {
      return await ctx.services.copilot.chat(ctx.user, input);
    }),
});
