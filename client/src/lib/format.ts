const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

const inrPrecise = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/** ₹1,23,456 — whole rupees, Indian digit grouping. */
export const formatInr = (amount: number): string => inr.format(amount);

/** ₹1,23,456.78 — used for interest / repayment figures. */
export const formatInrPrecise = (amount: number): string => inrPrecise.format(amount);

/** 16 Sep 2026 */
export function formatDate(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

/** ISO string → `YYYY-MM-DD` for `<input type="date">`. */
export function toDateInputValue(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value;
  return date.toISOString().slice(0, 10);
}
