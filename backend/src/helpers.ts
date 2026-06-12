export function createId(prefix: string) {
  return `${prefix}_${Math.random().toString(36).substr(2, 9)}`;
}

export function estimateLocalAmount(amountSats: number, currency: string) {
  const rateMap: Record<string, number> = {
    KES: 0.23,
    UGX: 0.34,
    NGN: 2.5,
    USD: 0.025,
    EUR: 0.023,
  };
  return Math.max(1, Math.round(amountSats * (rateMap[currency.toUpperCase()] ?? rateMap.USD)));
}
