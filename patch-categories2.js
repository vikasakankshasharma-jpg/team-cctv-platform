const fs = require('fs');

let content = fs.readFileSync('components/admin/ProductInventory.tsx', 'utf8');

// Update imports
if (!content.includes('Wrench')) {
  content = content.replace(
    'Search, ChevronDown, ChevronRight, Edit2, Camera, Monitor, CheckSquare, Square,',
    'Search, ChevronDown, ChevronRight, Edit2, Camera, Monitor, CheckSquare, Square, Wrench, Shield, Tv, Box, Server,'
  );
}

// Replace CATEGORIES
const categoriesRegex = /const CATEGORIES: Record<string, \{ label: string; icon: any \}> = \{[\s\S]*?\};\n/;

const newCategories = `const MUST_HAVE_CATEGORIES: Record<string, { label: string; icon: any }> = {
  camera:       { label: "Cameras (IP/HD)",         icon: Camera },
  recorder:     { label: "Recorders (NVR/DVR/XVR)", icon: Monitor },
  storage:      { label: "Storage (HDD/SD)",        icon: HardDrive },
  connector:    { label: "Connectors (RJ45/BNC/DC)",icon: Zap },
  cable:        { label: "Cables (CAT6/3+1)",       icon: Layers },
  power:        { label: "Power Device (PoE/SMPS)", icon: Cpu },
  installation: { label: "Installation & Services", icon: Wrench },
};

const OPTIONAL_CATEGORIES: Record<string, { label: string; icon: any }> = {
  amc:       { label: "AMC (Maintenance)",          icon: Shield },
  display:   { label: "Display Screen (LCD/TV)",    icon: Tv },
  mount:     { label: "Camera Mount Box",           icon: Box },
  rack:      { label: "Racks (Recorder/Switch)",    icon: Server },
  network:   { label: "Network Devices (Router)",   icon: Cpu },
  accessory: { label: "Other Accessories",          icon: Package },
};

const CATEGORIES = { ...MUST_HAVE_CATEGORIES, ...OPTIONAL_CATEGORIES };
`;

if (!content.includes('MUST_HAVE_CATEGORIES')) {
  content = content.replace(categoriesRegex, newCategories);
}

// Update the render loop
// Let's replace the EXACT text block carefully instead of a regex that might match too much.

const targetRenderLoop = `{["camera", "recorder", ...Object.keys(CATEGORIES).filter(k => !["camera", "recorder"].includes(k))].map((cat) => {
          const items = visibleFiltered.filter((p) => {
            const pCat = p.category || "accessory";
            return pCat === cat;
          });
          
          return (
            <CategorySection
              key={cat}
              categoryKey={cat}
              products={items}
              onEdit={onEdit}
              onToggle={onToggle} selectedIds={selectedIds} onToggleSelect={onToggleSelect} onSelectAllGroup={onSelectAllGroup} onDeselectAllGroup={onDeselectAllGroup}
            />
          );
        })}`;

const newRenderLoop = `{/* MUST HAVE CATEGORIES */}
        <div className="pt-4 pb-2">
          <h2 className="text-xl font-bold tracking-tight text-primary">Must Have for Wired Setup</h2>
          <p className="text-sm text-muted-foreground">Essential core system and labor components.</p>
        </div>
        {Object.keys(MUST_HAVE_CATEGORIES).map((cat) => {
          const items = visibleFiltered.filter((p) => {
            const pCat = p.category || "accessory";
            return pCat === cat;
          });
          
          return (
            <CategorySection
              key={cat}
              categoryKey={cat}
              products={items}
              onEdit={onEdit}
              onToggle={onToggle} selectedIds={selectedIds} onToggleSelect={onToggleSelect} onSelectAllGroup={onSelectAllGroup} onDeselectAllGroup={onDeselectAllGroup}
            />
          );
        })}

        {/* OPTIONAL CATEGORIES */}
        <div className="pt-8 pb-2">
          <h2 className="text-xl font-bold tracking-tight text-primary">Optional Upgrades</h2>
          <p className="text-sm text-muted-foreground">Add-ons, maintenance, and secondary hardware.</p>
        </div>
        {Object.keys(OPTIONAL_CATEGORIES).map((cat) => {
          const items = visibleFiltered.filter((p) => {
            const pCat = p.category || "accessory";
            return pCat === cat;
          });
          
          return (
            <CategorySection
              key={cat}
              categoryKey={cat}
              products={items}
              onEdit={onEdit}
              onToggle={onToggle} selectedIds={selectedIds} onToggleSelect={onToggleSelect} onSelectAllGroup={onSelectAllGroup} onDeselectAllGroup={onDeselectAllGroup}
            />
          );
        })}`;

content = content.replace(targetRenderLoop, newRenderLoop);

fs.writeFileSync('components/admin/ProductInventory.tsx', content);
console.log("Patched ProductInventory.tsx");
