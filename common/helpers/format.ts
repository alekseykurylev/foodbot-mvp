const rubFormatter = new Intl.NumberFormat("ru-RU", {
  currency: "RUB",
  maximumFractionDigits: 0,
  style: "currency",
});

export function formatRubles(value: number) {
  return rubFormatter.format(value);
}
