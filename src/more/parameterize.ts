const parameterize = (keyIdx: number, n: number, init: string) => {
  let params = init;

  for (let idx = 0; idx < n; idx++) {
    const pre = idx === 0 ? "" : ",";
    params += pre + "$" + (keyIdx + idx + 1);
  }

  return params;
};

export default parameterize;