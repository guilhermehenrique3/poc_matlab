const { pretrat } = require("./pretrat.js");

function caltest(X, y, ncal, alg, rep, method) {
  method = method || ["none"];
  rep = rep || 0;
  alg = alg || "k";
  ncal = ncal || 70;

  if (!Array.isArray(y) || y?.length !== X?.length) {
    y = new Array(X?.length).fill(1);
    rep = 0;
  }

  const X2 = pretrat(X, method);
  let y2 = handleReplicates(X2, y, rep);

  let ncalSamples;
  if (alg === "s") {
    ncalSamples = ncal;
  } else {
    ncalSamples = Math.round((ncal * y2.medioX.length) / 100);
  }

  let objetos2;
  switch (alg) {
    case "k":
      objetos2 = kenston(y2.medioX, ncalSamples, 1, 0, y2.medioy);
      objetos2.sort((a, b) => a - b);
      break;
    case "d":
      const k = y2.medioy.length - ncalSamples;
      objetos2 = duplex(y2.medioX, k);
      objetos2.sort((a, b) => a - b);
      break;
    case "s":
      objetos2 = segmented(ncal, y2.medioX.length);
      break;
  }

  let objetos3 = [];
  if (rep !== 0 && y2.samples) {
    objetos2.forEach((index) => {
      const { start, end } = y2.samples[index];
      for (let i = start; i <= end; i++) objetos3.push(i);
    });
  } else {
    objetos3 = [...objetos2];
  }

  const teste2 = Array.from({ length: X.length }, (_, i) => i).filter(
    (i) => !objetos3.includes(i)
  );

  return {
    objetos: { cal: objetos3, test: teste2 },
    Xcal: objetos3.map((i) => X[i]),
    Xtest: teste2.map((i) => X[i]),
    ycal: objetos3.map((i) => y[i]),
    ytest: teste2.map((i) => y[i]),
  };
}

function handleReplicates(X, y, rep) {
  if (!rep) return { medioX: X, medioy: y };

  const samples = [];
  let current = { start: 0, values: [y[0]] };
  for (let i = 1; i < y.length; i++) {
    if (y[i] !== y[i - 1]) {
      samples.push({ ...current, end: i - 1 });
      current = { start: i, values: [y[i]] };
    } else {
      current.values.push(y[i]);
    }
  }
  samples.push({ ...current, end: y.length - 1 });

  const medioX = samples.map(({ start, end }) =>
    X.slice(start, end + 1)
      .reduce(
        (sum, row) => row.map((val, i) => val + sum[i]),
        new Array(X[0].length).fill(0)
      )
      .map((val) => val / (end - start + 1))
  );

  return {
    samples,
    medioX,
    medioy: samples.map((s) => s.values[0]),
  };
}

function kenston(X, no_p, men) {
  const n = X.length;
  const m = X[0].length;
  const meant = X[0].map((_, i) => X.reduce((sum, row) => sum + row[i], 0) / n);

  let distances = X.map((row) =>
    row.reduce((sum, val, i) => sum + Math.pow(val - meant[i], 2), 0)
  );
  let selected = [
    men === 1
      ? distances.indexOf(Math.min(...distances))
      : distances.indexOf(Math.max(...distances)),
  ];

  distances = X.map((row) =>
    row.reduce((sum, val, i) => sum + Math.pow(val - X[selected[0]][i], 2), 0)
  );
  selected.push(distances.indexOf(Math.max(...distances)));

  while (selected.length < no_p) {
    let maxMinDist = -Infinity;
    let bestIdx = -1;
    for (let i = 0; i < n; i++) {
      if (selected.includes(i)) continue;
      let minDist = Infinity;
      for (const s of selected) {
        const dist = X[i].reduce((sum, val, j) => sum + Math.pow(val - X[s][j], 2), 0);
        if (dist < minDist) minDist = dist;
      }
      if (minDist > maxMinDist) {
        maxMinDist = minDist;
        bestIdx = i;
      }
    }
    selected.push(bestIdx);
  }
  return selected;
}

function duplex(X, k) {
  const n = X.length;
  let model = [];
  let test = [];
  let remaining = Array.from({ length: n }, (_, i) => i);

  const farthestPair = (arr) => {
    let maxDist = -Infinity;
    let pair = [0, 1];
    for (let i = 0; i < arr.length; i++) {
      for (let j = i + 1; j < arr.length; j++) {
        const dist = X[arr[i]].reduce(
          (sum, val, idx) => sum + Math.pow(val - X[arr[j]][idx], 2),
          0
        );
        if (dist > maxDist) {
          maxDist = dist;
          pair = [arr[i], arr[j]];
        }
      }
    }
    return pair;
  };

  let pair = farthestPair(remaining);
  model.push(...pair);
  remaining = remaining.filter((i) => !pair.includes(i));
  pair = farthestPair(remaining);
  test.push(...pair);
  remaining = remaining.filter((i) => !pair.includes(i));

  while (model.length < k && remaining.length > 0) {
    let maxDist = -Infinity;
    let bestIdx = -1;
    remaining.forEach((i) => {
      let minDist = Infinity;
      model.forEach((m) => {
        const dist = X[i].reduce((sum, val, j) => sum + Math.pow(val - X[m][j], 2), 0);
        if (dist < minDist) minDist = dist;
      });
      if (minDist > maxDist) {
        maxDist = minDist;
        bestIdx = i;
      }
    });
    model.push(bestIdx);
    remaining = remaining.filter((i) => i !== bestIdx);
  }

  return model;
}

module.exports = { caltest };
