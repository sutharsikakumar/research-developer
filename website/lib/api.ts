export async function post<T>(url: string, body: any): Promise<T> {
  const res = await fetch(process.env.NEXT_PUBLIC_API_BASE + url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

export async function get<T>(url: string): Promise<T> {
  const res = await fetch(process.env.NEXT_PUBLIC_API_BASE + url);
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}
