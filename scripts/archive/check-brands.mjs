import { getActiveProducts } from "./lib/firebase-admin.js";

async function run() {
  const products = await getActiveProducts();
  const brands = new Set();
  products.forEach(p => {
    if (p.category === "cctv_camera" || p.category === "recorder") {
      if (p.brand) brands.add(p.brand);
      else {
        // Try parsing from display_name
        if (p.display_name.toLowerCase().includes("cp plus")) brands.add("CP Plus");
        else if (p.display_name.toLowerCase().includes("hikvision")) brands.add("Hikvision");
        else if (p.display_name.toLowerCase().includes("prama")) brands.add("Prama");
        else if (p.display_name.toLowerCase().includes("dahua")) brands.add("Dahua");
      }
    }
  });
  console.log("Found brands:", Array.from(brands));
}
run();
