import { redirect } from "next/navigation";
import { verifyPartnerSession } from "@/lib/auth-partner";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { EdmGeneratorClient } from "@/components/partner/EdmGeneratorClient";

export const dynamic = "force-dynamic";

export default async function PartnerEdmPage() {
  const session = await verifyPartnerSession();
  if (!session.isAuthenticated) redirect("/partner/login");
  const promoterId = session.promoterId!;

  // Fetch Promoter details for referral code
  const promoterDoc = await adminDb.collection(COLLECTIONS.PROMOTERS).doc(promoterId).get();
  const promoterData = promoterDoc.data();
  const referralCode = promoterData?.referral_code || "";
  const isB2B = promoterData?.discount_type === "percent";
  
  // Hardcoded initial templates (admin will eventually upload to firestore)
  const templates = [
    {
      id: "general-1",
      name: "General Offer",
      imageUrl: "/images/edm/general-offer.png", // We will use a placeholder or assume this exists
      category: "General",
      codePosition: { x: 50, y: 85 }, // percentages
    },
    {
      id: "diwali-1",
      name: "Diwali Special",
      imageUrl: "/images/edm/diwali-special.png",
      category: "Festival",
      codePosition: { x: 50, y: 80 },
    }
  ];

  return (
    <EdmGeneratorClient 
      partnerName={session.promoterName || "Partner"}
      referralCode={referralCode}
      isB2B={isB2B}
      templates={templates}
    />
  );
}
