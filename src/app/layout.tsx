import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Raleway, Libre_Baskerville, JetBrains_Mono } from "next/font/google";
import ThemeProvider from "@/components/providers/ThemeProvider";
import AuthProvider from "@/components/providers/AuthProvider";
import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types/db";
import "./globals.css";

const raleway = Raleway({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  variable: "--font-raleway",
  display: "swap",
});

const libreBaskerville = Libre_Baskerville({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-libre",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Veloraa — The World's Top 1% of Talent",
  description:
    "Veloraa is a premium AI-powered talent marketplace connecting the world's top 1% of vetted technical talent with world-class companies.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Hydrate auth state on the server so the nav/UI renders logged-in-aware
  // on the first paint (no flash of "Apply as Talent" while the client bootstraps).
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let profile: Profile | null = null;
  if (user) {
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();
    profile = (data as Profile | null) ?? null;
  }

  // Read the theme cookie server-side and apply `.dark` directly to <html>.
  // This replaces the old inline FOUC-prevention <script> — React 19 + Next 16
  // refuses to execute scripts inside the React component tree on the client,
  // which crashes the page during client-side re-renders. The cookie is set by
  // ThemeProvider whenever the user toggles theme.
  const cookieStore = await cookies();
  const themeCookie = cookieStore.get("veloraa-theme")?.value;
  const initialTheme: "light" | "dark" =
    themeCookie === "dark" ? "dark" : "light";

  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${raleway.variable} ${libreBaskerville.variable} ${jetbrainsMono.variable} h-full overflow-x-hidden antialiased${initialTheme === "dark" ? " dark" : ""}`}
    >
      <body className="min-h-full flex flex-col bg-page text-heading font-raleway transition-colors duration-300">
        <ThemeProvider initialTheme={initialTheme}>
          <AuthProvider initialUser={user} initialProfile={profile}>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
