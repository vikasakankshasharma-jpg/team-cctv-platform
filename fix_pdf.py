with open('lib/pdf/quote-pdf.tsx', 'r', encoding='utf-8') as f:
    content = f.read()

target = """  const pricing = quote.pricingSnapshot ? {
    total_payable: quote.pricingSnapshot.total_payable || 0,
    items: quote.pricingSnapshot.items || [],
    addons: quote.pricingSnapshot.addons || [],
    labor_cost: quote.pricingSnapshot.labor_cost || 0,
    gross_subtotal: quote.pricingSnapshot.gross_subtotal || 0,
    gst_rate: quote.pricingSnapshot.gst_rate || 18,
    gst_amount: quote.pricingSnapshot.gst_amount || 0
  } : {
    total_payable: quote.total_payable || 0,
    items: quote.configuration_snapshot || [],
    addons: quote.addons_snapshot || [],
    labor_cost: quote.labor_cost || 0,
    gross_subtotal: quote.gross_subtotal || 0,
    gst_rate: quote.gst_rate || 18,
    gst_amount: quote.gst_amount || 0
  };"""

replacement = """  let rawItems: any[] = [];
  if (Array.isArray(quote?.items) && quote.items.length > 0) {
    rawItems = quote.items;
  } else if (Array.isArray(quote?.configurationSnapshot?.items)) {
    rawItems = quote.configurationSnapshot.items;
  } else if (Array.isArray(quote?.pricingSnapshot?.breakdown?.items)) {
    rawItems = quote.pricingSnapshot.breakdown.items;
  } else if (Array.isArray(quote?.pricingSnapshot?.items)) {
    rawItems = quote.pricingSnapshot.items;
  } else if (Array.isArray(quote?.hardware_cart)) {
    rawItems = quote.hardware_cart;
  } else if (Array.isArray(quote?.configuration_snapshot)) {
    rawItems = quote.configuration_snapshot;
  }

  const pricing = {
    total_payable: quote?.pricingSnapshot?.total_payable ?? quote?.total_payable ?? 0,
    items: rawItems,
    addons: Array.isArray(quote?.addons) ? quote.addons : (quote?.pricingSnapshot?.addons || quote?.addons_snapshot || []),
    labor_cost: quote?.pricingSnapshot?.labor_cost ?? quote?.labor_cost ?? 0,
    gross_subtotal: quote?.pricingSnapshot?.gross_subtotal ?? quote?.gross_subtotal ?? 0,
    gst_rate: quote?.pricingSnapshot?.gst_rate ?? quote?.gst_rate ?? 18,
    gst_amount: quote?.pricingSnapshot?.gst_amount ?? quote?.gst_amount ?? 0
  };"""

if target in content:
    content = content.replace(target, replacement)
    with open('lib/pdf/quote-pdf.tsx', 'w', encoding='utf-8') as f:
        f.write(content)
    print("Success")
else:
    print("Target not found")
