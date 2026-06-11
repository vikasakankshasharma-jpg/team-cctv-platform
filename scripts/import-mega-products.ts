/**
 * Imports saved Mega Jaipur / Mega Compu World product listing HTML into Firestore.
 *
 * Usage:
 *   npm run import:mega-products
 *   npm run import:mega-products -- --out data/mega-products.generated.json
 *   npm run import:mega-products -- --apply
 */

import * as admin from "firebase-admin";
import * as cheerio from "cheerio";
import * as crypto from "crypto";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as os from "os";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

type ProductCategory =
  | "camera"
  | "recorder"
  | "storage"
  | "connector"
  | "cable"
  | "power_device"
  | "installation"
  | "amc"
  | "display"
  | "mount"
  | "rack"
  | "network"
  | "accessory"
  | "unidentified";

type Technology = "HD" | "IP" | "Wireless" | "Common";

interface ParsedCard {
  name: string;
  description: string;
  price: number;
  exTaxPrice?: number;
  cdDiscount?: number;
  brand?: string;
  imageUrl?: string;
  productUrl?: string;
  sourceFile: string;
  sourceCategory: string;
}

interface MegaProduct {
  id: string;
  technical_name: string;
  display_name: string;
  category: ProductCategory;
  technology: Technology;
  technologies: Technology[];
  unit_price: number;
  base_cost: number;
  margin_percentage: number;
  is_active: boolean;
  is_deleted: boolean;
  vendor_id: "mega-jaipur";
  vendor_product_id: string;
  internal_sku: string;
  brand?: string;
  description?: string;
  image_url?: string;
  catalog_path: string;
  compatible_paths?: string[];
  features?: string[];
  tags?: string[];
  source_url?: string;
  source_category: string;
  source_pages: string[];
  source_price_tax?: number;
  source_cd_discount?: number;
  source_imported_at: string;
  resolution_mp?: number;
  resolution_tier?: "good" | "very_clear" | "crystal_clear";
  channels?: number;
  max_cameras?: number;
  rack_u_height?: number;
  cable_length_m?: number;
  cable_type?: string;
  power_voltage_v?: number;
  power_amperage_a?: number;
  power_wattage_w?: number;
  storage_type?: string;
  storage_capacity_tb?: number;
  network_ports?: number;
  network_speed?: string;
  night_vision_type?: "ir" | "color" | "dual_light" | "starlight";
  night_vision_range_m?: number;
  lens_mm?: number;
  form_factor?: "dome" | "bullet" | "ptz" | "turret" | "fisheye";
  ip_rating?: string;
  compression?: "H.264" | "H.265" | "H.265+";
  wdr?: boolean;
  has_audio?: boolean;
  has_sd_slot?: boolean;
  poe?: boolean;
  warranty_years?: number;
  stock_quantity?: number;
  custom_attributes?: { key: string; value: string }[];
}

const DEFAULT_SOURCE_DIR = path.join(os.homedir(), "Documents", "Megacompuworld");
const DEFAULT_VENDOR_ID = "mega-jaipur";
const BATCH_SIZE = 450;

const HTML_FILES = [
  "Accessories CCTV & Networking _ Mega Jaipur.html",
  "LAN Cables (CAT6) _ Mega Jaipur.html",
  "3+1 CCTV Cables _ Mega Jaipur.html",
  "HDMI Cables _ Mega Jaipur.html",
  "Rack & Accessories _ Mega Compu World.html",
  "Point To Point (P2P) _ Mega Jaipur.html",
  "Router _ Access Point _ Range Extender _ Mega Compu.html",
  "Poe Switch _ Mega Compu World.html",
  "Rack & Accessories.html",
  "Power Supply _ Adapter _ Mega Compu World.html",
  "PTZ _ PT _ 4G _ WIFI Camera _ Mega Compu World.html",
  "IP NVR _ Mega Compu World.html",
  "IP Camera _ Mega Compu World.html",
  "HD DVR _ Mega Compu World.html",
  "HD Camera _ Mega Compu World.html",
  "Led _ Monitor _ Mega Compu World.html",
  "Pull Out Hard Disk _ Mega Jaipur.html",
  "Surveillance Hard Disk _ Mega Jaipur.html",
  "SD _ Micro SD Cards _ Mega Jaipur.html",
];

function getArgValue(flag: string): string | undefined {
  const index = process.argv.indexOf(flag);
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function hasArg(flag: string): boolean {
  return process.argv.includes(flag);
}

function cleanText(value: string | undefined): string {
  return (value || "").replace(/\s+/g, " ").trim();
}

function parsePrice(value: string | undefined): number | undefined {
  const normalized = (value || "").replace(/[^\d.]/g, "");
  if (!normalized) return undefined;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? Math.round(parsed) : undefined;
}

function slug(value: string): string {
  return cleanText(value)
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 72);
}

function hash(value: string, length = 8): string {
  return crypto.createHash("sha1").update(value).digest("hex").slice(0, length);
}

function sourceCategoryFromFile(fileName: string): string {
  return path
    .basename(fileName, ".html")
    .replace(/\s*_\s*Mega(?: Jaipur| Compu World| Compu)?$/i, "")
    .replace(/\s*_\s*/g, " / ")
    .replace(/\s+/g, " ")
    .trim();
}

function absoluteMegaUrl(value?: string): string | undefined {
  const trimmed = cleanText(value);
  if (!trimmed) return undefined;
  try {
    return new URL(trimmed, "https://megajaipur.com/").toString();
  } catch {
    return trimmed;
  }
}

function imageFromSrcset(srcset?: string): string | undefined {
  if (!srcset) return undefined;
  const candidates = srcset
    .split(",")
    .map((entry) => cleanText(entry).split(/\s+/)[0])
    .filter(Boolean);
  return absoluteMegaUrl(candidates[candidates.length - 1]);
}

function inferBrand(name: string, explicitBrand?: string): string | undefined {
  const explicit = cleanText(explicitBrand);
  if (explicit && !/^brand$/i.test(explicit)) return explicit;

  const upper = name.toUpperCase();
  const knownBrands: [RegExp, string][] = [
    [/\bCP\s*PLUS\b|\bCPPLUS\b/, "CP Plus"],
    [/\bPRAMA\b/, "Prama"],
    [/\bHIKVISION\b/, "Hikvision"],
    [/\bDAHUA\b/, "Dahua"],
    [/\bHIFOCUS\b/, "Hi-Focus"],
    [/\bTP[-\s]?LINK\b/, "TP-Link"],
    [/\bTENDA\b/, "Tenda"],
    [/\bD[-\s]?LINK\b/, "D-Link"],
    [/\bMERCUSYS\b/, "Mercusys"],
    [/\bNETGEAR\b/, "Netgear"],
    [/\bUBIQUITI\b|\bUBNT\b/, "Ubiquiti"],
    [/\bMIKROTIK\b/, "MikroTik"],
    [/\bWD\b|\bWESTERN DIGITAL\b/, "Western Digital"],
    [/\bSEAGATE\b/, "Seagate"],
    [/\bSANDISK\b/, "SanDisk"],
    [/\bKINGSTON\b/, "Kingston"],
    [/\bSAMSUNG\b/, "Samsung"],
    [/\bLG\b/, "LG"],
    [/\bDELL\b/, "Dell"],
    [/\bHP\b/, "HP"],
    [/\bLAPCARE\b/, "Lapcare"],
    [/\bQUANTUM\b/, "Quantum"],
    [/\bDURA[-\s]?LINE\b/, "Dura-Line"],
  ];

  return knownBrands.find(([pattern]) => pattern.test(upper))?.[1];
}

function extractModel(name: string): string | undefined {
  const parenthesized = name.match(/\(([A-Z0-9][A-Z0-9._/\-\s]{2,})\)/i)?.[1];
  if (parenthesized) return cleanText(parenthesized);

  const candidates = name.match(/\b[A-Z]{1,5}[-/]?[A-Z0-9]{2,}(?:[-/][A-Z0-9]{2,}){1,}\b/g);
  return candidates?.find((candidate) => /\d/.test(candidate));
}

function lowerSpecs(card: ParsedCard): string {
  return `${card.sourceCategory} ${card.name} ${card.description}`.toLowerCase();
}

function classifyCategory(card: ParsedCard): ProductCategory {
  const text = lowerSpecs(card);
  const source = card.sourceCategory.toLowerCase();

  if (source.includes("hd dvr") || source.includes("ip nvr")) return "recorder";
  if (source.includes("hard disk") || source.includes("sd")) return "storage";
  if (source.includes("power")) return "power_device";
  if (source.includes("lan cables") || source.includes("3+1") || source.includes("hdmi cables")) return "cable";
  if (source.includes("rack")) return "rack";
  if (source.includes("led") || source.includes("monitor")) return "display";
  if (source.includes("poe switch") || source.includes("router") || source.includes("access point") || source.includes("range extender") || source.includes("point to point")) return "network";
  if (source.includes("camera")) return "camera";

  if (/\b(nvr|dvr|xvr|digital video recorder|network video recorder)\b/.test(text)) return "recorder";
  if (/\b(hdd|hard disk|surveillance disk|ssd|micro\s*sd|memory card|tf card)\b/.test(text)) return "storage";
  if (/\b(power supply|adapter|adaptor|smps|ups|battery|charger)\b/.test(text)) return "power_device";
  if (/\b(bnc|rj45|connector|coupler|keystone|face plate|module|i\/o|balun|jack|crimp|plug)\b/.test(text)) return "connector";
  if (/\b(rack|wall mount cabinet|network cabinet|\d+\s*u\b)\b/.test(text)) return "rack";
  if (/\b(cable|wire|patch cord|cat\s*6|cat6|cat\s*5|cat5|hdmi|rg59|fiber|fibre)\b/.test(text)) return "cable";
  if (/\b(bracket|mount|junction box|pvc box|back box|stand|clamp|guard|rain\s*shade|sun\s*shade)\b/.test(text)) return "mount";
  if (/\b(router|access point|range extender|p2p|point to point|poe switch|poe extender|switch|media converter|sfp|onu|ont|ethernet|network)\b/.test(text)) return "network";
  if (/\b(monitor|display|led|lcd|tv)\b/.test(text)) return "display";
  if (/\b(camera|dome|bullet|ptz|turret|fisheye|cctv cam)\b/.test(text)) return "camera";
  if (source.includes("accessories")) return "accessory";

  return "unidentified";
}

function classifyTechnology(card: ParsedCard, category: ProductCategory): Technology {
  const text = lowerSpecs(card);
  const source = card.sourceCategory.toLowerCase();

  if (/\b(wi-?fi|wireless|4g|5g|sim|gsm|lte|p2p|point to point)\b/.test(text)) return "Wireless";
  if (category === "recorder") {
    if (/\bnvr\b/.test(text) || source.includes("nvr")) return "IP";
    if (/\b(dvr|xvr)\b/.test(text) || source.includes("dvr")) return "HD";
  }
  if (category === "camera") {
    if (source.includes("ip camera") || /\b(ip|poe|network)\b/.test(text)) return "IP";
    if (source.includes("hd camera") || /\b(hd|hdcvi|hdtvi|ahd|analog|coaxial)\b/.test(text)) return "HD";
  }
  if (category === "cable") {
    if (/\b(cat\s*6|cat6|cat\s*5|cat5|lan|ethernet|fiber|patch cord)\b/.test(text)) return "IP";
    if (/\b(3\+1|rg59|coaxial|bnc|cctv cable)\b/.test(text)) return "HD";
  }
  if (category === "network") return "IP";
  if (category === "power_device" && /\bpoe\b/.test(text)) return "IP";

  return "Common";
}

function firstNumber(pattern: RegExp, text: string): number | undefined {
  const match = text.match(pattern);
  if (!match?.[1]) return undefined;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : undefined;
}

function inferResolutionMp(text: string): number | undefined {
  if (/\b4k\b|\buhd\b/.test(text)) return 8;
  const value = firstNumber(/\b(\d+(?:\.\d+)?)\s*mp\b/i, text);
  if (value) return value;
  const pixel = text.match(/\b(?:resolution\s*)?(\d{3,4})p\b/i)?.[1];
  if (pixel === "1080") return 2;
  if (pixel === "1440") return 4;
  if (pixel === "2160") return 8;
  return undefined;
}

function resolutionTier(resolutionMp?: number): "good" | "very_clear" | "crystal_clear" | undefined {
  if (!resolutionMp) return undefined;
  if (resolutionMp >= 5) return "crystal_clear";
  if (resolutionMp >= 3) return "very_clear";
  return "good";
}

function inferChannels(text: string): number | undefined {
  return firstNumber(/\b(\d{1,3})\s*(?:ch|channel|channels)\b/i, text);
}

function inferStorageCapacityTb(text: string): number | undefined {
  const tb = firstNumber(/\b(\d+(?:\.\d+)?)\s*tb\b/i, text);
  if (tb) return tb;
  const gb = firstNumber(/\b(\d+(?:\.\d+)?)\s*gb\b/i, text);
  return gb ? Number((gb / 1000).toFixed(2)) : undefined;
}

function inferStorageType(text: string): string | undefined {
  if (/\bmicro\s*sd|\bsd card|\btf card\b/i.test(text)) return "MicroSD";
  if (/\bssd\b/i.test(text)) return "SSD";
  if (/\bhdd|hard disk|surveillance disk\b/i.test(text)) return "HDD";
  return undefined;
}

function inferCableType(text: string): string | undefined {
  if (/\bcat\s*6|cat6\b/i.test(text)) return "CAT6 LAN";
  if (/\bcat\s*5|cat5\b/i.test(text)) return "CAT5 LAN";
  if (/\b3\+1\b/i.test(text)) return "3+1 CCTV";
  if (/\bhdmi\b/i.test(text)) return "HDMI";
  if (/\brg59|coax/i.test(text)) return "Coaxial CCTV";
  if (/\bfiber|fibre/i.test(text)) return "Fiber";
  if (/\bpatch cord\b/i.test(text)) return "Patch Cord";
  return undefined;
}

function inferNetworkSpeed(text: string): string | undefined {
  if (/\b2\.5g\b/i.test(text)) return "2.5Gbps";
  if (/\bgigabit|1000mbps|1g\b/i.test(text)) return "1Gbps";
  if (/\b10\/100\/1000\b/i.test(text)) return "10/100/1000 Mbps";
  if (/\b10\/100\b/i.test(text)) return "10/100 Mbps";
  if (/\b300mbps\b/i.test(text)) return "300 Mbps";
  if (/\b1200mbps\b/i.test(text)) return "1200 Mbps";
  return undefined;
}

function inferNightVisionType(text: string): "ir" | "color" | "dual_light" | "starlight" | undefined {
  if (/\bstarlight\b/i.test(text)) return "starlight";
  if (/\bdual\s*light|smart\s*light\b/i.test(text)) return "dual_light";
  if (/\b(color|colour)\s*(night|vu|view)|full\s*color|full\s*colour\b/i.test(text)) return "color";
  if (/\bir\b|night vision/i.test(text)) return "ir";
  return undefined;
}

function inferFormFactor(text: string): "dome" | "bullet" | "ptz" | "turret" | "fisheye" | undefined {
  if (/\bptz\b|pan\s*tilt/i.test(text)) return "ptz";
  if (/\bfisheye\b/i.test(text)) return "fisheye";
  if (/\bturret\b/i.test(text)) return "turret";
  if (/\bbullet\b/i.test(text)) return "bullet";
  if (/\bdome\b/i.test(text)) return "dome";
  return undefined;
}

function inferFeatures(text: string, category: ProductCategory): string[] {
  const features = new Set<string>();

  if (/\bpoe\b/i.test(text)) features.add("poe");
  if (/\b(wi-?fi|wireless)\b/i.test(text)) features.add("wifi");
  if (/\b4g|lte|sim\b/i.test(text)) features.add("4g");
  if (/\bptz\b|pan\s*tilt/i.test(text)) features.add("ptz");
  if (/\bmic|audio|two[-\s]?way\b/i.test(text)) features.add("audio");
  if (/\bsd card|micro\s*sd|tf card\b/i.test(text)) features.add("sd_card");
  if (/\bwdr|dwdr\b/i.test(text)) features.add("wdr");
  if (/\bh\.?265\+?\b/i.test(text)) features.add("h265");
  if (/\bh\.?264\b/i.test(text)) features.add("h264");
  if (/\bsmart|ai|human|person|vehicle|motion\b/i.test(text)) features.add("smart_detection");
  if (/\bcolor|colour|dual light|starlight\b/i.test(text) && category === "camera") features.add("color_night");
  if (/\bir\b|night vision|low light/i.test(text) && category === "camera") features.add("night_vision");
  if (/\bweatherproof|ip6[5678]|outdoor\b/i.test(text)) features.add("outdoor");

  return [...features].sort();
}

function buildCatalogPath(
  card: ParsedCard,
  category: ProductCategory,
  technology: Technology,
  resolutionMp?: number,
  channels?: number,
  rackUHeight?: number,
  storageType?: string,
  storageCapacityTb?: number,
  cableType?: string,
): string {
  const text = lowerSpecs(card);
  const resolutionLabel = resolutionMp ? `${resolutionMp}MP` : "General";
  const channelLabel = channels ? `${channels}CH` : "General";

  if (category === "camera") {
    if (technology === "Wireless") {
      if (/\b4g|sim|lte\b/i.test(text)) return "CCTV/Cameras/Wireless/4G";
      if (/\bptz\b|pan\s*tilt/i.test(text)) return "CCTV/Cameras/Wireless/PTZ";
      return "CCTV/Cameras/Wireless/WiFi";
    }
    return `CCTV/Cameras/${technology}/${resolutionLabel}`;
  }

  if (category === "recorder") {
    if (technology === "IP" || /\bnvr\b/i.test(text)) return `CCTV/Recorders/NVR/${channelLabel}`;
    return `CCTV/Recorders/DVR/${channelLabel}`;
  }

  if (category === "storage") {
    const capacity = storageCapacityTb ? `${storageCapacityTb}TB` : "General";
    if (storageType === "MicroSD") return `CCTV/Storage/MicroSD/${capacity}`;
    if (/pull\s*out/i.test(text)) return `CCTV/Storage/Pull-Out HDD/${capacity}`;
    if (storageType === "HDD") return `CCTV/Storage/Surveillance HDD/${capacity}`;
    return "CCTV/Storage/General";
  }

  if (category === "cable") {
    if (cableType) return `CCTV/Cables/${cableType}`;
    return technology === "IP" ? "CCTV/Cables/LAN" : "CCTV/Cables/General";
  }

  if (category === "connector") {
    if (/\bbnc\b/i.test(text)) return "CCTV/Connectors/BNC";
    if (/\brj45\b/i.test(text)) return "CCTV/Connectors/RJ45";
    if (/\bbalun\b/i.test(text)) return "CCTV/Connectors/Balun";
    return "CCTV/Connectors/General";
  }

  if (category === "power_device") {
    if (/\bpoe\b/i.test(text)) return "CCTV/Power/PoE";
    if (/\bups|battery\b/i.test(text)) return "CCTV/Power/Backup";
    if (/\bsmps\b/i.test(text)) return "CCTV/Power/SMPS";
    return "CCTV/Power/Adapters";
  }

  if (category === "network") {
    if (/\bpoe\b/i.test(text)) return "CCTV/Network/PoE Switches";
    if (/\brouter\b/i.test(text)) return "CCTV/Network/Routers";
    if (/\baccess point|ap\b/i.test(text)) return "CCTV/Network/Access Points";
    if (/\brange extender|extender\b/i.test(text)) return "CCTV/Network/Range Extenders";
    if (/\bp2p|point to point\b/i.test(text)) return "CCTV/Network/P2P Wireless";
    if (/\bsfp\b/i.test(text)) return "CCTV/Network/SFP";
    if (/\bmedia converter\b/i.test(text)) return "CCTV/Network/Media Converters";
    if (/\bswitch\b/i.test(text)) return "CCTV/Network/Switches";
    return "CCTV/Network/General";
  }

  if (category === "rack") {
    return rackUHeight ? `CCTV/Racks/${rackUHeight}U` : "CCTV/Racks/Accessories";
  }

  if (category === "display") {
    const size = text.match(/\b(\d{2})\s*(?:inch|inches|")/i)?.[1];
    return size ? `CCTV/Displays/LED Monitors/${size} inch` : "CCTV/Displays/LED Monitors";
  }

  if (category === "mount") {
    if (/\bjunction|box\b/i.test(text)) return "CCTV/Mounts/Junction Boxes";
    if (/\bbracket\b/i.test(text)) return "CCTV/Mounts/Camera Brackets";
    return "CCTV/Mounts/General";
  }

  if (category === "accessory") return `CCTV/Accessories/${card.sourceCategory}`;

  return "CCTV/Unidentified";
}

function compatiblePaths(category: ProductCategory, technology: Technology, catalogPath: string): string[] | undefined {
  if (category === "recorder") return technology === "IP" ? ["CCTV/Cameras/IP"] : ["CCTV/Cameras/HD"];
  if (category === "storage") return ["CCTV/Recorders/DVR", "CCTV/Recorders/NVR"];
  if (category === "display") return ["CCTV/Recorders"];
  if (category === "rack") return ["CCTV/Recorders", "CCTV/Network"];
  if (category === "network" && /PoE|Switches|P2P|Access Points/.test(catalogPath)) return ["CCTV/Cameras/IP"];
  if (category === "power_device") return technology === "IP" ? ["CCTV/Cameras/IP"] : ["CCTV/Cameras/HD", "CCTV/Cameras/IP"];
  if (category === "cable") {
    if (technology === "IP") return ["CCTV/Cameras/IP", "CCTV/Network"];
    if (technology === "HD") return ["CCTV/Cameras/HD"];
    if (/HDMI/.test(catalogPath)) return ["CCTV/Recorders", "CCTV/Displays"];
  }
  if (category === "connector") return technology === "IP" ? ["CCTV/Cameras/IP"] : ["CCTV/Cameras/HD"];
  if (category === "mount") return ["CCTV/Cameras"];
  return undefined;
}

function customAttributes(card: ParsedCard): { key: string; value: string }[] {
  const attributes: { key: string; value: string }[] = [];
  if (card.exTaxPrice !== undefined) attributes.push({ key: "Mega Ex Tax Price", value: `₹${card.exTaxPrice}` });
  if (card.cdDiscount !== undefined) attributes.push({ key: "Mega CD Discount", value: `₹${card.cdDiscount}` });
  attributes.push({ key: "Source Page", value: card.sourceCategory });
  return attributes;
}

function buildProduct(card: ParsedCard): MegaProduct {
  const specText = `${card.name} ${card.description}`;
  const fullText = lowerSpecs(card);
  const category = classifyCategory(card);
  const technology = classifyTechnology(card, category);
  const resolutionMp = inferResolutionMp(specText);
  const channels = inferChannels(specText);
  const rackUHeight = firstNumber(/\b(\d{1,2})\s*u\b/i, specText);
  const cableType = inferCableType(specText);
  const cableLengthM = category === "cable" ? firstNumber(/\b(\d{1,4}(?:\.\d+)?)\s*(?:mtr|meter|metre|m)\b/i, specText) : undefined;
  const storageType = inferStorageType(specText);
  const storageCapacityTb = inferStorageCapacityTb(specText);
  const networkPorts = category === "network" || /switch|poe/i.test(specText)
    ? firstNumber(/\b(\d{1,3})\s*(?:port|ports|poe)\b/i, specText) || channels
    : undefined;
  const networkSpeed = inferNetworkSpeed(specText);
  const powerVoltage = firstNumber(/\b(\d+(?:\.\d+)?)\s*v\b/i, specText);
  const powerAmperage = firstNumber(/\b(\d+(?:\.\d+)?)\s*a\b/i, specText);
  const powerWattage = firstNumber(/\b(\d+(?:\.\d+)?)\s*w\b/i, specText);
  const model = extractModel(card.name);
  const technicalName = model || card.name;
  const baseCost = card.exTaxPrice || card.price;
  const marginPercentage = baseCost > 0 ? Number((((card.price - baseCost) / baseCost) * 100).toFixed(2)) : 0;
  const productHash = hash(`${DEFAULT_VENDOR_ID}:${card.name}`);
  const catalogPath = buildCatalogPath(card, category, technology, resolutionMp, channels, rackUHeight, storageType, storageCapacityTb, cableType);
  const features = inferFeatures(fullText, category);
  const tags = [
    category,
    technology.toLowerCase(),
    slug(card.sourceCategory),
    card.brand ? slug(card.brand) : undefined,
    resolutionMp ? `${resolutionMp}mp` : undefined,
    channels ? `${channels}ch` : undefined,
    cableType ? slug(cableType) : undefined,
    storageType ? slug(storageType) : undefined,
  ].filter(Boolean) as string[];
  const ipRating = specText.match(/\bIP6[5678]\b/i)?.[0]?.toUpperCase();

  return {
    id: `mega_${slug(card.name)}_${productHash}`,
    technical_name: technicalName,
    display_name: card.name,
    category,
    technology,
    technologies: [technology],
    unit_price: card.price,
    base_cost: baseCost,
    margin_percentage: marginPercentage,
    is_active: card.price > 0,
    is_deleted: false,
    vendor_id: DEFAULT_VENDOR_ID,
    vendor_product_id: model || productHash,
    internal_sku: `MEGA-${category.slice(0, 3).toUpperCase()}-${productHash.toUpperCase()}`,
    brand: card.brand,
    description: card.description || undefined,
    image_url: card.imageUrl,
    catalog_path: catalogPath,
    compatible_paths: compatiblePaths(category, technology, catalogPath),
    features: features.length ? features : undefined,
    tags,
    source_url: card.productUrl,
    source_category: card.sourceCategory,
    source_pages: [card.sourceFile],
    source_price_tax: card.exTaxPrice,
    source_cd_discount: card.cdDiscount,
    source_imported_at: new Date().toISOString(),
    resolution_mp: resolutionMp,
    resolution_tier: resolutionTier(resolutionMp),
    channels,
    max_cameras: channels || networkPorts,
    rack_u_height: rackUHeight,
    cable_length_m: cableLengthM,
    cable_type: cableType,
    power_voltage_v: powerVoltage,
    power_amperage_a: powerAmperage,
    power_wattage_w: powerWattage,
    storage_type: storageType,
    storage_capacity_tb: storageCapacityTb,
    network_ports: networkPorts,
    network_speed: networkSpeed,
    night_vision_type: inferNightVisionType(specText),
    night_vision_range_m: category === "camera" ? firstNumber(/\b(\d{1,3})\s*m(?:tr|eter)?\s*(?:ir|night|range)?\b/i, specText) : undefined,
    lens_mm: firstNumber(/\b(\d+(?:\.\d+)?)\s*mm\b/i, specText),
    form_factor: inferFormFactor(specText),
    ip_rating: ipRating,
    compression: /\bh\.?265\+\b/i.test(specText) ? "H.265+" : /\bh\.?265\b/i.test(specText) ? "H.265" : /\bh\.?264\b/i.test(specText) ? "H.264" : undefined,
    wdr: /\bwdr|dwdr\b/i.test(specText) || undefined,
    has_audio: /\bmic|audio|two[-\s]?way\b/i.test(specText) || undefined,
    has_sd_slot: /\bsd card|micro\s*sd|tf card\b/i.test(specText) || undefined,
    poe: /\bpoe\b/i.test(specText) || undefined,
    warranty_years: firstNumber(/\b(\d+)\s*(?:year|yr)s?\b/i, specText),
    stock_quantity: card.price > 0 ? 1 : 0,
    custom_attributes: customAttributes(card),
  };
}

function compactProduct(product: MegaProduct): MegaProduct {
  const cleaned: Record<string, unknown> = {};
  Object.entries(product).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    if (Array.isArray(value) && value.length === 0) return;
    cleaned[key] = value;
  });
  return cleaned as unknown as MegaProduct;
}

function parseHtmlFile(filePath: string): ParsedCard[] {
  const fileName = path.basename(filePath);
  const html = fs.readFileSync(filePath, "utf8");
  const $ = cheerio.load(html);
  const sourceCategory = sourceCategoryFromFile(fileName);
  const cards: ParsedCard[] = [];

  $(".product-thumb").each((_, element) => {
    const card = $(element);
    const image = card.find("img[alt]").first();
    const name = cleanText(image.attr("alt") || card.find(".name a").first().text());
    if (!name) return;

    const price = parsePrice(card.find(".price-new").first().text()) || parsePrice(card.find(".price").first().text()) || 0;
    const productUrl = absoluteMegaUrl(card.find(".name a[href], a[href]").first().attr("href"));
    const srcsetUrl = imageFromSrcset(image.attr("srcset"));
    const imageUrl = srcsetUrl || absoluteMegaUrl(image.attr("data-src") || image.attr("src"));
    const explicitBrand = cleanText(card.find(".BrandIconProduct img[alt]").first().attr("alt") || card.find(".manufacturer img[alt]").first().attr("alt"));

    cards.push({
      name,
      description: cleanText(card.find(".description").first().text()),
      price,
      exTaxPrice: parsePrice(card.find(".price-tax").first().text()),
      cdDiscount: parsePrice(card.find(".price-cd").first().text()),
      brand: inferBrand(name, explicitBrand),
      imageUrl,
      productUrl,
      sourceFile: fileName,
      sourceCategory,
    });
  });

  return cards;
}

function mergeDuplicateProducts(products: MegaProduct[]): MegaProduct[] {
  const byName = new Map<string, MegaProduct>();

  for (const product of products) {
    const key = slug(product.display_name);
    const existing = byName.get(key);

    if (!existing) {
      byName.set(key, product);
      continue;
    }

    existing.source_pages = [...new Set([...existing.source_pages, ...product.source_pages])].sort();
    existing.tags = [...new Set([...(existing.tags || []), ...(product.tags || [])])].sort();
    existing.features = [...new Set([...(existing.features || []), ...(product.features || [])])].sort();
    existing.compatible_paths = [...new Set([...(existing.compatible_paths || []), ...(product.compatible_paths || [])])].sort();
    existing.custom_attributes = [...(existing.custom_attributes || []), ...(product.custom_attributes || [])]
      .filter((attribute, index, all) => all.findIndex((item) => item.key === attribute.key && item.value === attribute.value) === index);

    if (!existing.description && product.description) existing.description = product.description;
    if (!existing.image_url && product.image_url) existing.image_url = product.image_url;
    if (!existing.source_url && product.source_url) existing.source_url = product.source_url;
    if (!existing.brand && product.brand) existing.brand = product.brand;
    if ((!existing.unit_price || product.unit_price < existing.unit_price) && product.unit_price > 0) {
      existing.unit_price = product.unit_price;
      existing.base_cost = product.base_cost;
      existing.margin_percentage = product.margin_percentage;
      existing.source_price_tax = product.source_price_tax;
      existing.source_cd_discount = product.source_cd_discount;
    }
  }

  return [...byName.values()].map(compactProduct).sort((a, b) => {
    if (a.category !== b.category) return a.category.localeCompare(b.category);
    if (a.catalog_path !== b.catalog_path) return a.catalog_path.localeCompare(b.catalog_path);
    return a.display_name.localeCompare(b.display_name);
  });
}

function parseAllProducts(sourceDir: string): { products: MegaProduct[]; missingFiles: string[]; parsedCards: number } {
  const missingFiles: string[] = [];
  const cards: ParsedCard[] = [];

  for (const fileName of HTML_FILES) {
    const filePath = path.join(sourceDir, fileName);
    if (!fs.existsSync(filePath)) {
      missingFiles.push(fileName);
      continue;
    }
    cards.push(...parseHtmlFile(filePath));
  }

  return {
    products: mergeDuplicateProducts(cards.map(buildProduct)),
    missingFiles,
    parsedCards: cards.length,
  };
}

function printSummary(products: MegaProduct[], parsedCards: number, missingFiles: string[]): void {
  const byCategory = new Map<string, number>();
  const byCatalogPath = new Map<string, number>();
  const bySource = new Map<string, number>();

  for (const product of products) {
    byCategory.set(product.category, (byCategory.get(product.category) || 0) + 1);
    byCatalogPath.set(product.catalog_path, (byCatalogPath.get(product.catalog_path) || 0) + 1);
    for (const sourcePage of product.source_pages) {
      bySource.set(sourceCategoryFromFile(sourcePage), (bySource.get(sourceCategoryFromFile(sourcePage)) || 0) + 1);
    }
  }

  console.log("\nMega Jaipur product import");
  console.log(`  Parsed cards: ${parsedCards}`);
  console.log(`  Unique products: ${products.length}`);
  console.log(`  Missing files: ${missingFiles.length ? missingFiles.join(", ") : "none"}`);
  console.log("\nCategory split:");
  [...byCategory.entries()].sort((a, b) => a[0].localeCompare(b[0])).forEach(([category, count]) => {
    console.log(`  ${category}: ${count}`);
  });
  console.log("\nLargest catalog paths:");
  [...byCatalogPath.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 18)
    .forEach(([catalogPath, count]) => {
      console.log(`  ${catalogPath}: ${count}`);
    });
  console.log("\nSource page split:");
  [...bySource.entries()].sort((a, b) => a[0].localeCompare(b[0])).forEach(([source, count]) => {
    console.log(`  ${source}: ${count}`);
  });
}

function writeOutput(products: MegaProduct[], outPath: string): void {
  const resolvedPath = path.resolve(process.cwd(), outPath);
  fs.mkdirSync(path.dirname(resolvedPath), { recursive: true });
  fs.writeFileSync(resolvedPath, `${JSON.stringify({ vendor_id: DEFAULT_VENDOR_ID, products }, null, 2)}\n`, "utf8");
  console.log(`\nWrote generated catalog: ${resolvedPath}`);
}

function initializeFirebase(): FirebaseFirestore.Firestore {
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, "\n");
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error("Missing Firebase Admin env vars in .env.local: FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY");
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert({
        projectId,
        clientEmail,
        privateKey,
      }),
    });
  }

  return admin.firestore();
}

async function upsertProducts(products: MegaProduct[]): Promise<void> {
  const db = initializeFirebase();

  for (let index = 0; index < products.length; index += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = products.slice(index, index + BATCH_SIZE);

    for (const product of chunk) {
      const { id, ...data } = product;
      const docRef = db.collection("products").doc(id);
      batch.set(
        docRef,
        {
          ...data,
          updated_at: admin.firestore.FieldValue.serverTimestamp(),
          imported_at: admin.firestore.FieldValue.serverTimestamp(),
        },
        { merge: true },
      );
    }

    await batch.commit();
    console.log(`  Upserted ${Math.min(index + BATCH_SIZE, products.length)} / ${products.length}`);
  }
}

async function main(): Promise<void> {
  const sourceDir = path.resolve(getArgValue("--dir") || DEFAULT_SOURCE_DIR);
  const outPath = getArgValue("--out");
  const shouldApply = hasArg("--apply");
  const { products, missingFiles, parsedCards } = parseAllProducts(sourceDir);

  printSummary(products, parsedCards, missingFiles);

  if (outPath) {
    writeOutput(products, outPath);
  }

  if (shouldApply) {
    console.log("\nApplying import to Firestore products collection...");
    await upsertProducts(products);
    console.log(`\nDone. Upserted ${products.length} Mega Jaipur products.`);
  } else {
    console.log("\nDry run only. Re-run with --apply to upsert into Firestore.");
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
