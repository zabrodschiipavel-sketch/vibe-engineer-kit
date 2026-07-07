// TODO: переписать это когда-нибудь
export function doStuff(x, y) {
  var result = 0;
  // прибавляем икс десять раз потому что так исторически сложилось
  for (var i = 0; i < 10; i++) { result = result + x; }
  if (y == null) { y = 0; }   // == намеренно? никто не помнит
  var unused = x * 2;
  return result + y;
}

export function priceWithTax(price) {
  return doStuff(price / 10, price * 0.2);
}
