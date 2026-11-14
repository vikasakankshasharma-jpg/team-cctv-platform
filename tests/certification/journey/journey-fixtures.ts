/**
 * @file tests/certification/journey/journey-fixtures.ts
 * @description Phase 7.1 Customer Journey Fixtures & Reference Contexts.
 * Defines canonical customer inputs across Web Wizard and WhatsApp channels.
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import type { CCTVRequirement, Product } from "../../../types";
import type { CalculatePricingV2Params } from "../../../lib/pricing-engine-v2";

// Load certified products and settings from snapshot bundle
const snapshotPath = fileURLToPath(new URL("../fixtures/CERTIFICATION_SNAPSHOT_BUNDLE.json", import.meta.url));
const rawBundle = JSON.parse(readFileSync(snapshotPath, "utf8"));
export const certifiedProducts = Object.freeze(rawBundle.context.products || []);
export const certifiedAddons = Object.freeze(rawBundle.context.addons || []);
export const certifiedSettings = Object.freeze(rawBundle.context.settings || {});

/**
 * Fixture 1: Standard Web Wizard Requirement (4-Camera CP PLUS 4MP IP)
 */
export const webWizardRequirement: CCTVRequirement = {
  camera_count: 4,
  outdoor_camera_count: 2,
  indoor_camera_count: 2,
  brand: "CP PLUS",
  resolution: "4MP",
  technology: "IP",
  storage_retention_days: 15,
  property_type: "home",
  cabling_done: false,
  wiring_type: "open",
  customer_pincode: "302001",
  customer_city: "Jaipur",
};

/**
 * Fixture 2: Standard WhatsApp Bot Requirement (4-Camera HIKVISION 2MP HD)
 */
export const whatsAppRequirement: CCTVRequirement = {
  camera_count: 4,
  outdoor_camera_count: 2,
  indoor_camera_count: 2,
  brand: "HIKVISION",
  resolution: "2MP",
  technology: "HD",
  storage_retention_days: 7,
  property_type: "office",
  cabling_done: false,
  wiring_type: "open",
  customer_pincode: "302012",
  customer_city: "Jaipur",
};

/**
 * Fixture 3: Edited Requirement for Non-Destructive Edit Testing
 * Customer changes camera count from 4 to 6, preserving other selections.
 */
export const editedRequirement: CCTVRequirement = {
  ...webWizardRequirement,
  camera_count: 6,
  outdoor_camera_count: 4,
  indoor_camera_count: 2,
};

/**
 * Helper to construct valid CalculatePricingV2Params for a requirement
 */
export function buildPricingV2Params(
  req: CCTVRequirement,
  productsOverride?: readonly any[]
): CalculatePricingV2Params {
  const products = (productsOverride || certifiedProducts) as any[];

  // Find camera matching brand, technology, resolution or best match
  const cameraProduct =
    products.find(
      (p: any) =>
        (p.category === "cctv_camera" || p.category === "camera") &&
        p.brand?.toUpperCase().includes(req.brand?.toUpperCase()) &&
        p.technology?.toUpperCase() === req.technology?.toUpperCase() &&
        p.resolution === req.resolution
    ) ||
    products.find(
      (p: any) =>
        (p.category === "cctv_camera" || p.category === "camera") &&
        p.brand?.toUpperCase().includes(req.brand?.toUpperCase()) &&
        p.resolution === req.resolution
    ) ||
    products.find(
      (p: any) =>
        (p.category === "cctv_camera" || p.category === "camera") &&
        p.brand?.toUpperCase().includes(req.brand?.toUpperCase())
    ) ||
    products.find((p: any) => p.category === "cctv_camera" || p.category === "camera") ||
    products[0];

  const recorderProduct =
    products.find(
      (p: any) =>
        p.category === "recorder" &&
        p.brand?.toUpperCase().includes(req.brand?.toUpperCase()) &&
        p.technology?.toUpperCase() === req.technology?.toUpperCase()
    ) ||
    products.find(
      (p: any) =>
        p.category === "recorder" &&
        p.technology?.toUpperCase() === req.technology?.toUpperCase()
    ) ||
    products.find((p: any) => p.category === "recorder") ||
    products[1];

  const storageProduct =
    products.find((p: any) => p.category === "storage" && p.sku?.includes("1TB")) ||
    products.find((p: any) => p.category === "storage") ||
    products[2];

  const powerProduct =
    products.find((p: any) => p.category === "power_device") ||
    products[3];

  const cableProduct =
    products.find((p: any) => p.category === "cable") ||
    products[4];

  const resolvedSystem: any = {
    brand: req.brand || "CP PLUS",
    resolution: req.resolution || "4MP",
    technology: req.technology || "IP",
    channelCapacity: req.camera_count || 4,
    cameraCount: req.camera_count || 4,
    storageDays: req.storage_retention_days || 15,
    camera: cameraProduct,
    cameras: [{ product: cameraProduct, qty: req.camera_count || 4, location: "outdoor" }],
    recorder: recorderProduct,
    storage: storageProduct,
    power: powerProduct,
    cable: cableProduct,
  };

  return {
    resolvedSystem,
    req,
    settings: certifiedSettings as any,
    products,
  };
}
