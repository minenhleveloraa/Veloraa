import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { UserRole } from "@/lib/types/db";

export default async function ChooseRolePage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  const { role } = await searchParams;
  if (role !== "talent" && role !== "company") redirect("/profile");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/sign-in");

  await supabase
    .from("profiles")
    .update({ role: role as UserRole })
    .eq("id", user.id);

  redirect("/profile");
}
