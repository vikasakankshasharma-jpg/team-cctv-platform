import fs from "fs";

let content = fs.readFileSync("components/admin/AddonModal.tsx", "utf8");

// Add stock_quantity state initialization
content = content.replace(
  /price: addon\?\.price \|\| 0,/,
  `price: addon?.price || 0,\n    stock_quantity: addon?.stock_quantity ?? 1,`
);

// Add upgrade_camera to options
content = content.replace(
  /<option value="accessory">Accessory<\/option>/,
  `<option value="upgrade_camera">Camera Upgrade (PTZ, Audio, etc.)</option>\n                <option value="accessory">Accessory</option>`
);

// Add stock_quantity input field
const stockInputHtml = `
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2 flex items-center gap-2">
                Stock Quantity
              </label>
              <div className="relative">
                <input
                  required
                  type="number"
                  min="-1"
                  value={formData.stock_quantity}
                  onChange={(e) => setFormData({ ...formData, stock_quantity: Number(e.target.value) })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white font-black text-lg focus:outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all shadow-inner"
                />
                <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] text-zinc-500 font-bold uppercase tracking-widest">
                  (-1 for NA)
                </span>
              </div>
            </div>
`;

content = content.replace(
  /<div className="space-y-2 col-span-2">\s*<label className="text-\[10px\] font-black text-zinc-500 uppercase tracking-\[0\.2em\] ml-2">Internal Technical Ref \(Optional\)<\/label>/,
  `${stockInputHtml}\n\n            <div className="space-y-2 col-span-2">\n              <label className="text-[10px] font-black text-zinc-500 uppercase tracking-[0.2em] ml-2">Internal Technical Ref (Optional)</label>`
);

fs.writeFileSync("components/admin/AddonModal.tsx", content);
console.log("Updated AddonModal with stock_quantity and upgrade_camera");
