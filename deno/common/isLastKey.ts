const isLastKey = (obj: object, key: string) =>
  key === Object.keys (obj).sort ().pop ();

export default isLastKey;