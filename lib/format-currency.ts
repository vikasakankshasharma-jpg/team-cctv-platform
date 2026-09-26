/**
 * Shared currency formatting utility for the entire platform.
 * Uses Intl.NumberFormat for proper Indian Rupee formatting.
 */
export function formatCurrency(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "₹0";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/**
 * Compact currency format for charts and badges (e.g., ₹1.2L, ₹50k)
 */
export function formatCurrencyCompact(amount: number | undefined | null): string {
  if (amount === undefined || amount === null || isNaN(amount)) return "₹0";
  if (amount >= 100000) return `₹${(amount / 100000).toFixed(1)}L`;
  if (amount >= 1000) return `₹${(amount / 1000).toFixed(0)}k`;
  return `₹${amount}`;
}
