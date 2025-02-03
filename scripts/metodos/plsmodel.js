import { pretrat, pretreat } from "./preprocess.js";
import { plssim } from "./pls.js";
import { vipp } from "./stats.js";
import { confidenceInt, fmerito, repetibility } from "./validation.js";

class PLSModel {
  constructor(Xcal, ycal, Xprev, yprev, options = {}) {
    this.defaultOptions = {
      Xpretreat: ["msc"],
      vene: 5,
      alpha: 0.95,
      xaxis: [],
      vl: 10,
      precisao: null,
      graficos: true,
    };

    this.options = { ...this.defaultOptions, ...options };
    this.Xorigin = Xcal.map((row) => [...row]);
    this.initializeModel(Xcal, ycal, Xprev, yprev);
  }

  initializeModel(Xcal, ycal, Xprev, yprev) {
    const [XcalProc, XprevProc] = pretrat(Xcal, Xprev, this.options.Xpretreat);

    const {
      centered: XcalCentered,
      mean: Xmean,
      std: Xstd,
    } = pretreat(XcalProc, "center");
    const XprevCentered = pretreat(XprevProc, "center", Xmean, Xstd);

    const { centered: ycalCentered, mean: ymean, std: ystd } = pretreat(ycal, "center");
    const yprevCentered = yprev ? pretreat(yprev, "center", ymean, ystd) : null;

    const coef = plssim(XcalCentered, ycalCentered, this.options.vl);

    this.model = {
      X: { raw: Xcal, processed: XcalCentered },
      y: { raw: ycal, processed: ycalCentered },
      coef,
      metrics: this.calculateMetrics(XcalCentered, XprevCentered, ycal, yprev, coef),
    };

    if (this.options.graficos) this.generatePlots();
  }

  calculateMetrics(Xcal, Xprev, ycal, yprev, coef) {
    const yc = this.predict(Xcal, coef.B);
    const yp = yprev ? this.predict(Xprev, coef.B) : null;

    return {
      RMSE: {
        CAL: this.rmse(ycal, yc),
        ...(yprev && { PRED: this.rmse(yprev, yp) }),
      },
      R2: {
        CAL: this.rSquared(ycal, yc),
        ...(yprev && { PRED: this.rSquared(yprev, yp) }),
      },
      VIP: vipp(Xcal, ycal, coef.T, coef.R),
      Confidence: confidenceInt(this.model, this.options.alpha),
    };
  }

  predict(X, B) {
    return math.multiply(X, B);
  }

  rmse(actual, predicted) {
    return Math.sqrt(
      actual.reduce((sum, val, i) => sum + Math.pow(val - predicted[i], 2), 0) /
        actual.length
    );
  }

  rSquared(actual, predicted) {
    const ssRes = actual.reduce(
      (sum, val, i) => sum + Math.pow(val - predicted[i], 2),
      0
    );
    const ssTot = actual.reduce(
      (sum, val) => sum + Math.pow(val - math.mean(actual), 2),
      0
    );
    return 1 - ssRes / ssTot;
  }

  generatePlots() {
    return {
      calibrationPlot: this.getCalibrationPlotData(),
      residualPlot: this.getResidualPlotData(),
      coefficientsPlot: this.getCoefficientsPlotData(),
    };
  }
}

export default PLSModel;
