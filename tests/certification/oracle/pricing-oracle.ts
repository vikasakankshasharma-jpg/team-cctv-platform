import type { CanonicalRequirement } from "../schema/canonical-requirement.ts";
import type { FrozenContext, FrozenProduct } from "../types/certification.ts";
import { calculateOracleAddons } from "./addon-oracle.ts";
import { calculateOracleBom, type BomLine } from "./bom-oracle.ts";
import { calculateOracleMargin, type MarginOraclePolicy } from "./margin-oracle.ts";
import { calculateOracleSurcharges, type SiteSurchargeFlags } from "./surcharge-oracle.ts";
import { calculateReverseInclusiveTax } from "./tax-oracle.ts";

export interface PricingLine {
  sku: string;
  category?: string;
  quantity: number;
  unit_price: number;
  taxable_unit_price: number;
  gst_unit_price: number;
  gross: number;
  reason: string;
}

export interface OraclePricingResult {
  lines: PricingLine[];
  addons?: PricingLine[];
  subtotal_gross: number;
  taxable_total: number;
  gst_total: number;
  grand_total: number;
  margin_total: number;
  manual_quote: boolean;
  requiresIndustrialQuote?: boolean;
  issues?: string[];
}

function round2(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function productBySku(context: FrozenContext, sku: string): FrozenProduct | undefined {
  return [...context.products, ...context.addons].find((product) => product.id === sku || product.sku === sku);
}

function numberSetting(settings: Readonly<Record<string, unknown>>, keys: string[], fallback: number): number {
  for (const key of keys) {
    const value = settings[key];
    if (typeof value === "number" && Number.isFinite(value)) return value;
  }
  return fallback;
}

function productGrossPrice(product: FrozenProduct, policy: MarginOraclePolicy): number {
  // P2.1: Retail price authority - product.unit_price is authoritative customer gross price.
  // margin_percentage / app_settings must not reconstruct an existing product's customer price.
  if (typeof product.unit_price === "number" && Number.isFinite(product.unit_price) && product.unit_price > 0) {
    return round2(product.unit_price);
  }
  const margin = calculateOracleMargin(product, policy);
  if (margin) return margin.selling_price_gross_inclusive;
  return 0;
}

function bomLineToPricing(
  line: BomLine,
  context: FrozenContext,
  policy: MarginOraclePolicy,
  marginOverride?: number,
  configuredFallbackUnitPrice?: number,
  category?: string,
  preferLineUnitPrice?: boolean,
): PricingLine | undefined {
  if (line.quantity <= 0) return undefined;
  const product = productBySku(context, line.sku);
  let unit: number | undefined;
  if (preferLineUnitPrice && typeof line.unit_price === "number" && Number.isFinite(line.unit_price)) {
    unit = round2(line.unit_price);
  } else if (product) {
    if (typeof marginOverride === "number" && typeof product.base_cost === "number" && Number.isFinite(product.base_cost)) {
      unit = round2(product.base_cost * (1 + marginOverride / 100));
    } else {
      unit = productGrossPrice(product, policy);
    }
  } else if (line.sku === "connector_bnc_dc") {
    // BUSINESS_RULES / production pricing-engine: connector_bnc_dc_cost is a BASE COST,
    // not a GST-paid retail unit price. Apply the approved connector margin here when the
    // frozen catalog does not contain a concrete connector SKU.
    const configuredBaseCost = context.app_settings.connector_bnc_dc_cost ?? 20;
    if (typeof configuredBaseCost === "number" && Number.isFinite(configuredBaseCost)) {
      const connectorMargin = policy.margins?.margin_connectors ?? 50;
      unit = round2(configuredBaseCost * (1 + connectorMargin / 100));
    }
  } else if (typeof line.unit_price === "number" && Number.isFinite(line.unit_price)) {
    unit = round2(line.unit_price);
  } else if (typeof configuredFallbackUnitPrice === "number" && Number.isFinite(configuredFallbackUnitPrice)) {
    unit = configuredFallbackUnitPrice;
  }
  if (unit === undefined) return undefined;
  const tax = calculateReverseInclusiveTax(unit);
  return {
    sku: product ? (product.id ?? product.sku) : line.sku,
    category: category ?? product?.category,
    quantity: line.quantity,
    unit_price: unit,
    taxable_unit_price: tax.taxable,
    gst_unit_price: tax.gst,
    gross: round2(unit * line.quantity),
    reason: line.reason,
  };
}

function laborLine(sku: string, amount: number, quantity: number, reason: string): PricingLine {
  const unit = amount;
  const tax = calculateReverseInclusiveTax(unit);
  return {
    sku,
    category: "service",
    quantity,
    unit_price: unit,
    taxable_unit_price: tax.taxable,
    gst_unit_price: tax.gst,
    gross: round2(unit * quantity),
    reason,
  };
}

function appendProductLines(
  lines: PricingLine[],
  bomLines: BomLine[],
  context: FrozenContext,
  policy: MarginOraclePolicy,
  issues: string[],
  options: { marginOverride?: number; fallbackUnitPrice?: number; category?: string; preferLineUnitPrice?: boolean } = {},
): void {
  for (const bomLine of bomLines) {
    const priced = bomLineToPricing(
      bomLine,
      context,
      policy,
      options.marginOverride,
      options.fallbackUnitPrice,
      options.category,
      options.preferLineUnitPrice,
    );
    if (priced) lines.push(priced);
    else if (bomLine.quantity > 0) issues.push(`PRICE_SKU_NOT_FOUND:${bomLine.sku}`);
  }
}

export function calculateOraclePricing(
  requirement: CanonicalRequirement,
  context: FrozenContext,
  marginPolicy: MarginOraclePolicy = {},
  siteSurchargeFlags: SiteSurchargeFlags = {},
): OraclePricingResult {
  const lines: PricingLine[] = [];
  const issues: string[] = [];
  const bom = calculateOracleBom(requirement, context);

  // P2.3: MANUAL_QUOTE & Boundary semantics
  // For HD/Wireless > 16, IP > 32, camera_count > 64:
  // Production contract is requiresIndustrialQuote = true, gross = 0, lines = [].
  // The Oracle must NOT generate a synthetic priced BOM for manual/industrial quote cases.
  if (bom.manual_quote || (requirement.camera_count <= 0 && (!requirement.cameras || requirement.cameras.length === 0))) {
    return {
      lines: [],
      addons: [],
      subtotal_gross: 0,
      taxable_total: 0,
      gst_total: 0,
      grand_total: 0,
      margin_total: 0,
      manual_quote: bom.manual_quote,
      requiresIndustrialQuote: bom.manual_quote,
      issues: [...bom.issues, ...(bom.manual_quote ? ["MANUAL_QUOTE_BOUNDARY"] : ["ZERO_CAMERA_BOUNDARY"])],
    };
  }

  const addons = calculateOracleAddons(requirement, context);
  const surcharges = calculateOracleSurcharges(requirement, siteSurchargeFlags, context.app_settings);

  // Camera lines come from BOM selection, which already enforces technology + resolution + brand.
  appendProductLines(lines, bom.cameras, context, marginPolicy, issues, { category: "camera" });
  if (bom.recorder) appendProductLines(lines, [bom.recorder], context, marginPolicy, issues, { category: "recorder" });
  appendProductLines(lines, bom.storage, context, marginPolicy, issues, { category: "storage" });
  appendProductLines(lines, bom.power, context, marginPolicy, issues, { category: "power" });
  const configuredRj45Rate = [
    context.app_settings.rj45UnitPrice,
    context.app_settings.rj45_unit_price,
    context.app_settings.connectorRj45Rate,
    context.app_settings.connector_rj45_rate,
    context.app_settings.rj45Rate,
    context.app_settings.rj45_rate,
  ].find((value) => typeof value === "number" && Number.isFinite(value)) as number | undefined;
  appendProductLines(lines, bom.connectors, context, marginPolicy, issues, {
    fallbackUnitPrice: configuredRj45Rate,
    category: "accessory",
  });
  if (bom.junction_lines && bom.junction_lines.length > 0) {
    appendProductLines(lines, bom.junction_lines, context, marginPolicy, issues, {
      category: "accessory",
      preferLineUnitPrice: true,
    });
  } else if (bom.junction_boxes) {
    const junctionProduct = [...context.products, ...context.addons].find(
      (product) =>
        (product.category === "camera_mount" || /junction.*box|weatherproof.*box/i.test(`${product.technical_name ?? ""} ${product.display_name ?? product.name ?? ""}`)) &&
        !/rack|stand/i.test(`${product.technical_name ?? ""} ${product.display_name ?? product.name ?? ""}`),
    );
    if (junctionProduct) {
      appendProductLines(
        lines,
        [{ sku: junctionProduct.id ?? junctionProduct.sku, quantity: bom.junction_boxes.quantity, reason: bom.junction_boxes.reason }],
        context,
        marginPolicy,
        issues,
        { category: "accessory" },
      );
    } else {
      issues.push("JUNCTION_BOX_NOT_FOUND");
    }
  }
  if (bom.cabling?.cable_lines) {
    appendProductLines(lines, bom.cabling.cable_lines, context, marginPolicy, issues, {
      marginOverride: bom.cabling.margin_percent,
      category: "cable",
      preferLineUnitPrice: true,
    });
  }

  const addonLines: PricingLine[] = [];
  for (const addonBom of addons.lines) {
    const matched = productBySku(context, addonBom.sku);
    const pricedAddon = bomLineToPricing(
      addonBom,
      context,
      marginPolicy,
      undefined,
      undefined,
      matched?.category || "accessory",
    );
    if (pricedAddon) addonLines.push(pricedAddon);
    else if (addonBom.quantity > 0) issues.push(`PRICE_SKU_NOT_FOUND:${addonBom.sku}`);
  }

  // Installation/fitting labor matches production calculateLabor:
  // DIY preference applies strictly to pure Wireless systems; wired systems always include installation labor.
  const hd = requirement.cameras.length > 0
    ? requirement.cameras.filter((camera) => camera.technology === "HD").reduce((sum, camera) => sum + camera.count, 0)
    : requirement.technology === "HD" ? requirement.camera_count : 0;
  const ip = requirement.cameras.length > 0
    ? requirement.cameras.filter((camera) => camera.technology === "IP").reduce((sum, camera) => sum + camera.count, 0)
    : requirement.technology === "IP" ? requirement.camera_count : 0;
  const wireless = requirement.cameras.length > 0
    ? requirement.cameras.filter((camera) => camera.technology === "Wireless").reduce((sum, camera) => sum + camera.count, 0)
    : requirement.technology === "Wireless" ? requirement.camera_count : 0;
  const wired = hd + ip;

  const hdInstallRate = numberSetting(context.app_settings, ["labor_hd_per_camera", "labor_full_installation_rate"], 400);
  const ipInstallRate = numberSetting(context.app_settings, ["labor_ip_per_camera"], 500);
  const hdFittingRate = numberSetting(context.app_settings, ["labor_hd_fitting_only"], 200);
  const ipFittingRate = numberSetting(context.app_settings, ["labor_ip_fitting_only"], 300);
  const smallJobThreshold = numberSetting(context.app_settings, ["labor_no_cabling_small_job_threshold"], 2);
  const smallJobFlatRate = numberSetting(context.app_settings, ["labor_no_cabling_small_job_rate"], 500);
  const noCablingVisitCharge = numberSetting(context.app_settings, ["labor_no_cabling_visit_charge"], 500);
  const wirelessProRate = numberSetting(context.app_settings, ["labor_wireless_pro_per_camera"], 349);

  if (wired === 0 && wireless > 0) {
    if (requirement.installation_preference !== "diy") {
      lines.push(laborLine("labor_wireless_pro_fitting", wirelessProRate, wireless, "Wireless pro fitting labor; 0% margin."));
    }
  } else if (wired > 0) {
    if (requirement.cabling_mode === "all_existing") {
      if (wired <= smallJobThreshold) {
        lines.push(laborLine("labor_small_job_minimum", smallJobFlatRate, wired, "Existing cabling small-job flat rate per camera; 0% margin."));
      } else {
        if (hd > 0) lines.push(laborLine("labor_fitting_only", hdFittingRate, hd, "HD fitting-only labor; 0% margin."));
        if (ip > 0) lines.push(laborLine("labor_fitting_only", ipFittingRate, ip, "IP fitting-only labor; 0% margin."));
        if (noCablingVisitCharge > 0) {
          lines.push(laborLine("labor_visit_charge", noCablingVisitCharge, 1, "Existing cabling site visit fee; 0% margin."));
        }
      }
    } else {
      const rawCablingNeeded = requirement.cabling_needed_cameras;
      const isMixed = typeof rawCablingNeeded === "number" && rawCablingNeeded > 0 && rawCablingNeeded < wired;
      const cablingQty = isMixed ? rawCablingNeeded : wired;
      const fittingOnlyQty = isMixed ? wired - cablingQty : 0;

      if (ip > 0 && hd === 0) {
        lines.push(laborLine("labor_install", ipInstallRate, cablingQty, "IP full-install labor; 0% margin."));
        if (fittingOnlyQty > 0) {
          lines.push(laborLine("labor_fitting_only", ipFittingRate, fittingOnlyQty, "IP fitting-only labor; 0% margin."));
        }
      } else {
        lines.push(laborLine("labor_install", hdInstallRate, cablingQty, "HD full-install labor; 0% margin."));
        if (fittingOnlyQty > 0) {
          lines.push(laborLine("labor_fitting_only", hdFittingRate, fittingOnlyQty, "HD fitting-only labor; 0% margin."));
        }
      }

      const rawCableMeters = requirement.cable_length_meters ?? 0;
      const freeMeters = cablingQty * 15;
      const excessMeters = Math.max(0, rawCableMeters - freeMeters);
      if (excessMeters > 0) {
        const excessRate = numberSetting(context.app_settings, ["excessCableLaborRate", "excess_cable_labor_rate"], 15);
        lines.push(laborLine("labor_cabling_excess", excessRate, excessMeters, "Excess cable labor; 0% margin; default ₹15/m per BUSINESS_RULES §4.2."));
      }
    }

    if (wireless > 0) {
      lines.push(laborLine("labor_wireless_pro_fitting", wirelessProRate, wireless, "Hybrid wireless camera fitting labor; 0% margin."));
    }
  }

  for (const surcharge of surcharges.lines) {
    const surchargeSku = surcharge.code === "HEAVY_DRILLING"
      ? "surcharge_wall_drilling"
      : `surcharge_${surcharge.code.toLowerCase()}`;
    lines.push(laborLine(surchargeSku, surcharge.amount, 1, `${surcharge.reason} 0% margin.`));
  }

  const allPricedLines = [...lines, ...addonLines];
  const subtotal = round2(allPricedLines.reduce((sum, line) => sum + line.gross, 0));
  const tax = calculateReverseInclusiveTax(subtotal);
  let marginTotal = 0;
  for (const line of allPricedLines) {
    if (
      line.category === "service" ||
      line.sku.startsWith("labor_") ||
      line.sku.startsWith("surcharge_") ||
      line.sku.startsWith("LABOR_") ||
      line.sku.startsWith("SITE_VISIT") ||
      line.sku.startsWith("SURCHARGE_")
    ) {
      continue;
    }
    const product = productBySku(context, line.sku);
    if (!product || typeof product.base_cost !== "number") continue;
    marginTotal += round2((line.unit_price - product.base_cost) * line.quantity);
  }

  return {
    lines,
    addons: addonLines,
    subtotal_gross: subtotal,
    taxable_total: tax.taxable,
    gst_total: tax.gst,
    grand_total: subtotal,
    margin_total: round2(marginTotal),
    manual_quote: bom.manual_quote,
    requiresIndustrialQuote: bom.manual_quote,
    issues: [...bom.issues, ...addons.issues, ...issues],
  };
}
