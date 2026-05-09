import type { Metadata } from "next";
import ForCompanies from "@/components/marketing/ForCompanies";

export const metadata: Metadata = {
  title: "For Companies — Veloraa",
  description:
    "Hire the top 1% of pre-vetted technical talent. AI-powered matching, 94% interview-to-offer rate, and a 90-day placement guarantee.",
};

export default function ForCompaniesPage() {
  return <ForCompanies />;
}
