import { savgol } from "./savitzkyGolay.js";
import { emscorr, stdfir, osccalc, oscapp } from "./advancedPreprocessing.js";

export function center(X, Xt) {
  const meanX = math.mean(X, 0);
  return {
    X: math.subtract(X, meanX),
    Xt: Xt ? math.subtract(Xt, meanX) : null,
  };
}

export function auto(X, Xt) {
  const meanX = math.mean(X, 0);
  const stdX = math.std(X, 0);
  return {
    X: math.divide(math.subtract(X, meanX), stdX),
    Xt: Xt ? math.divide(math.subtract(Xt, meanX), stdX) : null,
  };
}

export function snv(X, Xt) {
  const process = (data) => {
    const rowMeans = math.mean(data, 1);
    const rowStd = math.std(data, 1);
    return math.divide(math.subtract(data, rowMeans), rowStd);
  };

  return {
    X: process(X),
    Xt: Xt ? process(Xt) : null,
  };
}

export function msc(X, Xt) {
  const meanX = math.mean(X, 0);
  const fitLine = (row) => {
    const coef = math.polynomialFit(meanX, row, 1);
    return math.divide(math.subtract(row, coef[0]), coef[1]);
  };

  return {
    X: X.map((row) => fitLine(row)),
    Xt: Xt ? Xt.map((row) => fitLine(row)) : null,
  };
}

// Implementar demais métodos (pareto, minmax, derivada, etc.) de forma similar
