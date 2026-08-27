import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";


export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "all"; // "7d", "30d", "all"

    let query: FirebaseFirestore.Query = adminDb.collection("quotes");
    
    if (range !== "all") {
      const days = range === "7d" ? 7 : 30;
      const date = new Date();
      date.setDate(date.getDate() - days);
      query = query.where("createdAt", ">=", date.toISOString());
    }

    const snapshot = await query.get();
    
    const quotes = snapshot.docs.map(doc => doc.data() as any);
    
    // Fetch WhatsApp deliveries
    const deliverySnapshot = await adminDb.collection("quoteDeliveries").get();
    const deliveries = deliverySnapshot.docs.map(doc => doc.data() as any);

    // 1. Executive Overview
    const totalQuotes = quotes.length;
    const whatsappSent = deliveries.filter(d => ["sent", "delivered", "read"].includes(d.status)).length;
    const quotesViewed = quotes.filter(q => q.status === "VIEWED" || q.status === "ACCEPTED").length;
    const acceptedQuotes = quotes.filter(q => q.status === "ACCEPTED").length;
    
    let totalQuotedValue = 0;
    let acceptedQuotedValue = 0;
    
    quotes.forEach(q => {
      const v = q.pricingSnapshot?.total_payable || 0;
      totalQuotedValue += v;
      if (q.status === "ACCEPTED") acceptedQuotedValue += v;
    });

    const conversionRate = totalQuotes > 0 ? (acceptedQuotes / totalQuotes) * 100 : 0;
    const avgQuoteValue = totalQuotes > 0 ? totalQuotedValue / totalQuotes : 0;

    // 2. Wizard vs Builder
    const wizardQuotes = quotes.filter(q => !q.source || q.source === "wizard");
    const builderQuotes = quotes.filter(q => q.source === "builder");

    const wizardAccepted = wizardQuotes.filter(q => q.status === "ACCEPTED").length;
    const builderAccepted = builderQuotes.filter(q => q.status === "ACCEPTED").length;

    // 3. Plan Analytics
    const plans = {
      budget: quotes.filter(q => q.selectedPlan === "budget").length,
      recommended: quotes.filter(q => q.selectedPlan === "recommended").length,
      premium: quotes.filter(q => q.selectedPlan === "premium").length,
    };

    // 4. Product Intelligence (Camera Resolution & Recording)
    const resolutions: Record<string, number> = {};
    const recordings: Record<string, number> = {};
    let newInstallation = 0;
    let existingUpgrade = 0;

    quotes.forEach(q => {
      const req = q.requirementSnapshot;
      if (!req) return;
      
      // Upgrade vs New
      if (req.is_upgrade) {
        existingUpgrade++;
      } else {
        newInstallation++;
      }

      // Resolution
      const res = req.picture_quality || "Unknown";
      resolutions[res] = (resolutions[res] || 0) + 1;
      
      // Recording
      const rec = req.recording_days || req.recording_mode || "Unknown";
      recordings[rec.toString()] = (recordings[rec.toString()] || 0) + 1;
    });

    // 5. WhatsApp Statuses
    const whatsappStats = {
      sent: deliveries.filter(d => d.status === "sent").length,
      delivered: deliveries.filter(d => d.status === "delivered").length,
      read: deliveries.filter(d => d.status === "read").length,
      failed: deliveries.filter(d => d.status === "failed").length,
    };

    return NextResponse.json({
      success: true,
      data: {
        overview: {
          totalQuotes,
          whatsappSent,
          quotesViewed,
          acceptedQuotes,
          conversionRate,
          avgQuoteValue,
          totalQuotedValue,
          acceptedQuotedValue
        },
        sources: {
          wizard: {
            total: wizardQuotes.length,
            accepted: wizardAccepted,
            conversion: wizardQuotes.length ? (wizardAccepted / wizardQuotes.length) * 100 : 0
          },
          builder: {
            total: builderQuotes.length,
            accepted: builderAccepted,
            conversion: builderQuotes.length ? (builderAccepted / builderQuotes.length) * 100 : 0
          }
        },
        plans,
        intelligence: {
          resolutions,
          recordings,
          installationType: { new: newInstallation, upgrade: existingUpgrade }
        },
        whatsapp: whatsappStats
      }
    });
  } catch (error: any) {
    console.error("Analytics fetch error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}


