const fs = require("fs");
const path = require("path");
const readline = require("readline");

const projectRoot = path.resolve(__dirname, "..");
const envFiles = [".env.local", ".env.production", ".env.staging"];

function readEnv(filePath) {
  if (!fs.existsSync(filePath)) return {};
  const content = fs.readFileSync(filePath, "utf-8");
  const env = {};
  content.split("\n").forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      const val = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
      env[key] = val;
    }
  });
  return env;
}

function updateEnvFile(filePath, updates) {
  if (!fs.existsSync(filePath)) {
    fs.writeFileSync(filePath, "", "utf-8");
  }
  let content = fs.readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const updatedKeys = new Set();

  const newLines = lines.map((line) => {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) return line;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx !== -1) {
      const key = trimmed.slice(0, eqIdx).trim();
      if (key in updates) {
        updatedKeys.add(key);
        return `${key}="${updates[key]}"`;
      }
    }
    return line;
  });

  // Append any keys that weren't present in the file
  Object.keys(updates).forEach((key) => {
    if (!updatedKeys.has(key)) {
      newLines.push(`${key}="${updates[key]}"`);
    }
  });

  fs.writeFileSync(filePath, newLines.join("\n"), "utf-8");
}

async function verifyRazorpay(keyId, keySecret) {
  try {
    const auth = Buffer.from(`${keyId}:${keySecret}`).toString("base64");
    const res = await fetch("https://api.razorpay.com/v1/orders?count=1", {
      headers: {
        Authorization: `Basic ${auth}`,
      },
    });

    if (res.ok) {
      const isLive = keyId.startsWith("rzp_live");
      return {
        valid: true,
        mode: isLive ? "LIVE" : "TEST",
        message: `Authentication Successful (Mode: ${isLive ? "LIVE ✅" : "TEST ⚠️"})`,
      };
    } else {
      const err = await res.json().catch(() => ({}));
      return {
        valid: false,
        message: err.error?.description || `HTTP ${res.status} Authentication Failed`,
      };
    }
  } catch (err) {
    return {
      valid: false,
      message: `Connection failed: ${err.message}`,
    };
  }
}

async function main() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  const question = (query) => new Promise((resolve) => rl.question(query, resolve));

  console.log("\n==================================================");
  console.log("       TEAM CCTV - Payment & UPI Configuration CLI");
  console.log("==================================================\n");

  // Read current settings from .env.local
  const currentEnv = readEnv(path.join(projectRoot, ".env.local"));
  const currentKeyId = currentEnv.NEXT_PUBLIC_RAZORPAY_KEY_ID || "";
  const currentSecret = currentEnv.RAZORPAY_KEY_SECRET || "";

  console.log(`Current Razorpay Key ID: ${currentKeyId || "(not configured)"}`);
  if (currentKeyId.startsWith("rzp_test")) {
    console.log("⚠️  STATUS: Configured with TEST KEY. Real UPI apps (GPay, PhonePe) will reject test VPAs.");
  } else if (currentKeyId.startsWith("rzp_live")) {
    console.log("✅ STATUS: Configured with LIVE KEY.");
  }
  console.log("");

  const newKeyId = (await question(`Enter Razorpay Key ID [${currentKeyId}]: `)).trim() || currentKeyId;
  const newSecret = (await question(`Enter Razorpay Key Secret [${currentSecret ? "******" : "none"}]: `)).trim() || currentSecret;
  const newUpiId = (await question("Enter Business UPI ID / VPA (e.g., yourbusiness@okhdfc) [press enter to keep current]: ")).trim();

  rl.close();

  if (!newKeyId || !newSecret) {
    console.log("❌ Error: Both Razorpay Key ID and Secret are required.");
    process.exit(1);
  }

  console.log("\n⏳ Verifying Razorpay credentials with Razorpay API...");
  const check = await verifyRazorpay(newKeyId, newSecret);

  if (check.valid) {
    console.log(`✅ ${check.message}`);
  } else {
    console.log(`❌ Verification failed: ${check.message}`);
    console.log("Please re-check your Razorpay Key ID and Secret in your Razorpay Dashboard.");
    process.exit(1);
  }

  // Update .env files
  const updates = {
    NEXT_PUBLIC_RAZORPAY_KEY_ID: newKeyId,
    RAZORPAY_KEY_ID: newKeyId,
    RAZORPAY_KEY_SECRET: newSecret,
  };

  envFiles.forEach((file) => {
    const fullPath = path.join(projectRoot, file);
    if (fs.existsSync(fullPath)) {
      updateEnvFile(fullPath, updates);
      console.log(`💾 Updated: ${file}`);
    }
  });

  // If new UPI ID is provided, update cached-settings.ts and admin settings default
  if (newUpiId) {
    const settingsPath = path.join(projectRoot, "lib", "cached-settings.ts");
    if (fs.existsSync(settingsPath)) {
      let code = fs.readFileSync(settingsPath, "utf-8");
      code = code.replace(/bank_upi_id:\s*"[^"]*"/, `bank_upi_id: "${newUpiId}"`);
      fs.writeFileSync(settingsPath, code, "utf-8");
      console.log(`💾 Updated fallback UPI ID in lib/cached-settings.ts -> ${newUpiId}`);
    }

    const adminSettingsPath = path.join(projectRoot, "app", "(admin)", "admin", "settings", "page.tsx");
    if (fs.existsSync(adminSettingsPath)) {
      let code = fs.readFileSync(adminSettingsPath, "utf-8");
      code = code.replace(/bank_upi_id:\s*"[^"]*"/, `bank_upi_id: "${newUpiId}"`);
      fs.writeFileSync(adminSettingsPath, code, "utf-8");
      console.log(`💾 Updated fallback UPI ID in admin/settings/page.tsx -> ${newUpiId}`);
    }
  }

  console.log("\n🎉 Payment configuration successfully updated!");
  if (check.mode === "LIVE") {
    console.log("Real UPI payments via Google Pay, PhonePe, Paytm, etc. are now active.");
  } else {
    console.log("Note: You are still in TEST mode. To accept real payments, run this CLI with your rzp_live_... keys.");
  }
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
