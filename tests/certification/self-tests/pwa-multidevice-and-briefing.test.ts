import { test, describe } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { setAppBadge, clearAppBadge } from "../../../lib/pwa-badging.ts";
import { soundAlerts } from "../../../lib/sound-alerts.ts";
import { offlineStorage } from "../../../lib/offline-storage.ts";

describe("PWA Multi-Device & Role Architecture Verification", () => {
  const rootDir = process.cwd();
  const publicDir = path.resolve(rootDir, "public");
  const appDir = path.resolve(rootDir, "app");

  const MANIFEST_FILES = [
    { file: "manifest.json", startUrl: "/", role: "general" },
    { file: "manifest-admin.json", startUrl: "/admin", role: "admin" },
    { file: "manifest-installer.json", startUrl: "/installer/dashboard", role: "installer" },
    { file: "manifest-partner.json", startUrl: "/partner/dashboard", role: "partner" },
    { file: "manifest-salesperson.json", startUrl: "/salesperson/dashboard", role: "salesperson" },
    { file: "manifest-delivery.json", startUrl: "/delivery", role: "delivery" },
  ];

  test("all 6 PWA manifests exist, parse cleanly as JSON, and satisfy PWA install standards", () => {
    for (const m of MANIFEST_FILES) {
      const fullPath = path.join(publicDir, m.file);
      assert.ok(fs.existsSync(fullPath), `Manifest file ${m.file} must exist in public/`);

      const raw = fs.readFileSync(fullPath, "utf-8");
      const json = JSON.parse(raw);

      assert.ok(json.name, `${m.file} must have a valid 'name'`);
      assert.ok(json.short_name, `${m.file} must have a valid 'short_name'`);
      assert.equal(json.start_url, m.startUrl, `${m.file} start_url must match expected role route`);
      assert.equal(json.display, "standalone", `${m.file} display must be 'standalone' for full-screen PWA`);
      assert.ok(json.theme_color, `${m.file} must define a theme_color`);
      assert.ok(json.background_color, `${m.file} must define a background_color`);
      assert.ok(Array.isArray(json.icons) && json.icons.length >= 2, `${m.file} must contain at least 2 icons (192 and 512)`);

      const has192 = json.icons.some((i: any) => i.sizes === "192x192");
      const has512 = json.icons.some((i: any) => i.sizes === "512x512");
      assert.ok(has192, `${m.file} must have 192x192 icon`);
      assert.ok(has512, `${m.file} must have 512x512 icon`);
    }
  });

  test("Service Worker (sw.js) caches all manifests, handles push events, and controls badges", () => {
    const swPath = path.join(publicDir, "sw.js");
    assert.ok(fs.existsSync(swPath), "sw.js must exist in public/");

    const swContent = fs.readFileSync(swPath, "utf-8");

    // Cache list verification
    for (const m of MANIFEST_FILES) {
      assert.ok(swContent.includes(`/${m.file}`), `sw.js must cache /${m.file}`);
    }

    // Web push listeners
    assert.ok(swContent.includes("self.addEventListener('push'"), "sw.js must listen for 'push' events");
    assert.ok(swContent.includes("self.addEventListener('notificationclick'"), "sw.js must listen for 'notificationclick' events");
    assert.ok(swContent.includes("showNotification"), "sw.js must display notifications");

    // Multi-device badging (Windows taskbar, Mac dock, iOS home icon)
    assert.ok(swContent.includes("setAppBadge"), "sw.js must update app badge on push");
    assert.ok(swContent.includes("clearAppBadge"), "sw.js must clear app badge on notification click");
  });

  test("Role layouts link to their authentic manifests", () => {
    const layoutChecks = [
      { file: path.join(appDir, "(admin)/admin/layout.tsx"), manifest: "/manifest-admin.json" },
      { file: path.join(appDir, "(salesperson)/salesperson/layout.tsx"), manifest: "/manifest-salesperson.json" },
      { file: path.join(appDir, "(installer)/layout.tsx"), manifest: "/manifest-installer.json" },
      { file: path.join(appDir, "(partner)/layout.tsx"), manifest: "/manifest-partner.json" },
      { file: path.join(appDir, "delivery/layout.tsx"), manifest: "/manifest-delivery.json" },
    ];

    for (const check of layoutChecks) {
      assert.ok(fs.existsSync(check.file), `Layout file ${check.file} must exist`);
      const content = fs.readFileSync(check.file, "utf-8");
      assert.ok(
        content.includes(`manifest: "${check.manifest}"`) || content.includes(`manifest: '${check.manifest}'`),
        `${check.file} must link to ${check.manifest}`
      );
    }
  });

  test("App Badging API handles SSR and non-browser environments safely without throwing", async () => {
    // In Node.js environment, window/navigator are undefined
    const resSet = await setAppBadge(5);
    assert.equal(resSet, false, "Should return false safely when navigator.setAppBadge is not present");

    const resClear = await clearAppBadge();
    assert.equal(resClear, false, "Should return false safely when navigator.clearAppBadge is not present");
  });

  test("PWA Notification and Briefing API endpoints exist and export valid route handlers", () => {
    const subscribeRoute = path.join(appDir, "api/notifications/push/subscribe/route.ts");
    const sendRoute = path.join(appDir, "api/notifications/push/send/route.ts");
    const triggerRoute = path.join(appDir, "api/daily-briefing/trigger/route.ts");

    assert.ok(fs.existsSync(subscribeRoute), "Push subscribe API route must exist");
    assert.ok(fs.existsSync(sendRoute), "Push send API route must exist");
    assert.ok(fs.existsSync(triggerRoute), "Daily briefing trigger API route must exist");

    const subContent = fs.readFileSync(subscribeRoute, "utf-8");
    const sendContent = fs.readFileSync(sendRoute, "utf-8");
    const trigContent = fs.readFileSync(triggerRoute, "utf-8");

    assert.ok(subContent.includes("export async function POST"), "Subscribe route must export POST handler");
    assert.ok(sendContent.includes("export async function POST"), "Send route must export POST handler");
    assert.ok(trigContent.includes("export async function GET"), "Trigger route must export GET handler");
  });

  test("Web Audio alert chimes synthesizer functions safely in SSR / Node.js without errors", () => {
    assert.doesNotThrow(() => {
      soundAlerts.playLeadAlert();
      soundAlerts.playPaymentSuccess();
      soundAlerts.playJobDispatch();
      soundAlerts.playChecklistChime();
    }, "Audio synthesizer methods must never throw in non-browser environment");

    const initialMute = soundAlerts.getMuteState();
    const toggled = soundAlerts.toggleMute();
    assert.equal(toggled, !initialMute, "Toggle mute must invert the state");
    soundAlerts.toggleMute(); // reset
  });

  test("Offline storage queue manages pending actions safely", () => {
    assert.doesNotThrow(() => {
      const q = offlineStorage.getQueue();
      assert.ok(Array.isArray(q), "Queue must return an array");

      const item = offlineStorage.enqueueAction({
        type: "JOB_CHECKLIST",
        jobId: "test_job_123",
        payload: { checked: true },
      });

      assert.ok(item.id.startsWith("queue_"), "Enqueued item must have unique ID");
      assert.equal(item.jobId, "test_job_123");
      offlineStorage.clearQueue();
    });
  });

  test("vercel.json configures automated Daily Briefing crons for 08:30 AM and 07:30 PM IST", () => {
    const vercelConfigPath = path.join(rootDir, "vercel.json");
    assert.ok(fs.existsSync(vercelConfigPath), "vercel.json must exist");

    const vercelConfig = JSON.parse(fs.readFileSync(vercelConfigPath, "utf-8"));
    assert.ok(Array.isArray(vercelConfig.crons), "vercel.json must contain crons array");

    const morningCron = vercelConfig.crons.find(
      (c: any) => c.path === "/api/cron/daily-briefing" && c.schedule === "0 3 * * *"
    );
    const eveningCron = vercelConfig.crons.find(
      (c: any) => c.path === "/api/cron/daily-briefing" && c.schedule === "0 14 * * *"
    );

    assert.ok(morningCron, "Must configure morning briefing cron at 0 3 * * * (08:30 AM IST)");
    assert.ok(eveningCron, "Must configure evening briefing cron at 0 14 * * * (07:30 PM IST)");
  });
});

