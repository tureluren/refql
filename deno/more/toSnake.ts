const toSnake = (str: string) =>
  str
    .replace (/[\w]([A-Z])/g, c => c[0] + "_" + c[1])
    .toLowerCase ();

export default toSnake;