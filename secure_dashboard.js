const fs = require('fs');
let code = fs.readFileSync('app/api/customer/[customerId]/dashboard/route.ts', 'utf8');

const authCheck = `
    // Basic Auth
    const isAllowed = await checkRole(request, ["SUPER_ADMIN", "ADMIN", "SALES", "OPERATIONS", "TECHNICIAN", "CUSTOMER"]);
    if (!isAllowed) {
       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }
`;

const secureAuthCheck = `
    const { verifySession } = await import("@/lib/auth-server");
    const session = await verifySession();
    const isAllowed = await checkRole(request, ["SUPER_ADMIN", "ADMIN", "SALES", "OPERATIONS", "TECHNICIAN", "CUSTOMER"]);
    if (!isAllowed) {
       return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    const { customerId } = await params;
    
    // Server-Side Customer Access Control
    if (session.role === "CUSTOMER") {
       const customerDoc = await adminDb.collection("customers").doc(customerId).get();
       if (!customerDoc.exists || customerDoc.data()?.authUid !== session.user?.uid) {
           return NextResponse.json({ success: false, message: "Forbidden: Cross-Customer Access Denied" }, { status: 403 });
       }
    }
`;

code = code.replace(authCheck.trim(), secureAuthCheck.trim());
code = code.replace('const { customerId } = await params;', ''); // Remove the duplicate param extraction

fs.writeFileSync('app/api/customer/[customerId]/dashboard/route.ts', code);
console.log('done');
