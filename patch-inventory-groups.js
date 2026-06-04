const fs = require('fs');

let page = fs.readFileSync('components/admin/ProductInventory.tsx', 'utf8');

// Replace the groupedProducts useMemo
page = page.replace(
  /const groupedProducts = useMemo\(\(\) => \{[\s\S]*?return groups;\n  \}, \[products, activeTab, searchTerm\]\);/,
  `const hardwareGroups = useMemo(() => {
    const mustHave: Record<string, Product[]> = {};
    const optional: Record<string, Product[]> = {};
    const other: Product[] = [];

    if (activeTab !== "hardware") return { mustHave, optional, other };

    const searchLower = searchTerm.toLowerCase();
    const filtered = products.filter(p => 
      p.display_name?.toLowerCase().includes(searchLower) || 
      p.technical_name?.toLowerCase().includes(searchLower)
    );

    filtered.forEach(p => {
      const cat = p.category || "accessory";
      if (MUST_HAVE_CATEGORIES[cat]) {
        if (!mustHave[cat]) mustHave[cat] = [];
        mustHave[cat].push(p);
      } else if (OPTIONAL_CATEGORIES[cat]) {
        if (!optional[cat]) optional[cat] = [];
        optional[cat].push(p);
      } else {
        other.push(p);
      }
    });

    return { mustHave, optional, other };
  }, [products, activeTab, searchTerm]);

  const serviceGroups = useMemo(() => {
    const groups: Record<string, Product[]> = {};
    if (activeTab !== "services") return groups;
    
    const searchLower = searchTerm.toLowerCase();
    const filtered = products.filter(p => 
      p.display_name?.toLowerCase().includes(searchLower) || 
      p.technical_name?.toLowerCase().includes(searchLower)
    );

    filtered.forEach(p => {
      const cat = p.category || "installation";
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push(p);
    });
    return groups;
  }, [products, activeTab, searchTerm]);`
);

// Replace the render logic
page = page.replace(
  /\{Object\.entries\(groupedProducts\)\.map\(\(\[subLabel, items\]\) => \([\s\S]*?\}\)\}/,
  `{activeTab === "hardware" ? (
              <>
                {Object.keys(hardwareGroups.mustHave).length > 0 && (
                  <div className="bg-muted/10 px-6 py-2 border-b border-border">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Must Have for Wired Setup</span>
                  </div>
                )}
                {Object.entries(hardwareGroups.mustHave).map(([catKey, items]) => (
                  <SubCategoryGroup
                    key={catKey}
                    label={MUST_HAVE_CATEGORIES[catKey].label}
                    products={items}
                    onEdit={onEdit}
                    onToggle={onToggle}
                    selectedIds={selectedIds}
                    onToggleSelect={onToggleSelect}
                    onSelectAllGroup={onSelectAllGroup}
                    onDeselectAllGroup={onDeselectAllGroup}
                  />
                ))}

                {Object.keys(hardwareGroups.optional).length > 0 && (
                  <div className="bg-muted/10 px-6 py-2 border-y border-border mt-4">
                    <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Optional Components</span>
                  </div>
                )}
                {Object.entries(hardwareGroups.optional).map(([catKey, items]) => (
                  <SubCategoryGroup
                    key={catKey}
                    label={OPTIONAL_CATEGORIES[catKey].label}
                    products={items}
                    onEdit={onEdit}
                    onToggle={onToggle}
                    selectedIds={selectedIds}
                    onToggleSelect={onToggleSelect}
                    onSelectAllGroup={onSelectAllGroup}
                    onDeselectAllGroup={onDeselectAllGroup}
                  />
                ))}

                {hardwareGroups.other.length > 0 && (
                  <>
                    <div className="bg-muted/10 px-6 py-2 border-y border-border mt-4">
                      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Other Items</span>
                    </div>
                    <SubCategoryGroup
                      label="Uncategorized"
                      products={hardwareGroups.other}
                      onEdit={onEdit}
                      onToggle={onToggle}
                      selectedIds={selectedIds}
                      onToggleSelect={onToggleSelect}
                      onSelectAllGroup={onSelectAllGroup}
                      onDeselectAllGroup={onDeselectAllGroup}
                    />
                  </>
                )}
              </>
            ) : (
              Object.entries(serviceGroups).map(([catKey, items]) => (
                <SubCategoryGroup
                  key={catKey}
                  label={CATEGORIES[catKey]?.label || catKey}
                  products={items}
                  onEdit={onEdit}
                  onToggle={onToggle}
                  selectedIds={selectedIds}
                  onToggleSelect={onToggleSelect}
                  onSelectAllGroup={onSelectAllGroup}
                  onDeselectAllGroup={onDeselectAllGroup}
                />
              ))
            )}`
);

fs.writeFileSync('components/admin/ProductInventory.tsx', page);
console.log("Patched ProductInventory.tsx with new grouping logic");
