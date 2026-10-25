import { createFileRoute } from "@tanstack/react-router";

async function respond(run: () => Promise<unknown>) {
  const { HttpError } = await import("@/lib/undertow.server");
  try {
    return Response.json(await run(), { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    if (error instanceof HttpError) return Response.json({ message: error.message }, { status: error.status });
    console.error("[undertow] unexpected", error);
    return Response.json({ message: "Something went wrong. Nothing was changed." }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/brief")({
  server: {
    handlers: {
      GET: async () => {
        const { loadState } = await import("@/lib/undertow.server");
        return respond(loadState);
      },
      POST: async ({ request }) => {
        const origin = request.headers.get("origin");
        if (!origin || origin !== new URL(request.url).origin)
          return Response.json({ message: "Actions must come from Undertow." }, { status: 403 });
        const { applyAction } = await import("@/lib/undertow.server");
        const body = await request.json().catch(() => null);
        return respond(() => applyAction(body));
      },
    },
  },
});
