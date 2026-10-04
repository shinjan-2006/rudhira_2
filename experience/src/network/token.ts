export async function getAuthToken(
  authBase: string,
  fetcher: typeof fetch = fetch,
): Promise<string> {
  // The pinned Neon SDK caches /token as a session response. Fetch the JWT
  // endpoint directly so a cached { session, user } object cannot replace it.
  const response = await fetcher(`${authBase.replace(/\/$/, "")}/token`, {
    credentials: "include",
    cache: "no-store",
    headers: { Accept: "application/json" },
  });
  if (!response.ok)
    throw new Error(
      response.status === 401
        ? "Your sign-in session could not be restored. Please sign in again."
        : "The login service is unavailable. Please try again.",
    );
  const result = await response.json();
  if (typeof result.token !== "string" || result.token.split(".").length !== 3)
    throw new Error("The login service did not provide an access token. Please sign in again.");
  return result.token;
}
