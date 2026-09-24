const fs = require('fs');
const filePath = 'C:\\Users\\hp\\Documents\\TEAM Website\\secure-easy\\app\\api\\auth\\unified\\verify\\route.ts';
let content = fs.readFileSync(filePath, 'utf8');

// Replace the routing logic to check for PENDING_KYC
const newAdminCheck = `
        const adminDoc = await adminDb.collection("admins").where("email", "==", email).limit(1).get();
        if (!adminDoc.empty) {
          const data = adminDoc.docs[0].data();
          if (data.is_active === false) {
             return NextResponse.json({ error: "Your account is suspended." }, { status: 403 });
          }
          assignedRole = data.role || "staff";
          permissions = data.permissions || {};
          
          if (data.status === "PENDING_KYC") {
             redirectUrl = "/onboarding";
          } else if (assignedRole === "external_ca") {
             redirectUrl = "/admin/finance/exports";
          } else {
             redirectUrl = "/admin/dashboard"; 
          }
        }
`;
content = content.replace(/const adminDoc = await adminDb\.collection\("admins"\)[\s\S]*?redirectUrl = "\/admin\/dashboard"; \/\/ Normal staff\n          \}\n        \}/, newAdminCheck);


const newInstallerCheck = `
        const instDoc = await installerQuery.limit(1).get();
        if (!instDoc.empty) {
           const data = instDoc.docs[0].data();
           if (data.is_active === false) return NextResponse.json({ error: "Account suspended." }, { status: 403 });
           assignedRole = "installer";
           
           if (data.status === "PENDING_KYC") {
             redirectUrl = "/onboarding";
           } else {
             redirectUrl = "/installer/dashboard";
           }
        }
`;
content = content.replace(/const instDoc = await installerQuery\.limit\(1\)\.get\(\);\n        if \(\!instDoc\.empty\) \{[\s\S]*?redirectUrl = "\/installer\/dashboard";\n        \}/, newInstallerCheck);


const newPromoterCheck = `
        const promDoc = await promoterQuery.limit(1).get();
        if (!promDoc.empty) {
           const data = promDoc.docs[0].data();
           if (data.is_active === false) return NextResponse.json({ error: "Account suspended." }, { status: 403 });
           assignedRole = "promoter";
           
           if (data.status === "PENDING_KYC") {
             redirectUrl = "/onboarding";
           } else {
             redirectUrl = "/partner/dashboard";
           }
        }
`;
content = content.replace(/const promDoc = await promoterQuery\.limit\(1\)\.get\(\);\n        if \(\!promDoc\.empty\) \{[\s\S]*?redirectUrl = "\/partner\/dashboard";\n        \}/, newPromoterCheck);

fs.writeFileSync(filePath, content);
console.log("Updated unified router to enforce PENDING_KYC redirect.");
