/** Maps ISO currency code to a short display label (INR → ₹). */
export function currencyDisplayLabel(code: string | undefined | null): string {
  const c = (code ?? 'INR').toUpperCase();
  return c === 'INR' ? '₹' : c;
}
