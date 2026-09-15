import { adminDb } from "../lib/firebase-admin";

async function main() {
  const leads = await adminDb.collection("leads").where("mobile_number", "==", "9587980007").orderBy("created_at", "desc").limit(1).get();
  if (leads.empty) {
    console.log("No lead found");
    process.exit(1);
  }
  const leadId = leads.docs[0].id;
  console.log("Lead ID:", leadId);
  const quotes = await adminDb.collection("leads").doc(leadId).collection("quotes").orderBy("created_at", "desc").limit(1).get();
  if (quotes.empty) {
    console.log("No quote found");
    process.exit(1);
  }
  const q = quotes.docs[0].data();
  console.log("Quote ID:", quotes.docs[0].id);
  console.log("Total Payable:", q.total_payable);
  console.log("Labor Cost:", q.labor_cost);
  console.log("Cabling Cost:", q.cabling_cost);
  console.log("Items:");
  console.log(JSON.stringify(q.items, null, 2));
  process.exit(0);
}
main();
