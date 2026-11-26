import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AXX_COOKIE, AXX_MAX_AGE_SECONDS, signAxToken, verifyAxToken } from "@/lib/axxion/token";
import { getAxAccount, type AxAccount } from "@/lib/axxion/accounts";

export async function createAxSession(account: AxAccount) {
  const token = await signAxToken({ sub: account.id, role: account.role });
  (await cookies()).set(AXX_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/axxion",
    maxAge: AXX_MAX_AGE_SECONDS,
  });
}

export async function destroyAxSession() {
  (await cookies()).set(AXX_COOKIE, "", { path: "/axxion", maxAge: 0 });
}

export async function getAxUser(): Promise<AxAccount | null> {
  const token = (await cookies()).get(AXX_COOKIE)?.value;
  const session = token ? await verifyAxToken(token) : null;
  const account = getAxAccount(session?.sub);
  return account && account.role === session?.role ? account : null;
}

export async function requireAxUser(): Promise<AxAccount> {
  const user = await getAxUser();
  if (!user) redirect("/axxion/login");
  return user;
}
