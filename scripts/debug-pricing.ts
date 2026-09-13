
import { calculatePricing } from "../lib/pricing-engine";
import fs from "fs";

let buf = fs.readFileSync("scratch/db_products.json");
let str = buf.toString("utf16le").trim();
if (!str.startsWith("[")) str = buf.toString("utf8").trim();

const products = JSON.parse(str);

const selection = {
  property_type: "residential",
  technology_preference: "HD",
  technology: "HD",
  plan_type: "budget",
  resolution_preference: "2MP",
  camera_count: "4",
  indoor_camera_count: "4",
  outdoor_camera_count: "0",
  recording_days: "15"
};

const settings = {
  margin_cable: 50,
  connector_bnc_dc_cost: 20,
  connector_rj45_cost: 5
};

try {
  const res = calculatePricing({
    selection: selection as any,
    products,
    addons: [],
    settings: settings as any,
    cablingDone: false
  });
  console.log(JSON.stringify(res, null, 2));
} catch (e) {
  console.error(e);
}

