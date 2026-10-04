import { createAuthClient } from "@neondatabase/auth";
const base = import.meta.env.VITE_NEON_AUTH_URL;
if (!base || base === "[SENSITIVE]")
  throw new Error("The network login service needs configuration.");
export const auth = createAuthClient(base);
async function getToken() {
  const result = await auth.token();
  if (result.error) throw new Error("Please sign in again.");
  return result.data?.token;
}
export async function api<T>(route: string, body?: unknown): Promise<T> {
  const token = route === "public" ? null : await getToken();
  if (route !== "public" && !token)
    throw new Error("Please sign in to continue.");
  const response = await fetch(
    `/api/network?route=${encodeURIComponent(route)}`,
    {
      method: body === undefined ? "GET" : "POST",
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(body === undefined ? {} : { "Content-Type": "application/json" }),
      },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
      cache: "no-store",
    },
  );
  const result = await response.json();
  if (!response.ok)
    throw new Error(
      result.error || "The service is unavailable. Please try again.",
    );
  return result;
}
export async function getCertificate(id: string) {
  const token = await getToken();
  const response = await fetch(
    `/api/network?route=certificate&id=${encodeURIComponent(id)}`,
    { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" },
  );
  const result = await response.json();
  if (!response.ok) throw new Error(result.error);
  return result as {
    id: string;
    name: string;
    issuedAt: string;
    donatedAt: string;
    tier: string;
  };
}
