import { NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";
import { checkRole } from "@/lib/rbac";
import { AuditLogger } from "@/lib/audit-logger";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const jobDoc = await adminDb.collection("jobs").doc(jobId).get();
    
    if (!jobDoc.exists) {
      return NextResponse.json({ success: false, message: "Job not found" }, { status: 404 });
    }
    
    return NextResponse.json({ success: true, data: jobDoc.data() });
  } catch (error: any) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    if (!(await checkRole())) {
       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }
    
    const { jobId } = await params;
    const body = await request.json();
    const requestId = `REQ-${Date.now()}`;
    const actorUid = "system_generated";
    const actorRole = "TECHNICIAN";
    const updates = { ...body };
    const jobRef = adminDb.collection("jobs").doc(jobId);
    
    // --- Phase 8.7: Transactional Inventory Reservation on Dispatch ---
    if (updates.status === "SCHEDULED") {
       await adminDb.runTransaction(async (transaction) => {
          const jobDoc = await transaction.get(jobRef);
          if (!jobDoc.exists) throw new Error("Job not found");
          
          const job = jobDoc.data()!;
          if (job.status !== "PENDING_SCHEDULE") {
             throw new Error("Idempotency Error: Job is already scheduled or beyond.");
          }

          const timestamp = new Date().toISOString();
          const requiredSkus: {skuId: string, qty: number, name: string}[] = [];
          
          job.bomCameras?.forEach((c: any) => {
             if (c.product?.id) {
                const existing = requiredSkus.find(s => s.skuId === c.product.id);
                if (existing) existing.qty += (c.quantity || 1);
                else requiredSkus.push({ skuId: c.product.id, qty: c.quantity || 1, name: c.product.display_name });
             }
          });
          if (job.bomRecorder?.product?.id) requiredSkus.push({ skuId: job.bomRecorder.product.id, qty: 1, name: job.bomRecorder.product.display_name });
          if (job.bomStorage?.product?.id) requiredSkus.push({ skuId: job.bomStorage.product.id, qty: 1, name: job.bomStorage.product.display_name });
          job.bomAccessories?.forEach((a: any) => {
             if (a.product?.id) {
                const existing = requiredSkus.find(s => s.skuId === a.product.id);
                if (existing) existing.qty += (a.quantity || 1);
                else requiredSkus.push({ skuId: a.product.id, qty: a.quantity || 1, name: a.product.display_name });
             }
          });

          // Check availability and apply reservation within transaction
          for (const req of requiredSkus) {
             const invRef = adminDb.collection("inventory").doc(req.skuId);
             const invDoc = await transaction.get(invRef);
             
             if (!invDoc.exists || (invDoc.data()!.availableQty < req.qty)) {
                throw new Error(`Shortage Error: Not enough stock for ${req.name} (${req.skuId}). Need ${req.qty}.`);
             }
             
             const currentAvailable = invDoc.data()!.availableQty;
             const currentReserved = invDoc.data()!.reservedQty;
             
             transaction.update(invRef, {
                availableQty: currentAvailable - req.qty,
                reservedQty: currentReserved + req.qty
             });
             
             const ledgerRef = adminDb.collection("stock_ledger").doc();
             transaction.set(ledgerRef, {
                id: ledgerRef.id,
                skuId: req.skuId,
                type: "RESERVE",
                quantity: req.qty,
                referenceType: "JOB",
                referenceId: jobId,
                timestamp,
                performedBy: "System"
             });
          }
          
          transaction.update(jobRef, updates);
       });
       
       return NextResponse.json({ success: true, message: "Job Scheduled and Stock Reserved (Atomic)" });
    }

    // --- Phase 8.7, 10.3, 10.8: Transactional Job Completion ---
    if (updates.status === "COMPLETED") {
       updates.completedDate = new Date().toISOString();
       
       await adminDb.runTransaction(async (transaction) => {
          // 1. READ PHASE (Job)
          const jobDoc = await transaction.get(jobRef);
          if (!jobDoc.exists) throw new Error("Job not found");
          const job = jobDoc.data()!;
          
          if (job.status === "COMPLETED") {
             throw new Error("Idempotency Error: Job is already completed.");
          }

          const timestamp = updates.completedDate;
          const actualConsumed = body.actualConsumed || {};

          // ==========================================
          // BRANCH A: SERVICE JOB COMPLETION (10.8)
          // ==========================================
          if (job.type === "service") {
             if (!job.serviceTicketId) throw new Error("Service Job must have a serviceTicketId");
             
             // Pre-fetch all inventory docs for consumed materials
             const invDocs: Record<string, any> = {};
             for (const skuId of Object.keys(actualConsumed)) {
                 const invRef = adminDb.collection("inventory").doc(skuId);
                 const invDoc = await transaction.get(invRef);
                 if (invDoc.exists) invDocs[skuId] = { ref: invRef, data: invDoc.data()! };
             }

             // Write Phase - Service Material Consumption
             for (const skuId of Object.keys(actualConsumed)) {
                 const consumedQty = actualConsumed[skuId];
                 if (consumedQty <= 0) continue;
                 
                 if (invDocs[skuId]) {
                    const invData = invDocs[skuId].data;
                    const newAvailable = invData.availableQty - consumedQty;
                    
                    transaction.update(invDocs[skuId].ref, {
                       availableQty: newAvailable
                    });
                    
                    if (newAvailable < 0) {
                        const exceptionRef = adminDb.collection("inventory_exceptions").doc();
                        transaction.set(exceptionRef, {
                            id: exceptionRef.id,
                            skuId: skuId,
                            jobId: jobId,
                            negativeAmount: Math.abs(newAvailable),
                            status: "PENDING_AUDIT",
                            timestamp,
                            message: `Service Consumption pushed stock to ${newAvailable} for ${skuId}`
                        });
                    }
                 }
                 
                 const outRef = adminDb.collection("stock_ledger").doc();
                 transaction.set(outRef, {
                     id: outRef.id,
                     skuId: skuId,
                     type: "OUT",
                     quantity: consumedQty,
                     referenceType: "SERVICE_JOB",
                     referenceId: jobId,
                     timestamp,
                     performedBy: "System",
                     notes: `Service Consumption for Ticket ${job.serviceTicketId}`
                 });
             }
             
             // Relocation / Asset updates if any
             if (body.relocatedAssets) {
                // { "SN1": "New Location", "SN2": "Warehouse Entry" }
                for (const sn of Object.keys(body.relocatedAssets)) {
                   const assetSnapshot = await transaction.get(adminDb.collection("serial_assets").where("serialNumber", "==", sn));
                   if (!assetSnapshot.empty) {
                      const assetDoc = assetSnapshot.docs[0];
                      transaction.update(assetDoc.ref, {
                         installationNotes: body.relocatedAssets[sn],
                         auditTrail: require('firebase-admin').firestore.FieldValue.arrayUnion({
                            status: "RELOCATED",
                            timestamp,
                            actor: "Technician",
                            referenceId: jobId,
                            notes: `Relocated to: ${body.relocatedAssets[sn]}`
                         })
                      });
                   }
                }
             }

             // Fetch Service Ticket
             const ticketRef = adminDb.collection("service_tickets").doc(job.serviceTicketId);
             const ticketDoc = await transaction.get(ticketRef);
             
             if (ticketDoc.exists) {
                const ticketData = ticketDoc.data()!;
                
                // Phase 11.4: AMC Visit Deduction
                if (ticketData.billingType === "AMC" && ticketData.amcContractId) {
                    const amcRef = adminDb.collection("amc_contracts").doc(ticketData.amcContractId);
                    const amcDoc = await transaction.get(amcRef);
                    if (amcDoc.exists) {
                       const amcData = amcDoc.data()!;
                       if (amcData.usedVisits >= amcData.includedVisits) throw new Error("AMC Visit Deduction Failed: No visits remaining in this AMC Contract.");
                       // If it's an emergency priority, maybe deduct emergency visit, else regular.
                       // Simplified: just increment usedVisits
                       transaction.update(amcRef, {
                          usedVisits: amcData.usedVisits + 1,
                          auditTrail: require('firebase-admin').firestore.FieldValue.arrayUnion({
                             status: "VISIT_USED",
                             timestamp,
                             actor: "System",
                             referenceId: jobId,
                             notes: `Visit consumed via Job ${jobId} for Ticket ${ticketData.ticketNo}`
                          })
                       });
                    }
                }
                
                // Update Service Ticket
                transaction.update(ticketRef, {
                   status: "RESOLVED",
                   resolvedAt: timestamp,
                   resolutionCode: body.resolutionCode || "OTHER",
                   resolutionNotes: body.resolutionNotes || "Resolved via Service Job"
                });
             }

             // Update Job
             transaction.update(jobRef, updates);
             return; // End of Service Branch
          }

          // ==========================================
          // BRANCH B: INSTALLATION JOB COMPLETION
          // ==========================================
          const requiredSkus: {skuId: string, qty: number, isSerialized?: boolean}[] = [];
          
          job.bomCameras?.forEach((c: any) => { if (c.product?.id) { const e = requiredSkus.find(s => s.skuId === c.product.id); if (e) e.qty += (c.quantity || 1); else requiredSkus.push({ skuId: c.product.id, qty: c.quantity || 1, isSerialized: c.product.isSerialized }); }});
          if (job.bomRecorder?.product?.id) requiredSkus.push({ skuId: job.bomRecorder.product.id, qty: 1, isSerialized: job.bomRecorder.product.isSerialized });
          if (job.bomStorage?.product?.id) requiredSkus.push({ skuId: job.bomStorage.product.id, qty: 1, isSerialized: job.bomStorage.product.isSerialized });
          job.bomAccessories?.forEach((a: any) => { if (a.product?.id) { const e = requiredSkus.find(s => s.skuId === a.product.id); if (e) e.qty += (a.quantity || 1); else requiredSkus.push({ skuId: a.product.id, qty: a.quantity || 1, isSerialized: a.product.isSerialized }); }});

          const submittedSerials = body.serials || {}; // Record<skuId, string[]>
          const amcPlanId = body.amcPlanId;

          // Pre-fetch all inventory docs, products, and amc plan
          const invDocs: Record<string, any> = {};
          const productDocs: Record<string, any> = {};
          
          for (const req of requiredSkus) {
              const invRef = adminDb.collection("inventory").doc(req.skuId);
              const invDoc = await transaction.get(invRef);
              if (invDoc.exists) invDocs[req.skuId] = { ref: invRef, data: invDoc.data()! };
              
              const prodRef = adminDb.collection("products").doc(req.skuId);
              const prodDoc = await transaction.get(prodRef);
              if (prodDoc.exists) productDocs[req.skuId] = prodDoc.data()!;
              
              if (req.isSerialized) {
                 const consumedQty = actualConsumed[req.skuId] !== undefined ? actualConsumed[req.skuId] : req.qty;
                 const skuSerials = submittedSerials[req.skuId] || [];
                 
                 if (skuSerials.length !== consumedQty) {
                    throw new Error(`SKU ${req.skuId} requires ${consumedQty} serial numbers, but got ${skuSerials.length}`);
                 }
                 if (new Set(skuSerials).size !== skuSerials.length) {
                    throw new Error(`Duplicate serial numbers submitted for ${req.skuId}`);
                 }
                 
                 for (const sn of skuSerials) {
                    const snSnapshot = await transaction.get(adminDb.collection("serial_assets").where("serialNumber", "==", sn));
                    if (snSnapshot.empty) {
                       throw new Error(`Serial Number ${sn} not found in inventory.`);
                    }
                    const assetDoc = snSnapshot.docs[0];
                    const asset = assetDoc.data();
                    
                    if (asset.skuId !== req.skuId) throw new Error(`Serial Number ${sn} belongs to ${asset.skuId}, not ${req.skuId}.`);
                    if (asset.status !== "IN_STOCK" && asset.status !== "RESERVED") {
                       throw new Error(`Serial Number ${sn} is not available (Status: ${asset.status}).`);
                    }
                    
                    invDocs[`serial_${sn}`] = { ref: assetDoc.ref, data: asset };
                 }
              }
          }
          
          let amcPlanData: any = null;
          if (amcPlanId) {
              const amcDoc = await transaction.get(adminDb.collection("amc_plans").doc(amcPlanId));
              if (!amcDoc.exists) throw new Error("AMC Plan not found");
              amcPlanData = amcDoc.data()!;
          }

          // 2. WRITE PHASE
          const arrayUnion = require('firebase-admin').firestore.FieldValue.arrayUnion;

          for (const req of requiredSkus) {
              const consumedQty = actualConsumed[req.skuId] !== undefined ? actualConsumed[req.skuId] : req.qty;
              const prodData = productDocs[req.skuId] || {};
              const wPolicy = prodData.warrantyPolicy || {};
              
              const custMonths = wPolicy.customerWarrantyMonths || prodData.warrantyMonths || 0;
              const suppMonths = wPolicy.supplierWarrantyMonths || custMonths;
              const instDays = wPolicy.installationWarrantyDays || 7;
              
              // Date calculations
              const installedDate = new Date(timestamp);
              const warrantyEndDate = new Date(installedDate);
              warrantyEndDate.setMonth(warrantyEndDate.getMonth() + custMonths);
              
              const instWarrantyEndDate = new Date(installedDate);
              instWarrantyEndDate.setDate(instWarrantyEndDate.getDate() + instDays);

              if (req.isSerialized) {
                 const skuSerials = submittedSerials[req.skuId] || [];
                 for (const sn of skuSerials) {
                    const assetObj = invDocs[`serial_${sn}`];
                    
                    transaction.update(assetObj.ref, {
                       status: "INSTALLED",
                       jobId: jobId,
                       dealId: job.dealId || null,
                       customerId: job.customerId || null,
                       installedAt: timestamp,
                       
                       // Phase 11: Warranty Policy Snapshot
                       supplierWarrantyMonths: suppMonths,
                       customerWarrantyMonths: custMonths,
                       installationWarrantyDays: instDays,
                       
                       warrantyStartDate: timestamp,
                       warrantyEndDate: custMonths > 0 ? warrantyEndDate.toISOString() : null,
                       installationWarrantyEndDate: instDays > 0 ? instWarrantyEndDate.toISOString() : null,
                       
                       auditTrail: arrayUnion({
                           status: "INSTALLED",
                           timestamp,
                           actor: "Technician",
                           referenceId: jobId,
                           notes: `Installed via Job ${jobId}. Warranty: ${custMonths}M`
                       })
                    });
                 }
              } else if (custMonths > 0 || instDays > 0) {
                 // Phase 11: Non-Serialized Warranty Coverage Item
                 const cwRef = adminDb.collection("customer_warranty_items").doc();
                 transaction.set(cwRef, {
                    id: cwRef.id,
                    customerId: job.customerId || null,
                    dealId: job.dealId || null,
                    jobId: jobId,
                    skuId: req.skuId,
                    productName: prodData.name || req.skuId,
                    quantity: consumedQty,
                    serialized: false,
                    supplierWarrantyMonths: suppMonths,
                    customerWarrantyMonths: custMonths,
                    installationWarrantyDays: instDays,
                    warrantyStartDate: timestamp,
                    warrantyEndDate: custMonths > 0 ? warrantyEndDate.toISOString() : null,
                    installationWarrantyEndDate: instDays > 0 ? instWarrantyEndDate.toISOString() : null,
                    status: "ACTIVE"
                 });
              }

              if (invDocs[req.skuId]) {
                 const invData = invDocs[req.skuId].data;
                 const invRef = invDocs[req.skuId].ref;
                 
                 const currentReserved = invData.reservedQty;
                 const currentAvailable = invData.availableQty;
                 
                 const variance = req.qty - consumedQty;
                 const newAvailable = currentAvailable + variance;
                 
                 transaction.update(invRef, {
                     reservedQty: Math.max(0, currentReserved - req.qty),
                     availableQty: newAvailable
                 });
                 
                 if (newAvailable < 0) {
                     const exceptionRef = adminDb.collection("inventory_exceptions").doc();
                     transaction.set(exceptionRef, {
                         id: exceptionRef.id,
                         skuId: req.skuId,
                         jobId: jobId,
                         negativeAmount: Math.abs(newAvailable),
                         status: "PENDING_AUDIT",
                         timestamp,
                         message: `Consumption pushed stock to ${newAvailable} for ${req.skuId}`
                     });
                 }
              }
              
              const releaseRef = adminDb.collection("stock_ledger").doc();
              transaction.set(releaseRef, {
                  id: releaseRef.id,
                  skuId: req.skuId,
                  type: "RELEASE",
                  quantity: req.qty,
                  referenceType: "JOB",
                  referenceId: jobId,
                  timestamp,
                  performedBy: "System",
                  notes: "Released reservation upon job completion"
              });
              
              const outRef = adminDb.collection("stock_ledger").doc();
              transaction.set(outRef, {
                  id: outRef.id,
                  skuId: req.skuId,
                  type: "OUT",
                  quantity: consumedQty,
                  referenceType: "JOB",
                  referenceId: jobId,
                  timestamp,
                  performedBy: "System",
                  notes: `Actual consumption for Job ${jobId}` + (req.isSerialized ? ` (Serialized)` : "")
              });
          }
          
          // Phase 11: AMC Snapshot Generation
          if (amcPlanData && job.customerId) {
             const amcRef = adminDb.collection("amc_contracts").doc();
             
             const startDate = new Date(timestamp);
             const endDate = new Date(startDate);
             endDate.setMonth(endDate.getMonth() + amcPlanData.durationMonths);
             
             transaction.set(amcRef, {
                 id: amcRef.id,
                 customerId: job.customerId,
                 dealId: job.dealId || null,
                 planId: amcPlanId,
                 planName: amcPlanData.name,
                 startDate: startDate.toISOString(),
                 endDate: endDate.toISOString(),
                 agreedPrice: body.amcAgreedPrice || amcPlanData.price || 0,
                 includedVisits: amcPlanData.includedVisits || 0,
                 usedVisits: 0,
                 emergencyVisits: amcPlanData.emergencyVisits || 0,
                 usedEmergencyVisits: 0,
                 termsSnapshot: {
                     labourIncluded: amcPlanData.labourIncluded || false,
                     consumablesIncluded: amcPlanData.consumablesIncluded || false,
                     hardwareReplacementIncluded: amcPlanData.hardwareReplacementIncluded || false,
                     remoteSupport: amcPlanData.remoteSupport || false
                 },
                 status: "ACTIVE"
             });
          }

          if (job.dealId) {
             transaction.update(adminDb.collection("deals").doc(job.dealId), {
                status: "READY_FOR_FINAL_PAYMENT"
             });
          }
          
          transaction.update(jobRef, updates);
       });
       
       return NextResponse.json({ success: true, message: "Job Completed successfully (Atomic)" });
    }

    if (Object.keys(updates).length > 0) {
      await jobRef.update(updates);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Job Patch Error:", error);
    return NextResponse.json({ success: false, message: error.message }, { status: 400 });
  }
}
