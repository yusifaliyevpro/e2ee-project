import type { Metadata } from "next";
import { LoginForm } from "./LoginForm";

export const metadata: Metadata = { title: "Locked — E2EE Presentation" };

export default function LoginPage() {
  return (
    <main className="bg-grid relative grid min-h-svh place-items-center overflow-hidden px-4">
      <div className="pointer-events-none absolute -top-40 -left-40 size-[36rem] rounded-full bg-[var(--glow-a)] blur-3xl" />
      <div className="pointer-events-none absolute -right-40 -bottom-40 size-[36rem] rounded-full bg-[var(--glow-b)] blur-3xl" />
      <LoginForm />
    </main>
  );
}
