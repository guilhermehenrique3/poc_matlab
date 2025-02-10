const math = require("mathjs");

function repetibility(yrepe, yindice, alpha = 0.5) {
  // Ordena os índices e reorganiza yrepe
  const indicesSorted = yindice
    .map((val, i) => ({ val, i }))
    .sort((a, b) => a.val - b.val)
    .map((item) => item.i);

  yrepe = indicesSorted.map((i) => yrepe[i]);
  yindice = indicesSorted.map((i) => yindice[i]);

  const n_niveis = [...new Set(yindice)];
  let n_replicas = n_niveis.map((nivel) => [
    nivel,
    yindice.filter((y) => y === nivel).length,
  ]);

  let a1 = math.cumsum(n_replicas.map((n) => n[1]));
  let a2 = [1, ...a1.map((v) => v + 1)].slice(0, -1);
  let mat_replicas = a2.map((v, i) => [v, a1[i]]);

  let sample = [];
  let ri_logsig2 = [];
  let ri_sig2 = [];

  for (let ki = 0; ki < mat_replicas.length; ki++) {
    let vetor_r = math.range(mat_replicas[ki][0] - 1, mat_replicas[ki][1]).toArray();
    let vetor_sample = vetor_r.map((i) => yrepe[i]);
    let meanSample = math.mean(vetor_sample);
    let stdSample = math.std(vetor_sample);
    let varSample = Math.pow(stdSample, 2);

    sample.push([meanSample, stdSample, varSample]);
    ri_logsig2.push(vetor_r.length * Math.log10(varSample));
    ri_sig2.push(vetor_r.length * varSample);
  }

  let inv_r = n_replicas.map((n) => 1 / n[1]);
  let inv_rTotal = 1 / math.sum(n_replicas.map((n) => n[1]));
  let c = 1 + (1 / (3 * (n_replicas.length - 1))) * (math.sum(inv_r) - inv_rTotal);
  let repe = Math.sqrt((1 / yindice.length) * math.sum(ri_sig2));
  let X2 = (2.3026 / c) * (yindice.length * Math.log10(repe ** 2) - math.sum(ri_logsig2));

  let chi2_critico = math.chi2inv(1 - alpha, n_replicas.length - 1);
  let IC_repetibilidade;
  let Bartlett;

  if (X2 < chi2_critico) {
    Bartlett = "Variâncias Homogêneas";
    IC_repetibilidade =
      n_replicas.length * Math.sqrt(2) * math.mean(sample.map((s) => s[1]));
  } else {
    Bartlett = "Variâncias Heterogêneas";
    IC_repetibilidade =
      n_replicas.length * Math.sqrt(2) * math.max(sample.map((s) => s[1]));
  }

  return {
    replicas: n_replicas,
    samples: sample,
    repetibilidade: repe,
    alpha: alpha,
    CHI2: X2,
    X2critico: chi2_critico,
    Bartlett: Bartlett,
    IC_repetibilidade: IC_repetibilidade,
  };
}

module.exports = repetibility;
