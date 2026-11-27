import type { Metadata } from "next";

export const metadata: Metadata = {
  manifest: "/manifest-delivery.json",
  title: "Delivery Handover Pass | TEAM CCTV",
  description: "Secure delivery verification and field handover pass.",
};

export default function DeliveryLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
