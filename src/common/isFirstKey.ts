const isFirstKey = <T extends Record<string, unknown>>(standardProps: { col: any; as: any}[]) => (obj: T, key: keyof T & string): boolean => {
  const nonNullKeys = Object.keys (obj).filter (k => {
    const standardProp = standardProps.find (sp => sp.as === k);
    return obj[k as keyof T] !== undefined && standardProp != null;
  }).sort ();
  return key === nonNullKeys[0];
};

export default isFirstKey;