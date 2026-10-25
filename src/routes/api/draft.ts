import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/api/draft")({
  server: { handlers: { POST: async ({ request }) => {
    const { handleDraft } = await import("@/lib/ai/draft.server");
    return handleDraft(request);
  } } },
});