import * as fs from 'fs';
import { calculatePricing } from './lib/pricing-engine';

const data = JSON.parse(fs.readFileSync('debug_quote_data.json', 'utf8'));
const lead = data.lead;
const products = data.products;
const settings = data.settings || {}; // Ensure settings is not undefined
const addons = data.addons || [];

const selection = {
  ...lead.wizard_answers,
  ...lead,
  technology: lead.technology_choice,
};

const baseSelection = {
  ...selection,
  technology: "IP",
  selected_camera_option: 1,
  plan_type: "budget",
  selected_camera_id: undefined,
};

const quote = calculatePricing({ selection: baseSelection, products, addons, settings, cablingDone: false });
const cameraItem = quote.items.find((item) => products.some((p: any) => p.id === item.product_id && p.category === "cctv_camera"));
const cam = cameraItem ? products.find((p: any) => p.id === cameraItem.product_id) : undefined;

console.log("cameraItem:", JSON.stringify(cameraItem, null, 2));
if (cam) {
    console.log("cam:", JSON.stringify({
        id: cam.id,
        display_name: cam.display_name,
        camera_model: cam.camera_model,
        brand: cam.brand
    }, null, 2));
} else {
    console.log("cam is undefined");
}
