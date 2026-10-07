import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export type Role = "admin" | "editor" | "author";

export async function getCurrentUser() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error) return null;
  return data.user;
}

export async function getCurrentRole(): Promise<Role | null> {
  const user = await getCurrentUser();
  if (!user) return null;
  const supabase = await createClient();
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
  return data?.role === "admin" || data?.role === "editor" || data?.role === "author" ? data.role : null;
}

export async function requireEditor() {
  const role = await getCurrentRole();
  if (role !== "admin" && role !== "editor") redirect("/auth/login?next=/admin");
  return role;
}

export async function requireAdminPanel() {
  const role = await getCurrentRole();
  if (!role) redirect("/auth/login?next=/admin");
  return role;
}
