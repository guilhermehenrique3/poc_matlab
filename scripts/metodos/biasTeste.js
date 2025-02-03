import { tInv } from "./metodos/statistics.js";

export function biasTest(realValues, predictedValues, pValue = 0.05) {
  if (realValues.length !== predictedValues.length) {
    throw new Error(
      "Os vetores de valores reais e previstos devem ter o mesmo comprimento"
    );
  }

  const n = realValues.length;

  const bias =
    realValues.reduce((sum, real, i) => sum + (real - predictedValues[i]), 0) / n;

  const SVD = Math.sqrt(
    realValues.reduce((sum, real, i) => {
      const residual = real - predictedValues[i] - bias;
      return sum + residual * residual;
    }, 0) /
      (n - 1)
  );

  const tValue = (Math.abs(bias) * Math.sqrt(n)) / SVD;

  const tCritical = Math.abs(tInv(pValue / 2, n - 1));

  const significant = tValue > tCritical;
  const result = {
    bias,
    SVD,
    tValue,
    tCritical,
    significant,
    conclusion: significant
      ? "Os erros sistemáticos são significativos"
      : "Erros sistemáticos NÃO significativos",
  };

  console.log("\nResultados do Teste de Bias:");
  console.log(`Bias: ${bias.toFixed(4)}`);
  console.log(`Desvio Padrão dos Resíduos (SVD): ${SVD.toFixed(4)}`);
  console.log(`Valor t calculado: ${tValue.toFixed(4)}`);
  console.log(`Valor t crítico: ${tCritical.toFixed(4)}`);
  console.log(`Conclusão: ${result.conclusion}\n`);

  return result;
}
