const VAT_RATE = 0.18;
const VAT_LABEL = "כולל מע״מ";
function roundCurrency(value) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}
function addVat(amount) {
  return roundCurrency(amount * (1 + VAT_RATE));
}
function formatCurrency(amount) {
  return new Intl.NumberFormat("he-IL", {
    style: "currency",
    currency: "ILS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
}
export {
  VAT_LABEL as V,
  addVat as a,
  formatCurrency as f
};
