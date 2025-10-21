export async function apiClient<T>(
    path: string,
    opts: { method?: string; body?: any; token?: string } = {}
): Promise<T> {
    const { method = "GET", body, token } = opts;

    const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`API ${method} ${path} failed: ${res.status} ${txt}`);
  }
  return res.json();
}