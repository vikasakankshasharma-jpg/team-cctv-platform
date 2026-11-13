export type ComparisonSeverity = 'PASS' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface ComparisonFinding {
  severity: ComparisonSeverity;
  path: string;
  kind: string;
  expected: unknown;
  actual: unknown;
  message: string;
}

export interface ComparisonResult {
  equal: boolean;
  findings: ComparisonFinding[];
  normalizedOracle: unknown;
  normalizedProduction: unknown;
}

function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value as Record<string, unknown>).filter(([, v]) => v !== undefined).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, stable(v)]));
  }
  return value;
}

function pick(obj: unknown, keys: string[]): unknown {
  if (!obj || typeof obj !== 'object') return undefined;
  const record = obj as Record<string, unknown>;
  for (const key of keys) if (record[key] !== undefined) return record[key];
  return undefined;
}

const LEGACY_LINE_ID_ALIASES: Readonly<Record<string, string>> = {
  LABOR_HD_INSTALLATION: 'labor_install',
  LABOR_IP_INSTALLATION: 'labor_install',
  LABOR_HD_FITTING: 'labor_fitting_only',
  LABOR_IP_FITTING: 'labor_fitting_only',
  LABOR_SMALL_JOB_MINIMUM: 'labor_small_job_minimum',
  SITE_VISIT_FEE: 'labor_visit_charge',
  LABOR_EXCESS_CABLE: 'labor_cabling_excess',
  LABOR_WIRELESS_PRO_FITTING: 'labor_wireless_pro_fitting',
  SURCHARGE_LADDER: 'surcharge_ladder',
  SURCHARGE_MARBLE: 'surcharge_marble',
  SURCHARGE_METAL: 'surcharge_metal',
  SURCHARGE_FURNISHED: 'surcharge_furnished',
  SURCHARGE_HEAVY_DRILLING: 'surcharge_wall_drilling',
};

function normalizeLineId(id: unknown): unknown {
  if (typeof id !== 'string') return id;
  return LEGACY_LINE_ID_ALIASES[id] ?? id;
}

function compareNormalizedLines(a: Record<string, unknown>, b: Record<string, unknown>): number {
  const idCmp = String(a.id ?? '').localeCompare(String(b.id ?? ''));
  if (idCmp !== 0) return idCmp;
  const qtyCmp = Number(a.quantity ?? 0) - Number(b.quantity ?? 0);
  if (qtyCmp !== 0) return qtyCmp;
  return Number(a.unit_price ?? 0) - Number(b.unit_price ?? 0);
}

function normalizeLine(item: unknown): Record<string, unknown> {
  const x = item && typeof item === 'object' ? item as Record<string, unknown> : {};
  const id = normalizeLineId(pick(x, ['product_id', 'addon_id', 'id', 'sku']));
  return {
    id,
    category: x.category,
    quantity: pick(x, ['quantity', 'qty']),
    unit_price: pick(x, ['unit_price', 'selling_price', 'price']),
    taxable_amount: pick(x, ['taxable_amount', 'taxableValue']),
    gst: pick(x, ['gst', 'gst_amount', 'tax']),
    total: pick(x, ['total', 'line_total', 'amount', 'gross']),
  };
}

function semanticRoot(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object') return {};
  const root = value as Record<string, unknown>;
  // pricing-engine adapter returns a wrapper containing the actual calculatePricing result.
  // The independent oracle returns the equivalent semantic pricing result at its own root.
  if (root.calculatePricing && typeof root.calculatePricing === 'object') return root.calculatePricing as Record<string, unknown>;
  return root;
}

function semanticLines(root: Record<string, unknown>): unknown {
  // `lines` is the canonical oracle key. `bom` is only a BOM summary object in the oracle;
  // it must never be treated as the priced line array.
  return pick(root, ['lines', 'line_items', 'items', 'products']) ??
    (Array.isArray(root.bom) ? root.bom : undefined);
}

function normalizeResult(value: unknown): unknown {
  if (!value || typeof value !== 'object') return stable(value);
  const root = semanticRoot(value);
  const lines = semanticLines(root);
  const addons = pick(root, ['addons', 'selected_addons', 'addon_lines']);
  const nonEmptyAddons = Array.isArray(addons) && addons.length === 0 ? undefined : addons;

  // Normalize Oracle and production terminology into one semantic vocabulary. This avoids
  // comparing mirror fields such as subtotal_gross vs gross_subtotal as unrelated properties.
  const canonical = {
    lines: Array.isArray(lines)
      ? lines.map(normalizeLine).sort(compareNormalizedLines)
      : lines,
    addons: Array.isArray(nonEmptyAddons)
      ? nonEmptyAddons.map(normalizeLine).sort(compareNormalizedLines)
      : nonEmptyAddons,
    gross_subtotal: pick(root, ['gross_subtotal', 'subtotal_gross', 'subtotal']),
    net_taxable_amount: pick(root, ['net_taxable_amount', 'taxable_total', 'taxable_amount', 'total_before_gst']),
    gst_amount: pick(root, ['gst_amount', 'gst_total', 'total_gst']),
    total_payable: pick(root, ['total_payable', 'grand_total', 'final_total', 'customer_total']),
    requiresIndustrialQuote: pick(root, ['requiresIndustrialQuote', 'manual_quote', 'quote_mode']),
  };
  return stable(canonical);
}

function diff(expected: unknown, actual: unknown, path = '$', findings: ComparisonFinding[] = []): ComparisonFinding[] {
  if (Object.is(expected, actual)) return findings;
  if (typeof expected !== typeof actual) {
    findings.push({ severity: 'ERROR', path, kind: 'TYPE_MISMATCH', expected, actual, message: `Type mismatch at ${path}` }); return findings;
  }
  if (expected === null || actual === null) {
    findings.push({ severity: 'ERROR', path, kind: 'VALUE_MISMATCH', expected, actual, message: `Value mismatch at ${path}` });
    return findings;
  }
  if (Array.isArray(expected) !== Array.isArray(actual)) {
    findings.push({ severity: 'ERROR', path, kind: 'TYPE_MISMATCH', expected, actual, message: `Array/object mismatch at ${path}` });
    return findings;
  }
  if (Array.isArray(expected) && Array.isArray(actual)) {
    if (expected.length !== actual.length) findings.push({ severity: 'ERROR', path, kind: 'ARRAY_LENGTH_MISMATCH', expected: expected.length, actual: actual.length, message: `Array length mismatch at ${path}` });
    const length = Math.min(expected.length, actual.length);
    for (let i = 0; i < length; i += 1) diff(expected[i], actual[i], `${path}[${i}]`, findings);
    return findings;
  }
  if (expected && actual && typeof expected === 'object') {
    const a = expected as Record<string, unknown>; const b = actual as Record<string, unknown>;
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    for (const key of [...keys].sort()) diff(a[key], b[key], `${path}.${key}`, findings);
    return findings;
  }
  findings.push({ severity: 'ERROR', path, kind: 'VALUE_MISMATCH', expected, actual, message: `Value mismatch at ${path}` });
  return findings;
}

export function compareOracleVsProduction(oracle: unknown, production: unknown): ComparisonResult {
  const normalizedOracle = normalizeResult(oracle);
  const normalizedProduction = normalizeResult(production);
  const findings = diff(normalizedOracle, normalizedProduction);
  return { equal: findings.length === 0, findings, normalizedOracle, normalizedProduction };
}
