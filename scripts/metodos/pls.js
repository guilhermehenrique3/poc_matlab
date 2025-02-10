const { pretreat } = require("./pretreat.js");
const { plsNipals } = require("./plsNipals.js");
const math = require("mathjs");

function pls(X, y, A = 2, method = "center") {
  const Mx = X.length;
  const Nx = X[0].length;
  A = Math.min(Mx, Nx, A);

  const [Xs, xpara1, xpara2] = pretreat(X, method);
  const [ys, ypara1, ypara2] = pretreat(y, method);

  const { B, W, T, P, Q, R2X, R2Y, Xr, Yr } = plsNipals(Xs, ys, A);

  const coef = calculateCoefficients(W, Q, xpara2, ypara2, xpara1, ypara1, Nx, A);

  const { ypred, error, SST, SSR, SSE, R2, RMSEF } = calculateMetrics(X, y, coef, Mx);

  return {
    method,
    check: 0,
    coefOrigin: coef,
    coefStandardized: B,
    XScores: T,
    XLoadings: P,
    R2X,
    R2Y,
    Wstar: W,
    yEst: ypred,
    residue: error,
    Xr,
    Yr,
    SST,
    SSR,
    SSE,
    RMSEF,
    R2,
  };
}

function calculateCoefficients(W, Q, xpara2, ypara2, xpara1, ypara1, Nx, A) {
  const coef = math.zeros(Nx + 1, A).toArray();
  for (let j = 0; j < A; j++) {
    const Wj = W.slice(0, j + 1);
    const Qj = Q.slice(0, j + 1);
    const Bj = math.multiply(Wj, Qj);
    const C = math.dotDivide(math.dotMultiply(ypara2, Bj), xpara2);
    coef[j] = [...C, ypara1 - math.dotMultiply(xpara1, C)];
  }
  return coef;
}

function calculateMetrics(X, y, coef, Mx) {
  const xExpand = X.map((row) => [...row, 1]);
  const ypred = math.multiply(xExpand, coef[coef.length - 1]);
  const error = math.subtract(ypred, y);

  const yMean = math.mean(y);
  const SST = math.sum(math.dotPow(math.subtract(y, yMean), 2));
  const SSR = math.sum(math.dotPow(math.subtract(ypred, yMean), 2));
  const SSE = math.sum(math.dotPow(error, 2));

  const R2 = 1 - SSE / SST;
  const RMSEF = Math.sqrt(SSE / Mx);

  return { ypred, error, SST, SSR, SSE, R2, RMSEF };
}

module.exports = { pls };
