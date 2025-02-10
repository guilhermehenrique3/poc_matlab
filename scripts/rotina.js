const { caltest } = require("./metodos/caltest.js");
const { pretrat } = require("./metodos/pretrat.js");
const { plsmodel } = require("./metodos/plsmodel.js");
const { biasTest } = require("./metodos/biasTeste.js");

const dados = { x: [0.00016, 0.00016, 0.00016], y: [0.00016, 0.00016, 0.00016] };
// a matriz de X e o processamento das amostras. ja o Y seria o arquivo que eles mandaram

let X = dados.x;
let y = dados.y;
let prop = ["D"];
let metodo = ["snv"];
let X2 = X;

let { objetos, Xcal, Xtest, ycal, ytest } = caltest(X, y, 70);

console.log("call", objetos, Xcal, Xtest, ycal, ytest);

let [Xcal2, Xtest2] = pretrat(Xcal, Xtest, ["snv"]);

let resultados = [];

for (let i = 1; i <= 16; i++) {
  let options = {
    vl: i,
    Xpretreat: ["center"],
    vene: 5,
    alpha: 0.95,
    xaxis: [],
    precisao: [],
    graficos: 1,
  };

  let modelocv = plsmodel(Xcal2, ycal, options);
  let modelo = plsmodel(Xcal2, ycal, Xtest2, ytest, options);

  let RMSEC = modelo.RMSEC;
  let RMSECV = modelo.RMSECV;
  let RMSEP = modelo.RMSEP;
  let R2c = modelo.R2c;
  let R2cv = modelo.R2cv;
  let R2p = modelo.R2p;
  let biasc = modelo.biasc;
  let biascv = modelo.biascv;
  let biasp = modelo.biasp;
  let LOQ = modelo.Fig_Merito.LQ;
  let LOD = modelo.Fig_Merito.LD;
  let ISA = modelo.Fig_Merito.inv_sen_analitiva;

  let teste = biasTest(ycal, modelo.yc, 0.05);
  let teste2 = biasTest(ytest, modelo.yp, 0.05);

  let cal = ycal.length;
  let test = ytest.length;
  let gl1 = cal - 1;
  let gl2 = test - 1;
  let pvalue_biasc = 1 - teste.bias / gl1;
  let pvalue_biasp = 1 - teste2.bias / gl2;

  resultados.push({
    prop,
    variaveis: options.xaxis.length,
    amostras: X2.length,
    Xcal: Xcal2.length,
    Xtest: Xtest2.length,
    VL: modelo.options.vl,
    metodo,
    RMSEC,
    RMSECV,
    RMSEP,
    R2c,
    R2cv,
    R2p,
    biasc,
    biascv,
    biasp,
    pvalue_biasc,
    pvalue_biasp,
    LOQ,
    LOD,
    ISA,
  });
}

let options = { vl: 9 };
let modeloFinal = plsmodel(Xcal2, ycal, Xtest2, ytest, options);

console.log("Processo concluído! Resultados:", resultados);
console.log("modeloFinal:", modeloFinal);
