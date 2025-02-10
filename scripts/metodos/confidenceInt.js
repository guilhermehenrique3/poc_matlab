const math = require("mathjs");

function confidenceInt(modelo, ycal, ytest, alpha = 0.95) {
  const RMSEC = Math.sqrt(
    math.sum(math.square(math.subtract(ycal, modelo.yc))) /
      (ycal.length - modelo.options.vl - 1)
  );

  const { scores, loads } = pca(modelo.datap.cal, modelo.options.vl);
  const Xcal = math.multiply(modelo.datap.cal, loads).slice(0, modelo.options.vl);
  const Xtest = math.multiply(modelo.datap.prev, loads).slice(0, modelo.options.vl);

  const { lev, lev_test } = leverageCalc(Xcal, Xtest);

  const t_stat = Math.abs(math.tInv((1 - alpha) / 2, ycal.length - 1));

  const conf = {
    cal: ycal.map((val, i) => [
      val,
      modelo.yc[i],
      t_stat * RMSEC * Math.sqrt(1 + lev[i]),
    ]),
    test: ytest.map((val, i) => [
      val,
      modelo.yp[i],
      t_stat * RMSEC * Math.sqrt(1 + lev_test[i]),
    ]),
    lev,
    lev_test,
  };

  return conf;
}

function pca(X, npc) {
  const [n, m] = [X.length, X[0].length];
  let cov, u, s, v;

  if (m < n) {
    cov = math.multiply(math.transpose(X), X);
    [u, s, v] = math.svd(cov);
  } else {
    cov = math.multiply(X, math.transpose(X));
    [u, s, v] = math.svd(cov);
    v = math.multiply(math.transpose(X), v);
    v = v.map((col) => math.divide(col, math.norm(col)));
  }

  const individualExpVar = math.multiply(math.diag(s), 100 / math.sum(math.diag(s)));
  const varexp = individualExpVar.map((val, i) => [
    i + 1,
    val,
    math.sum(individualExpVar.slice(0, i + 1)),
  ]);
  const loads = v.slice(0, npc);
  const scores = math.multiply(X, loads);

  return { scores, loads, varexp };
}

module.exports = { confidenceInt, pca };
