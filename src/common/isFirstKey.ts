const isFirstKey = <T extends Record<string, unknown>>(obj: T, key: keyof T & string): boolean => {
  const nonNullKeys = Object.keys (obj).filter (k => obj[k as keyof T] !== undefined).sort ();
  return key === nonNullKeys[0];
};

export default isFirstKey;