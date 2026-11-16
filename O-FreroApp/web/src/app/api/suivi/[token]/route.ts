import { getTracking } from "@/server/lifecycle";

export async function GET(_request: Request, ctx: RouteContext<"/api/suivi/[token]">): Promise<Response> {
  const { token } = await ctx.params;
  const view = await getTracking(token);
  if (!view) return Response.json({ error: "Commande introuvable" }, { status: 404, headers: { "Cache-Control": "no-store" } });
  return Response.json(view, { headers: { "Cache-Control": "no-store" } });
}
