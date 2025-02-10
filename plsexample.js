const { PLS } = require("ml-pls");
const { Matrix } = require("ml-matrix");
const Y = require("./YMatrix.js").Y;

const trainPLS = (X) => {
  let XAdjusted = X;
  let YAdjusted = Y;

  const minLength = Math.min(XAdjusted.length, YAdjusted.length);

  XAdjusted = XAdjusted?.slice(0, minLength);
  YAdjusted = YAdjusted?.slice(0, minLength);

  const XMatrix = new Matrix(XAdjusted);
  const YMatrix = new Matrix(YAdjusted);

  const pls = new PLS({ nComponents: 2 });
  pls.train(XMatrix, YMatrix);

  const previsao = pls.predict(XMatrix);
  console.log(JSON.stringify(previsao.to2DArray()));
};

module.exports = { trainPLS };
