const math = require("mathjs");

function fmerito(modelo, ycal, yprev = null) {
  const x = modelo.datap.cal;
  const y = ycal;
  const b = modelo.coef.B;
  const T = modelo.coef.T;
  const P = modelo.coef.P;

  const { Rc, mx } = center(x, 1);
  const { cc, my } = center(y, 1);
  const cest = math.multiply(Rc, b);
  const nnas_c = math.divide(cest, math.norm(b));

  const Z = math.concat(math.ones([x.length, 1]), nnas_c, 1);
  const ccc = math.add(cc, math.multiply(math.ones([x.length, 1]), my));
  const cte = math.multiply(math.pinv(Z), ccc);
  const constante = -cte[0] / cte[1];
  const nnas_cm = math.subtract(nnas_c, constante);

  const H = math.divide(b, math.norm(b));
  const sen = 1 / math.norm(b);

  const sel = nnas_cm.map((val, i) => val / math.norm(x[i]));
  const nas_c = math.multiply(nnas_cm, math.norm(b), math.pinv(b));

  const s = nnas_c.map((val, i) => val / cest[i]);

  let saida = {
    nas: nas_c,
    nnas: nnas_cm,
    corre_H: H,
    seletividade: sel,
    sensibilidade: sen,
    sen_analitica: [],
    inv_sen_analitica: [],
  };

  const xp = math.multiply(T, math.transpose(P));
  const xpm = math.add(xp, math.multiply(math.ones([x.length, 1]), mx));
  const er = math.subtract(x, xpm);
  const vva = math.mean(math.variance(er));
  const dx = Math.sqrt(vva);

  saida.sen_analitica = sen / dx;
  saida.inv_sen_analitica = 1 / saida.sen_analitica;
  saida.ruido_espectral = dx;
  saida.sinal_ruido = math.divide(saida.nnas, dx);
  saida.LD = 3 * dx * (1 / sen);
  saida.LQ = 10 * dx * (1 / sen);

  saida.RPD = math.std(modelo.yp) / modelo.RMSEP;
  saida.RPIQ = math.iqr(modelo.yp) / modelo.RMSEP;

  const ajuste = math.polyfit(modelo.yc, ycal, 1);
  saida.ajuste = {
    intercepto: ajuste[1],
    inclinacao: ajuste[0],
    Q2: Math.pow(math.corrcoef(modelo.yc, ycal)[0][1], 2),
  };

  let yc_nas = math.multiply(saida.nas, modelo.coef.B);
  yc_nas = math.add(yc_nas, math.mean(ycal));
  const ajuste_nas = math.polyfit(yc_nas, ycal, 1);
  saida.ajuste_nas = {
    intercepto: ajuste_nas[1],
    inclinacao: ajuste_nas[0],
    Q2: Math.pow(math.corrcoef(yc_nas, ycal)[0][1], 2),
  };

  if (yprev) {
    const { Rp, mx } = center(modelo.datap.prev, 1);
    const { cpp, my } = center(yprev, 1);
    const cest = math.multiply(Rp, b);
    const nnas_p = math.divide(cest, math.norm(b));

    const Zp = math.concat(math.ones([Rp.length, 1]), nnas_p, 1);
    const cccp = math.add(cpp, math.multiply(math.ones([Rp.length, 1]), my));
    const cte = math.multiply(math.pinv(Zp), cccp);
    const constante = -cte[0] / cte[1];
    const nnas_pm = math.subtract(nnas_p, constante);

    saida.nas_p = math.multiply(nnas_pm, math.norm(b), math.pinv(b));
    saida.nnas_p = nnas_pm;
  }

  return saida;
}

module.exports = { fmerito };
