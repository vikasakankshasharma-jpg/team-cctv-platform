const fs = require('fs');

const path = 'components/admin/ProductModal.tsx';
let content = fs.readFileSync(path, 'utf8');

const oldSelect = `<select
                  {...register("category")}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer shadow-sm"
                >
                  <option value="camera">Camera Unit</option>
                  <option value="recorder">Recorder (DVR/NVR)</option>
                  <option value="accessory">Accessory</option>
                  <option value="cable">Cable / Hard Drive</option>
                </select>`;

const newSelect = `<select
                  {...register("category")}
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer shadow-sm"
                >
                  <optgroup label="Must Have">
                    <option value="camera">Camera (IP/HD)</option>
                    <option value="recorder">Recorder (DVR/NVR)</option>
                    <option value="storage">Storage (HDD/SD)</option>
                    <option value="connector">Connectors (RJ45/BNC/DC)</option>
                    <option value="cable">Cables (CAT6/3+1)</option>
                    <option value="power">Power Device (PoE/SMPS)</option>
                    <option value="installation">Installation & Services</option>
                  </optgroup>
                  <optgroup label="Optional">
                    <option value="amc">AMC (Maintenance)</option>
                    <option value="display">Display Screen (LCD/TV)</option>
                    <option value="mount">Camera Mount Box</option>
                    <option value="rack">Racks (Recorder/Switch)</option>
                    <option value="network">Network Devices (Router)</option>
                    <option value="accessory">Other Accessories</option>
                  </optgroup>
                </select>`;

content = content.replace(oldSelect, newSelect);
fs.writeFileSync(path, content);
console.log("Patched components/admin/ProductModal.tsx");
