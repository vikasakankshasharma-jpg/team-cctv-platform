import { ProBuilderClient } from "@/components/builder/ProBuilderClient";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pro Builder | CCTV Quotation",
  description: "Advanced e-commerce builder for custom CCTV configurations.",
};

export default function ProBuilderPage() {
  return <ProBuilderClient />;
}
