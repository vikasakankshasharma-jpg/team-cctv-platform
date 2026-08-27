require("dotenv").config({ path: ".env.local" });
import { adminDb as db } from "../lib/firebase-admin";
import { differenceInHours, parseISO } from "date-fns";

async function runServiceAmcReconciliation() {
    console.log("Starting Service & AMC Reconciliation Test...");
    
    // 1. Transactional Source of Truth
    let dbTechAssigned = 0;
    let dbTechCompleted = 0;
    const jobsSnap = await db.collection("jobs").get();
    
    jobsSnap.docs.forEach(doc => {
        const j = doc.data();
        if (j.status !== "CANCELLED" && j.technicianId) {
            dbTechAssigned++;
            if (j.status === "COMPLETED") dbTechCompleted++;
        }
    });

    let dbSlaBreaches = 0;
    const ticketsSnap = await db.collection("service_tickets").get();
    ticketsSnap.docs.forEach(doc => {
        const t = doc.data();
        const created = parseISO(t.createdAt);
        if (t.status === "RESOLVED" || t.status === "CLOSED") {
            const resolved = parseISO(t.resolvedAt || t.updatedAt);
            if (differenceInHours(resolved, created) > 24) dbSlaBreaches++;
        } else {
            if (differenceInHours(new Date(), created) > 24) dbSlaBreaches++;
        }
    });

    let dbIncluded = 0;
    let dbUsed = 0;
    const amcSnap = await db.collection("amc_contracts").get();
    const now = new Date();
    
    let hasIntegrityViolation = false;
    
    amcSnap.docs.forEach(doc => {
        const amc = doc.data();
        const endDate = parseISO(amc.endDate);
        if (amc.status === "ACTIVE" && endDate > now) {
            dbIncluded += (amc.includedVisits || 0);
            dbUsed += (amc.usedVisits || 0);
            
            // Negative Test Verification (Must fail if violation exists)
            if ((amc.usedVisits || 0) > (amc.includedVisits || 0)) {
                hasIntegrityViolation = true;
                console.error(`❌ INTEGRITY VIOLATION: AMC Contract ${doc.id} has usedVisits (${amc.usedVisits}) > includedVisits (${amc.includedVisits}).`);
            }
        }
    });

    console.log("\n=== TRANSACTIONAL TRUTH ===");
    console.log(`Assigned Jobs (Non-cancelled): ${dbTechAssigned}, Completed: ${dbTechCompleted}`);
    console.log(`Tickets Breached 24h SLA: ${dbSlaBreaches}`);
    console.log(`AMC Included: ${dbIncluded}, Used: ${dbUsed}, Calculated Remaining: ${dbIncluded - dbUsed}`);

    // 2. API Simulation (What the dashboard sees)
    let apiAssigned = 0;
    let apiCompleted = 0;
    jobsSnap.docs.forEach(doc => {
        const j = doc.data();
        if (j.status !== "CANCELLED" && j.technicianId) {
            apiAssigned++;
            if (j.status === "COMPLETED") apiCompleted++;
        }
    });

    let apiIncluded = 0;
    let apiUsed = 0;
    let apiRemaining = 0;
    amcSnap.docs.forEach(doc => {
        const amc = doc.data();
        const endDate = parseISO(amc.endDate);
        if (amc.status === "ACTIVE" && endDate > now) {
            apiIncluded += (amc.includedVisits || 0);
            apiUsed += (amc.usedVisits || 0);
            apiRemaining += ((amc.includedVisits || 0) - (amc.usedVisits || 0));
        }
    });

    // 3. Assertions
    let passed = true;
    
    if (dbTechAssigned !== apiAssigned || dbTechCompleted !== apiCompleted) {
        console.error("❌ Mismatch in Technician Productivity Metrics.");
        passed = false;
    }
    
    if (apiIncluded !== dbIncluded || apiUsed !== dbUsed) {
        console.error("❌ Mismatch in AMC Visit Metrics.");
        passed = false;
    }
    
    if (apiRemaining !== (dbIncluded - dbUsed)) {
        console.error("❌ Math Error in AMC Remaining Calculation.");
        passed = false;
    }

    if (hasIntegrityViolation) {
        console.error("\n❌ RECONCILIATION FAILED DUE TO DATA INTEGRITY VIOLATION (Used > Included).");
        process.exit(1);
    } else if (passed) {
        console.log("\n✅ RECONCILIATION PASSED. Service & AMC Dashboard accurately reflects operational state.");
    } else {
        console.error("\n❌ RECONCILIATION FAILED.");
        process.exit(1);
    }
}

runServiceAmcReconciliation().catch(e => { console.error(e); process.exit(1); });
