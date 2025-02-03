import * as preprocessMethods from "./preprocess.js";

export function pretrat(X, Xt, method) {
  let Xprocessed = X.map((row) => [...row]);
  let Xtprocessed = Xt ? Xt.map((row) => [...row]) : null;

  method.forEach((currentMethod, index) => {
    const params = Array.isArray(currentMethod) ? currentMethod : [currentMethod];
    const methodName = params[0];
    const args = params.slice(1);

    if (typeof preprocessMethods[methodName] === "function") {
      const result = preprocessMethods[methodName](Xprocessed, Xtprocessed, ...args);
      Xprocessed = result.X;
      Xtprocessed = result.Xt;
    }
  });

  return {
    Xp: Xprocessed,
    Xtp: Xtprocessed || Xprocessed,
  };
}
