import { auth } from "@/lib/auth";
import { countNewOrders } from "@/server/admin/orders";

export async function GET(request: Request): Promise<Response> {
  const session = await auth.api.getSession({ headers: request.headers });
  if (!session || session.user.role !== "ADMIN") return new Response("Not found", { status: 404 });
  const since = new Date(new URL(request.url).searchParams.get("since") ?? "");
  if (Number.isNaN(since.getTime())) return Response.json({ error: "since invalide" }, { status: 400 });
  return Response.json(await countNewOrders(since), { headers: { "Cache-Control": "no-store" } });
}
