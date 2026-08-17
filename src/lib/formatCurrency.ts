/**
 * Standard Indian Rupee (INR / ₹) currency formatting utilities.
 */

export function formatINR(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return "₹0";
  return `₹${Math.round(val).toLocaleString("en-IN")}`;
}

export function formatINRShort(val: number | undefined | null): string {
  if (val === undefined || val === null || isNaN(val)) return "₹0";
  if (val >= 10000000) {
    return `₹${(val / 10000000).toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    return `₹${(val / 100000).toFixed(2)} Lakh`;
  }
  if (val >= 1000) {
    return `₹${(val / 1000).toFixed(1)}k`;
  }
  return `₹${Math.round(val).toLocaleString("en-IN")}`;
}

export const formatCurrency = formatINR;
