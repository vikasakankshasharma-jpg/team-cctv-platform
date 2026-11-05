const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '../components/admin/ProductInventory.tsx');
let code = fs.readFileSync(targetPath, 'utf-8');

// Normalize line endings to \n
const isCRLF = code.includes('\r\n');
if (isCRLF) {
  code = code.replace(/\r\n/g, '\n');
}

// 1. Add matchesSearch helper before matchesTech
if (!code.includes('function matchesSearch(')) {
  const oldTech = 'function matchesTech(p: Product, tech: string): boolean {';
  const newTech = `function matchesSearch(p: Product, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    p.display_name.toLowerCase().includes(q) ||
    Boolean(p.technical_name?.toLowerCase().includes(q)) ||
    Boolean(p.internal_sku?.toLowerCase().includes(q)) ||
    Boolean((p.brand || '').toLowerCase().includes(q))
  );
}

function matchesTech(p: Product, tech: string): boolean {`;
  code = code.replace(oldTech, newTech);
}

// 2. Update availableBrands to include search filter and dependency
const oldBrands = `  // Dynamic available brands based on category, technology, and status
  const availableBrands = useMemo(() => {
    const brandCounts = new Map<string, { name: string; count: number }>();

    for (const p of products) {
      if (filterStatus === "active" && !p.is_active) continue;
      if (filterStatus === "inactive" && p.is_active) continue;

      const pCat = p.category || "addon";
      if (filterCat !== "all" && pCat !== filterCat) continue;

      if (!matchesTech(p, filterTech)) continue;`;

const newBrands = `  // Dynamic available brands based on category, technology, status, and search
  const availableBrands = useMemo(() => {
    const brandCounts = new Map<string, { name: string; count: number }>();

    for (const p of products) {
      if (search && !matchesSearch(p, search)) continue;
      if (filterStatus === "active" && !p.is_active) continue;
      if (filterStatus === "inactive" && p.is_active) continue;

      const pCat = p.category || "addon";
      if (filterCat !== "all" && pCat !== filterCat) continue;

      if (!matchesTech(p, filterTech)) continue;`;

code = code.replace(oldBrands, newBrands);
code = code.replace(
  '}, [products, filterCat, filterTech, filterStatus]);',
  '}, [products, search, filterCat, filterTech, filterStatus]);'
);

// 3. Update availableCategories to include search filter and dependency
const oldCats = `  // Dynamic available categories based on brand, technology, and status
  const availableCategories = useMemo(() => {
    const catCounts = new Map<string, number>();

    for (const p of products) {
      if (filterStatus === "active" && !p.is_active) continue;
      if (filterStatus === "inactive" && p.is_active) continue;

      if (filterBrand !== "all" && !isBrandMatch(p, filterBrand)) continue;`;

const newCats = `  // Dynamic available categories based on brand, technology, status, and search
  const availableCategories = useMemo(() => {
    const catCounts = new Map<string, number>();

    for (const p of products) {
      if (search && !matchesSearch(p, search)) continue;
      if (filterStatus === "active" && !p.is_active) continue;
      if (filterStatus === "inactive" && p.is_active) continue;

      if (filterBrand !== "all" && !isBrandMatch(p, filterBrand)) continue;`;

code = code.replace(oldCats, newCats);
code = code.replace(
  '}, [products, filterBrand, filterTech, filterStatus]);',
  '}, [products, search, filterBrand, filterTech, filterStatus]);'
);

// 4. Update techCounts and statusCounts to include search
const oldTechCounts = `  // Dynamic technology counts based on category, brand, and status
  const techCounts = useMemo(() => {
    const counts = { all: 0, IP: 0, HD: 0, Wireless: 0, both: 0 };
    for (const p of products) {
      if (filterStatus === "active" && !p.is_active) continue;
      if (filterStatus === "inactive" && p.is_active) continue;
      if (filterCat !== "all" && (p.category || "addon") !== filterCat) continue;
      if (filterBrand !== "all" && !isBrandMatch(p, filterBrand)) continue;`;

const newTechCounts = `  // Dynamic technology counts based on category, brand, status, and search
  const techCounts = useMemo(() => {
    const counts = { all: 0, IP: 0, HD: 0, Wireless: 0, both: 0 };
    for (const p of products) {
      if (search && !matchesSearch(p, search)) continue;
      if (filterStatus === "active" && !p.is_active) continue;
      if (filterStatus === "inactive" && p.is_active) continue;
      if (filterCat !== "all" && (p.category || "addon") !== filterCat) continue;
      if (filterBrand !== "all" && !isBrandMatch(p, filterBrand)) continue;`;

code = code.replace(oldTechCounts, newTechCounts);
code = code.replace(
  '}, [products, filterCat, filterBrand, filterStatus]);',
  '}, [products, search, filterCat, filterBrand, filterStatus]);'
);

const oldStatusCounts = `  // Dynamic status counts based on category, brand, and technology
  const statusCounts = useMemo(() => {
    const counts = { all: 0, active: 0, inactive: 0 };
    for (const p of products) {
      if (filterCat !== "all" && (p.category || "addon") !== filterCat) continue;
      if (filterBrand !== "all" && !isBrandMatch(p, filterBrand)) continue;
      if (!matchesTech(p, filterTech)) continue;`;

const newStatusCounts = `  // Dynamic status counts based on category, brand, technology, and search
  const statusCounts = useMemo(() => {
    const counts = { all: 0, active: 0, inactive: 0 };
    for (const p of products) {
      if (search && !matchesSearch(p, search)) continue;
      if (filterCat !== "all" && (p.category || "addon") !== filterCat) continue;
      if (filterBrand !== "all" && !isBrandMatch(p, filterBrand)) continue;
      if (!matchesTech(p, filterTech)) continue;`;

code = code.replace(oldStatusCounts, newStatusCounts);
code = code.replace(
  '}, [products, filterCat, filterBrand, filterTech]);',
  '}, [products, search, filterCat, filterBrand, filterTech]);'
);

// 5. Update filtered useMemo to use matchesSearch helper
const oldFiltered = `  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return products.filter((p) => {
      const matchSearch =
        !q ||
        p.display_name.toLowerCase().includes(q) ||
        p.technical_name?.toLowerCase().includes(q) ||
        p.internal_sku?.toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q);`;

const newFiltered = `  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch = matchesSearch(p, search);`;

code = code.replace(oldFiltered, newFiltered);

// 6. Update handleCategoryChange and handleBrandChange to check matchesSearch
const oldHandleCat = `      const hasProductsForBrand = products.some(p => {
        const matchCat = (p.category || "addon") === newCat;
        const matchBrand = isBrandMatch(p, filterBrand);`;

const newHandleCat = `      const hasProductsForBrand = products.some(p => {
        const matchSearch = matchesSearch(p, search);
        const matchCat = (p.category || "addon") === newCat;
        const matchBrand = isBrandMatch(p, filterBrand);`;

code = code.replace(oldHandleCat, newHandleCat);
code = code.replace(
  'return matchCat && matchBrand && matchStatus && matchTech;',
  'return matchSearch && matchCat && matchBrand && matchStatus && matchTech;'
);

const oldHandleBrand = `      const hasProductsForCat = products.some(p => {
        const matchCat = (p.category || "addon") === filterCat;
        const matchBrand = isBrandMatch(p, newBrand);`;

const newHandleBrand = `      const hasProductsForCat = products.some(p => {
        const matchSearch = matchesSearch(p, search);
        const matchCat = (p.category || "addon") === filterCat;
        const matchBrand = isBrandMatch(p, newBrand);`;

code = code.replace(oldHandleBrand, newHandleBrand);

// 7. Update Filter UI grid and labels to prevent text truncation
const oldGrid = `<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">`;
const newGrid = `<div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5">`;
code = code.replace(oldGrid, newGrid);

// Update dropdown labels to clean, concise versions
code = code.replace(
  '<option value="all">All Segments ({availableCategories.reduce((s, c) => s + c.count, 0)})</option>',
  '<option value="all">All Categories ({availableCategories.reduce((s, c) => s + c.count, 0)})</option>'
);

code = code.replace(
  '<option value="all">All Manufacturers ({availableBrands.reduce((s, b) => s + b.count, 0)})</option>',
  '<option value="all">All Brands ({availableBrands.reduce((s, b) => s + b.count, 0)})</option>'
);

code = code.replace(
  '<option value="all">Any Technology ({techCounts.all})</option>',
  '<option value="all">All Tech ({techCounts.all})</option>'
);

code = code.replace(
  '<option value="all">Any Status ({statusCounts.all})</option>',
  '<option value="all">All Status ({statusCounts.all})</option>'
);

code = code.replace(
  '<option value="default">Sort: Default Catalog</option>',
  '<option value="default">Sort: Default</option>'
);

// Make the filter Card sticky and sleek
const oldCard = `      {/* ── Filter bar ── */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">`;

const newCard = `      {/* ── Filter bar ── */}
      <Card className="p-4 sm:p-5 sticky top-2 z-20 shadow-md backdrop-blur-md bg-card/95 border-border/80 transition-all">
        <div className="flex items-center justify-between mb-4">`;

code = code.replace(oldCard, newCard);

// Restore CRLF if needed
if (isCRLF) {
  code = code.replace(/\n/g, '\r\n');
}

fs.writeFileSync(targetPath, code, 'utf-8');
console.log('Successfully updated ProductInventory.tsx');
