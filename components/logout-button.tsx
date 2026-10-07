"use client";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";

export function LogoutButton({ variant = "default" }: { variant?: "default" | "nav" | "mobile" }) {
  const router = useRouter();

  const logout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/auth/login");
  };

  if (variant === "nav") {
    return <button type="button" onClick={logout} className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"><LogOut className="size-4" aria-hidden="true" /> Salir</button>;
  }
  if (variant === "mobile") {
    return <button type="button" onClick={logout} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground"><LogOut className="size-4" aria-hidden="true" /> Salir</button>;
  }
  return <Button onClick={logout}>Salir</Button>;
}
