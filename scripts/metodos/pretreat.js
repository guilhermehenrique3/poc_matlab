function mean(arr) {
  return arr.reduce((sum, val) => sum + val, 0) / arr.length;
}

function std(arr) {
  const m = mean(arr);
  const variance = arr.reduce((sum, val) => sum + (val - m) ** 2, 0) / (arr.length - 1);
  return Math.sqrt(variance);
}

function pretreat(X, method, para1, para2) {
  let XCopy = X.map((row) => [...row]);
  const Mx = XCopy.length;
  if (Mx === 0) return { X: XCopy, para1: para1, para2: para2 };
  const Nx = XCopy[0].length;

  if (typeof para1 === "undefined" && typeof para2 === "undefined") {
    para1 = [];
    para2 = [];

    for (let j = 0; j < Nx; j++) {
      const column = XCopy.map((row) => row[j]);
      let p1, p2;

      switch (method) {
        case "autoscaling":
          p1 = mean(column);
          p2 = std(column);
          break;
        case "center":
          p1 = mean(column);
          p2 = 1;
          break;
        case "minmax":
          p1 = Math.min(...column);
          p2 = Math.max(...column) - p1;
          break;
        case "pareto":
          p1 = mean(column);
          p2 = Math.sqrt(std(column));
          break;
        case "none":
          p1 = 0;
          p2 = 1;
          break;
        default:
          throw new Error("Wrong data pretreat method!");
      }

      para1.push(p1);
      para2.push(p2);
    }
  } else {
    if (para1.length !== Nx || para2.length !== Nx) {
      throw new Error("Parameters para1 and para2 must match columns in X");
    }
  }

  for (let i = 0; i < Mx; i++) {
    for (let j = 0; j < Nx; j++) {
      XCopy[i][j] = (XCopy[i][j] - para1[j]) / para2[j];
    }
  }

  return { X: XCopy, para1: para1, para2: para2 };
}

module.exports = {
  pretreat,
  mean,
  std,
};
