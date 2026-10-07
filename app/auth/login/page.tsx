import { LoginForm } from "@/components/login-form";

export default function Page() {
  return (
    <main className="relative flex min-h-svh w-full items-center justify-center overflow-hidden bg-background px-4 py-10 sm:px-6">
      <div className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-gold/15 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 size-96 rounded-full bg-accent/10 blur-3xl" />
      <div className="relative w-full max-w-md">
        <LoginForm />
      </div>
    </main>
  );
}
