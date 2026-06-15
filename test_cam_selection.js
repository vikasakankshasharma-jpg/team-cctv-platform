const fs = require('fs');

const data = JSON.parse(fs.readFileSync('debug_quote_data.json', 'utf8'));
const lead = data.lead;
const products = data.products;

const tech = lead.technology_choice || "IP";

function getCamera(plan_type) {
    return [...products].sort((a, b) => {
        if (plan_type === "budget") return (a.base_cost || a.unit_price) - (b.base_cost || b.unit_price);
        if (plan_type === "premium") return (b.base_cost || b.unit_price) - (a.base_cost || a.unit_price);
        return 0; 
    }).find(p => p.category === "cctv_camera" && p.technologies?.includes(tech));
}

const budgetCam = getCamera("budget");
const recCam = getCamera("recommended");
const premiumCam = getCamera("premium");

function printCam(name, cam) {
    if (!cam) {
        console.log(name, "NOT FOUND");
        return;
    }
    console.log(name, JSON.stringify({
        id: cam.id,
        display_name: cam.display_name,
        technical_name: cam.technical_name,
        brand: cam.brand,
        unit_price: cam.unit_price,
        base_cost: cam.base_cost
    }));
}

printCam("Budget (Standard)", budgetCam);
printCam("Recommended (Professional)", recCam);
printCam("Premium (Elite)", premiumCam);
