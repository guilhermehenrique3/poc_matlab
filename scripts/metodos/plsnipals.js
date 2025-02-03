import * as math from "mathjs";

export function plsNipals(Xs, ys, A) {
  const M = Xs.length;
  const N = Xs[0].length;

  const W = math.zeros(N, A);
  const T = math.zeros(M, A);
  const P = math.zeros(N, A);
  const Q = math.zeros(A, 1);
  const R2X = [];
  const R2Y = [];
  const Xr = math.clone(Xs);
  const Yr = math.clone(ys);

  for (let a = 0; a < A; a++) {
    let w = math.multiply(math.transpose(Xr), Yr);
    w = math.dotDivide(w, math.norm(w));

    const t = math.multiply(Xr, w);
    const tNorm = math.dotDivide(t, math.norm(t));

    const q = math.multiply(math.transpose(Yr), tNorm);
    const p = math.multiply(math.transpose(Xr), tNorm);

    W = math.subset(W, math.index(math.range(0, N), a), w);
    T = math.subset(T, math.index(math.range(0, M), a), t);
    P = math.subset(P, math.index(math.range(0, N), a), p);
    Q[a] = q;

    Xr = math.subtract(Xr, math.multiply(t, math.transpose(p)));
    Yr = math.subtract(Yr, math.multiply(t, q));

    R2X[a] = 1 - math.sum(math.dotPow(Xr, 2)) / math.sum(math.dotPow(Xs, 2));
    R2Y[a] = 1 - math.sum(math.dotPow(Yr, 2)) / math.sum(math.dotPow(ys, 2));
  }

  return { B: W, W, T, P, Q, R2X, R2Y, Xr, Yr };
}
