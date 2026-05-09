import { redirect } from "next/navigation";
import AppChrome from "@/components/layout/AppChrome";
import { createClient } from "@/lib/supabase/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/sign-in");

  return <AppChrome>{children}</AppChrome>;
}
