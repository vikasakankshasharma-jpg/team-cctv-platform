import { calculatePricing } from "./lib/pricing-engine";

const selection: any = {
  property_type: "commercial",
  technology_preference: "IP",
  camera_count: 10,
  mixed_camera_requirements: [{ type: "Bullet", count: 10 }]
};

const products: any[] = [];
const addons = [
  {
    id: "sw4",
    display_name: "4 Port PoE Switch",
    category: "power",
    price: 1500,
    unit_price: 1500,
    max_cameras: 4
  },
  {
    id: "sw8",
    display_name: "8 Port PoE Switch",
    category: "power",
    price: 2500,
    unit_price: 2500,
    max_cameras: 8
  },
  {
    id: "sw16",
    display_name: "16 Port PoE Switch",
    category: "power",
    price: 6000,
    unit_price: 6000,
    max_cameras: 16
  }
];

const result = calculatePricing({ selection, products: products as any, addons: addons as any, settings: {} as any } as any);
const switchItem = result.items.find((i: any) => i.display_name.includes("Switch"));
console.log("Switch selected:", switchItem);
