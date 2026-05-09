import type { Metadata } from "next";
import About from "@/components/marketing/About";

export const metadata: Metadata = {
  title: "About Us - Veloraa",
  description:
    "Learn about Veloraa, the AI-powered talent marketplace built by two founders to connect top technical talent with ambitious companies.",
};

export default function AboutPage() {
  return <About />;
}
