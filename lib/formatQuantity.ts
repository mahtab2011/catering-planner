export function formatQuantity(qty: number, type: string) {
  if (type === "ml") {
    if (qty >= 1000) {
      return (qty / 1000).toFixed(2) + " L";
    }
    return qty + " ml";
  }

  if (type === "gram") {
    if (qty >= 1000) {
      return (qty / 1000).toFixed(2) + " kg";
    }
    return qty + " g";
  }

  return qty.toString();
}