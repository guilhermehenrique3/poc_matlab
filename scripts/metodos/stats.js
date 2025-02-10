function pearson(y, tCol) {
  const n = y.length;
  let sumY = 0,
    sumT = 0,
    sumYY = 0,
    sumTT = 0,
    sumYT = 0;

  for (let i = 0; i < n; i++) {
    const yi = y[i];
    const ti = tCol[i];
    sumY += yi;
    sumT += ti;
    sumYY += yi * yi;
    sumTT += ti * ti;
    sumYT += yi * ti;
  }

  const numerator = sumYT - (sumY * sumT) / n;
  const denomY = sumYY - sumY ** 2 / n;
  const denomT = sumTT - sumT ** 2 / n;
  const denominator = Math.sqrt(denomY * denomT);

  return denominator === 0 ? 0 : numerator / denominator;
}

function vipp(x, y, t, w) {
  const m = x.length;
  if (m === 0) throw new Error("Matriz X está vazia");
  if (y.length !== m) throw new Error("Dimensão de Y incompatível");
  if (t.length !== m) throw new Error("Dimensão de T incompatível");

  const p = x[0].length;
  const h = t[0].length;

  if (w.length !== p || w[0].length !== h) {
    throw new Error("Dimensão de W incompatível");
  }

  const co = [];
  for (let j = 0; j < h; j++) {
    const tColumn = t.map((row) => row[j]);
    const correlation = pearson(y, tColumn);
    co.push(correlation ** 2);
  }
  const s = co.reduce((sum, val) => sum + val, 0);

  const vip = [];
  for (let i = 0; i < p; i++) {
    let q = 0;
    for (let j = 0; j < h; j++) {
      q += co[j] * w[i][j] ** 2;
    }
    vip.push(Math.sqrt((p * q) / s));
  }

  return vip;
}

module.exports = vipp;
