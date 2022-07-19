const concat = <T>(obj1: T, obj2: T) => {
  const result = {} as T;
  (Object.keys (obj2) as Array<keyof T>).forEach (k => { result[k] = obj2[k]; });
  (Object.keys (obj1) as Array<keyof T>).forEach (k => { result[k] = obj1[k]; });
  return result;
};

export default concat;