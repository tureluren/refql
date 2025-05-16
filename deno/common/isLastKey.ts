const isLastKey = (obj: object, key: string) =>
  key === Object.keys (obj).pop ();

export default isLastKey;