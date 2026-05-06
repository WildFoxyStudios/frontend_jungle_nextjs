import { cookies } from "next/headers";
import { redirect } from "next/navigation";

/** Matches `AUTH_COOKIE` in `@jungle/hooks` use-auth — tokens live in localStorage; this flag is set on login. */
const SESSION_COOKIE = "Jungle_logged_in";

export default async function RootPage() {
 const cookieStore = await cookies();
 const hasSession =
 cookieStore.has(SESSION_COOKIE) || Boolean(cookieStore.get("access_token")?.value);

 if (hasSession) {
 redirect("/feed");
 }
 redirect("/welcome");
}
