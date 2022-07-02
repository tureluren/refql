const arrayToParams = (keyIdx: number, arr: any[], init: string) => {
  return arr.reduce ((acc: string, _item: any, idx: number) => {
    const pre = idx === 0 ? "" : ",";
    return acc + pre + "$" + (keyIdx + idx + 1);
  }, init);
};

export default arrayToParams;