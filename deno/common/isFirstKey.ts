const isFirstKey = (obj: object, key: string) =>
  key === Object.keys (obj).sort ()[0];

export default isFirstKey;