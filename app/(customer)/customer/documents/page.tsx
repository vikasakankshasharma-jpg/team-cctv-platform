import { verifySession } from "@/lib/auth-server";
import { redirect } from "next/navigation";
import { adminDb, adminAuth } from "@/lib/firebase-admin";
import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Download, FileText, Receipt, ShieldCheck } from "lucide-react";

export const metadata: Metadata = {
  title: "My Documents | TEAM CCTV",
  description: "View and download your official invoices, receipts, and warranty certificates.",
};

export const dynamic = "force-dynamic";

export default async function CustomerDocumentsPage() {
  const session = await verifySession();

  if (!session.isAuthenticated) {
    redirect("/customer/login?redirect=/customer/documents");
  }

  const uid = session.user?.uid || session.uid || "";
  let phoneNumber = session.user?.phone_number;

  if (!phoneNumber && uid) {
    try {
      const userRecord = await adminAuth.getUser(uid);
      phoneNumber = userRecord.phoneNumber;
    } catch (e) {
      //
    }
  }

  const rawMobile = phoneNumber ? String(phoneNumber).replace(/\D/g, "").slice(-10) : "";
  
  const documents: any[] = [];
  
  try {
    // 1. Fetch Paid Quotes (Invoices)
    const quotePromises = [];
    if (uid) {
      quotePromises.push(adminDb.collection("quotes").where("firebase_uid", "==", uid).where("payment_status", "in", ["advance_paid", "delivery_paid", "paid"]).get());
    }
    if (rawMobile) {
      quotePromises.push(adminDb.collection("quotes").where("customer_mobile", "in", [rawMobile, `+91${rawMobile}`]).where("payment_status", "in", ["advance_paid", "delivery_paid", "paid"]).get());
    }

    const quoteSnaps = await Promise.all(quotePromises.map(p => p.catch(() => ({ empty: true, docs: [] }))));
    
    const seenQuoteIds = new Set<string>();
    quoteSnaps.forEach(snap => {
      if (!snap.empty) {
        snap.docs.forEach(doc => {
          if (!seenQuoteIds.has(doc.id)) {
            seenQuoteIds.add(doc.id);
            const data = doc.data();
            documents.push({
              id: doc.id,
              type: "invoice",
              title: `Tax Invoice - ${doc.id.slice(0, 8).toUpperCase()}`,
              date: data.created_at?.toDate ? data.created_at.toDate() : new Date(),
              amount: data.grand_total,
              downloadUrl: `/api/invoice/${doc.id}/download`,
              status: data.payment_status
            });
          }
        });
      }
    });

    // 2. Fetch Warranties
    const warrantyPromises = [];
    if (uid) {
      warrantyPromises.push(adminDb.collection("warranties").where("firebase_uid", "==", uid).get());
    }
    if (rawMobile) {
      warrantyPromises.push(adminDb.collection("warranties").where("customer_phone", "==", rawMobile).get());
    }

    const warrantySnaps = await Promise.all(warrantyPromises.map(p => p.catch(() => ({ empty: true, docs: [] }))));
    const seenWarrantyIds = new Set<string>();
    warrantySnaps.forEach(snap => {
      if (!snap.empty) {
        snap.docs.forEach(doc => {
          if (!seenWarrantyIds.has(doc.id)) {
            seenWarrantyIds.add(doc.id);
            const data = doc.data();
            documents.push({
              id: doc.id,
              type: "warranty",
              title: `Warranty Certificate - ${doc.id.slice(0, 8).toUpperCase()}`,
              date: data.created_at?.toDate ? data.created_at.toDate() : new Date(),
              downloadUrl: `/api/warranty/${doc.id}/download`,
            });
          }
        });
      }
    });

  } catch (e) {
    console.error("Error fetching documents:", e);
  }

  // Sort by date descending
  documents.sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <Link 
          href="/customer/dashboard" 
          className="inline-flex items-center gap-2 text-sm font-semibold text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
        
        <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-3xl p-6 sm:p-10 shadow-sm">
          <div className="mb-8">
            <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-white">My Documents</h1>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">Access your official tax invoices, payment receipts, and warranty certificates.</p>
          </div>

          {documents.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-2xl">
              <FileText className="w-12 h-12 text-zinc-300 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">No documents yet</h3>
              <p className="text-zinc-500 text-sm">Your invoices and certificates will appear here once your bookings are confirmed.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {documents.map((doc) => (
                <div key={doc.id} className="group relative flex items-start justify-between p-5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 hover:bg-blue-50 dark:hover:bg-blue-900/10 hover:border-blue-200 dark:hover:border-blue-900/50 transition-all">
                  <div className="flex gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${doc.type === 'invoice' ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400'}`}>
                      {doc.type === 'invoice' ? <Receipt className="w-6 h-6" /> : <ShieldCheck className="w-6 h-6" />}
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{doc.title}</h4>
                      <div className="text-xs font-semibold text-zinc-500 mt-1 flex items-center gap-2">
                        {doc.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {doc.amount && (
                          <>
                            <span>•</span>
                            <span>₹{doc.amount.toLocaleString('en-IN')}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  <a 
                    href={doc.downloadUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-10 h-10 rounded-full bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 flex items-center justify-center text-zinc-500 hover:text-blue-600 hover:border-blue-300 hover:bg-blue-50 transition-all shrink-0"
                    title="Download PDF"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
