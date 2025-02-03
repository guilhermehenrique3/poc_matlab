export function tInv(p, df) {
  const a = (1 - p) * 2;
  const sign = a < 0 ? -1 : 1;
  const pAdj = Math.min(a, 2 - a);

  const t = Math.sqrt(df / (betaInv(1 - pAdj, df / 2, 0.5) - 1));
  return sign * t;
}

function betaInv(x, a, b) {
  let l = 0,
    r = 1,
    m;
  for (let i = 0; i < 100; i++) {
    m = (l + r) / 2;
    const f = betaCDF(m, a, b) - x;
    if (f < 0) l = m;
    else r = m;
  }
  return m;
}

function betaCDF(x, a, b) {
  if (x < 0) return 0;
  if (x > 1) return 1;
  return incompleteBeta(x, a, b);
}

function incompleteBeta(x, a, b) {
  let sum = 0;
  const n = 1000;
  const dx = x / n;
  for (let i = 0; i < n; i++) {
    const t = i * dx;
    sum += Math.pow(t, a - 1) * Math.pow(1 - t, b - 1) * dx;
  }
  return sum / beta(a, b);
}

function beta(a, b) {
  return Math.exp(logGamma(a) + logGamma(b) - logGamma(a + b));
}

function logGamma(z) {
  if (z < 0) return Math.log(Math.abs(gamma(z)));
  if (z < 1) return Math.log(gamma(z + 1)) - Math.log(z);

  const g = 7;
  const p = [
    0.99999999999980993, 676.5203681218851, -1259.1392167224028, 771.32342877765313,
    -176.61502916214059, 12.507343278686905, -0.13857109526572012, 9.9843695780195716e-6,
    1.5056327351493116e-7,
  ];

  let x = p[0];
  for (let i = 1; i < g + 2; i++) {
    x += p[i] / (z + i);
  }
  const t = z + g + 0.5;
  return 0.5 * Math.log(2 * Math.PI) + (z + 0.5) * Math.log(t) - t + Math.log(x);
}
