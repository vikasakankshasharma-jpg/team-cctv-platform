import { redirect } from "next/navigation";
import { verifyPartnerSession } from "@/lib/auth-partner";
import { adminDb } from "@/lib/firebase-admin";
import { COLLECTIONS } from "@/lib/constants";
import { PartnerProfileClient } from "@/components/partner/PartnerProfileClient";
import type { Promoter } from "@/types";

export const dynamic = "force-dynamic";

export default async function PartnerProfilePage() {
  const session = await verifyPartnerSession();
  if (!session.isAuthenticated) redirect("/partner/login");
  const promoterId = session.promoterId!;

  const docSnap = await adminDb.collection(COLLECTIONS.PROMOTERS).doc(promoterId).get();
  
  if (!docSnap.exists) {
    return <div>Profile not found.</div>;
  }

  const data = docSnap.data() as Promoter;
  
  const profile = {
    id: docSnap.id,
    name: data.name,
    business_name: data.business_name,
    referral_code: data.referral_code,
    email: data.email,
    mobile_number: data.mobile_number,
    is_active: data.is_active,
    total_ex_tax_business: data.total_ex_tax_business,
    total_won_leads: data.total_won_leads,
    discount_type: data.discount_type,
    discount_value: data.discount_value,
    use_global_commission: data.use_global_commission,
    commission_slabs: data.commission_slabs,
  };

  return <PartnerProfileClient initialProfile={profile} />;
}
