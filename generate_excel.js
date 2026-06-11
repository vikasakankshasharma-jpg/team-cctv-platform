const fs = require('fs');
const xlsx = require('xlsx');
const path = require('path');

const jsonPath = path.join(__dirname, 'mega_jaipur_catalog.json');
const outputPath = 'C:/Users/hp/Documents/Mega_Jaipur_Product_Catalog.xlsx';

function generateExcel() {
  const rawData = fs.readFileSync(jsonPath, 'utf8');
  const products = JSON.parse(rawData);

  // Flatten and format data for Excel
  const excelData = products.map(p => ({
    "Display Name (Marketing)": p.display_name,
    "Technical Name / SKU": p.technical_name,
    "Brand": p.brand || "Unknown",
    "Category ID": p.category,
    "Technologies": p.technologies ? p.technologies.join(", ") : "",
    "Base Cost (₹)": p.base_cost,
    "Margin %": p.margin_percentage,
    "Unit Price (₹)": p.unit_price,
    "Budget Price (₹)": p.unit_price_budget || "",
    "Premium Price (₹)": p.unit_price_premium || "",
    "Resolution Tier": p.resolution_tier || "",
    "Channels": p.channels || "",
    "Max Cameras Supported": p.max_cameras || "",
    "Min Cameras Required": p.min_cameras || "",
    "Catalog Path": p.catalog_path || "",
    "Compatible Paths": p.compatible_paths ? p.compatible_paths.join(" | ") : "",
    "Is Active": p.is_active ? "Yes" : "No"
  }));

  const worksheet = xlsx.utils.json_to_sheet(excelData);
  const workbook = xlsx.utils.book_new();
  
  // Auto-size columns slightly
  const wscols = [
    {wch: 40}, // Display Name
    {wch: 25}, // Technical Name
    {wch: 15}, // Brand
    {wch: 20}, // Category ID
    {wch: 20}, // Tech
    {wch: 15}, // Base Cost
    {wch: 12}, // Margin
    {wch: 15}, // Unit Price
    {wch: 15}, // Budget Price
    {wch: 15}, // Premium Price
    {wch: 15}, // Res
    {wch: 10}, // Channels
    {wch: 20}, // Max Cam
    {wch: 20}, // Min Cam
    {wch: 25}, // Catalog
    {wch: 30}, // Compatible
    {wch: 10}  // Active
  ];
  worksheet['!cols'] = wscols;

  xlsx.utils.book_append_sheet(workbook, worksheet, "Product Catalog");
  
  xlsx.writeFile(workbook, outputPath);
  console.log("Created Excel file at: " + outputPath);
}

generateExcel();
