"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE, checkPassword, expectedSessionToken, passwordConfigured } from "@/lib/auth";

export type LoginState = { error: string | null };

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  if (!passwordConfigured()) {
    return { error: "PRESENTER_PASSWORD is not set on the server. Add it to .env.local and restart." };
  }
  const password = formData.get("password");
  if (typeof password !== "string" || !(await checkPassword(password))) {
    // Slow down guessing
    await new Promise((r) => setTimeout(r, 700));
    return { error: "Wrong password. Access denied." };
  }

  const token = await expectedSessionToken();
  const proto = (await headers()).get("x-forwarded-proto");
  (await cookies()).set(SESSION_COOKIE, token!, {
    httpOnly: true,
    sameSite: "lax",
    secure: proto === "https",
    path: "/",
    maxAge: 60 * 60 * 12,
  });
  return redirect("/");
}
