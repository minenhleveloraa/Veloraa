import type { Metadata } from "next";
import ForTalent from "@/components/marketing/ForTalent";

export const metadata: Metadata = {
  title: "For Talent — Veloraa",
  description:
    "Join the world's top 1% of vetted technical talent. One application, AI-powered matching, and access to the best companies globally.",
};

export default function ForTalentPage() {
  return <ForTalent />;
}
