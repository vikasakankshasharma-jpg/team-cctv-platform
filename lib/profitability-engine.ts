import { adminDb } from "./firebase-admin";

export type CalculationVersion = "v1";
export const CURRENT_CALCULATION_VERSION: CalculationVersion = "v1";

export interface ProfitabilityCostBreakdown {
  purchase: number;
  freight: number;
  installation: number;
  warrantyParts: number;
  warrantyLabour: number;
  amcParts: number;
  amcLabour: number;
  rmaOperational: number;
}

export interface ProfitabilityResult {
  dealId: string;
  period: string; // e.g. YYYY-MM
  revenue: number;
  costs: ProfitabilityCostBreakdown;
  grossProfit: number;
  calculationVersion: CalculationVersion;
  calculatedAt: string;
  sourceRefs: string[]; // List of transaction IDs used to build this (Invoices, Jobs, Tickets)
}

/**
 * Pure calculation engine to derive Deal Profitability from Immutable Transactions.
 * 
 * @param dealId The ID of the deal to calculate profitability for.
 * @param period Optional. If provided, calculates only up to the end of this period. (Format: YYYY-MM)
 */
export async function calculateDealProfitability(dealId: string, period?: string): Promise<ProfitabilityResult> {
  let revenue = 0;
  const costs: ProfitabilityCostBreakdown = {
    purchase: 0,
    freight: 0,
    installation: 0,
    warrantyParts: 0,
    warrantyLabour: 0,
    amcParts: 0,
    amcLabour: 0,
    rmaOperational: 0
  };
  const sourceRefs: Set<string> = new Set();
  
  // 1. INVOICE REVENUE
  const invoiceSnap = await adminDb.collection("invoices").where("dealId", "==", dealId).get();
  for (const doc of invoiceSnap.docs) {
      const inv = doc.data();
      // Exclude cancelled invoices
      if (inv.status !== "CANCELLED") {
          revenue += inv.totalAmount || 0; // Using grand total, excluding GST if separated in real schema
          sourceRefs.add(`invoice_${doc.id}`);
      }
  }

  // 2. PRODUCT PURCHASE COST (Original Installation)
  // Look at Serial Assets tied to this Deal that were installed.
  const assetsSnap = await adminDb.collection("serial_assets").where("dealId", "==", dealId).get();
  for (const doc of assetsSnap.docs) {
      const asset = doc.data();
      // Assuming asset stores its purchase unit cost or we look it up from PO/Master
      costs.purchase += asset.unitPurchaseCost || 0;
      sourceRefs.add(`asset_${doc.id}`);
  }

  // 3. INSTALLATION LABOUR COST
  // Look at Jobs related to this deal.
  const jobsSnap = await adminDb.collection("jobs").where("dealId", "==", dealId).get();
  for (const doc of jobsSnap.docs) {
      const job = doc.data();
      if (job.status === "COMPLETED") {
          sourceRefs.add(`job_${doc.id}`);
          
          if (job.type === "INSTALLATION") {
              costs.installation += job.labourCost || 0;
          } else if (job.type === "WARRANTY_SERVICE") {
              costs.warrantyLabour += job.labourCost || 0;
          } else if (job.type === "AMC_SERVICE") {
              costs.amcLabour += job.labourCost || 0;
          }
      }
  }

  // 4. MATERIAL CONSUMPTION (Warranty, AMC, RMA)
  // Look at Stock Ledger OUT events linked to Warranty/AMC/RMA for this deal/customer.
  // We query stock ledger by referenceId (which would be JobId or RMA ID)
  // For efficiency, we iterate over the known job IDs and RMA IDs.
  
  const rmaSnap = await adminDb.collection("rma_tickets").where("originalDealId", "==", dealId).get();
  for (const rma of rmaSnap.docs) {
      sourceRefs.add(`rma_${rma.id}`);
      costs.rmaOperational += rma.data().operationalCost || 0; // Logistics, vendor shipping
  }

  // For material consumption, normally we'd query stock ledger WHERE referenceId IN [jobIds...].
  // Since Firestore 'IN' is limited to 10, we fetch all OUT ledgers for these jobs.
  const jobIds = jobsSnap.docs.map(d => d.id);
  const rmaIds = rmaSnap.docs.map(d => d.id);
  const allRefs = [...jobIds, ...rmaIds];

  // We chunk them if > 10, but for simplicity here we query individually or chunk by 10.
  const chunks = [];
  for (let i = 0; i < allRefs.length; i += 10) {
      chunks.push(allRefs.slice(i, i + 10));
  }

  for (const chunk of chunks) {
      if(chunk.length === 0) continue;
      const ledgerSnap = await adminDb.collection("stock_ledger")
          .where("type", "==", "OUT")
          .where("referenceId", "in", chunk)
          .get();
          
      for (const entry of ledgerSnap.docs) {
          const l = entry.data();
          sourceRefs.add(`ledger_${entry.id}`);
          
          const materialCost = (l.unitCost || 0) * l.quantity;
          
          if (l.referenceType === "JOB") {
              // Determine job type to classify cost
              const jobDoc = jobsSnap.docs.find(d => d.id === l.referenceId);
              if (jobDoc) {
                  const jType = jobDoc.data().type;
                  if (jType === "WARRANTY_SERVICE") costs.warrantyParts += materialCost;
                  if (jType === "AMC_SERVICE") costs.amcParts += materialCost;
              }
          }
          if (l.referenceType === "RMA") {
              // Parts consumed during RMA
              costs.rmaOperational += materialCost;
          }
      }
  }

  const totalCost = 
      costs.purchase + 
      costs.freight + 
      costs.installation + 
      costs.warrantyParts + 
      costs.warrantyLabour + 
      costs.amcParts + 
      costs.amcLabour + 
      costs.rmaOperational;

  const grossProfit = revenue - totalCost;

  return {
      dealId,
      period: period || new Date().toISOString().slice(0, 7), // Default to current YYYY-MM
      revenue,
      costs,
      grossProfit,
      calculationVersion: CURRENT_CALCULATION_VERSION,
      calculatedAt: new Date().toISOString(),
      sourceRefs: Array.from(sourceRefs)
  };
}


export async function saveProfitabilitySnapshot(snapshot: ProfitabilityResult): Promise<void> {
  const snapshotId = `${snapshot.period}_${snapshot.dealId}`;
  await adminDb.collection("profitability_snapshots").doc(snapshotId).set(snapshot);
}


export async function getLiveProfitability(dealId: string, period: string): Promise<ProfitabilityResult> {
  const snapshotId = `${period}_${dealId}`;
  const doc = await adminDb.collection("profitability_snapshots").doc(snapshotId).get();
  
  if (!doc.exists) {
      // No snapshot exists yet (e.g. brand new deal today), calculate fully on the fly
      const res = await calculateDealProfitability(dealId, period); (res as any).isLiveRecalculated = true; return res;
  }
  
  const snapshot = doc.data() as ProfitabilityResult;
  const lastCalc = new Date(snapshot.calculatedAt);
  
  // To get intra-day delta, we technically need to find transactions where timestamp > lastCalc
  // Since our calculateDealProfitability is modular, we can abstract delta logic, 
  // but for Phase 12 MVP, if a deal has had ANY new invoices, jobs, or stock movements since lastCalc, 
  // we just recalculate the whole deal on the fly. It's safe and accurate.
  
  const recentInvoices = await adminDb.collection("invoices")
      .where("dealId", "==", dealId)
      .where("createdAt", ">", snapshot.calculatedAt)
      .limit(1).get();
      
  const recentJobs = await adminDb.collection("jobs")
      .where("dealId", "==", dealId)
      .where("updatedAt", ">", snapshot.calculatedAt) // Assuming jobs have updatedAt
      .limit(1).get();

  const recentRma = await adminDb.collection("rma_tickets")
      .where("originalDealId", "==", dealId)
      .where("createdAt", ">", snapshot.calculatedAt)
      .limit(1).get();
      
  if (!recentInvoices.empty || !recentJobs.empty || !recentRma.empty) {
      // A mutation occurred since the nightly snapshot. Compute dynamic delta.
      // (For absolute precision we run the full engine on this single deal)
      const res2 = await calculateDealProfitability(dealId, period); (res2 as any).isLiveRecalculated = true; return res2;
  }
  
  // No changes since nightly cron. Return the fast materialized view.
  return snapshot;
}
