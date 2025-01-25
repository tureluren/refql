const copyObj = <T>(obj: T): T => {
  const copy = Object.create (Object.getPrototypeOf (obj));

  Object.assign (copy, obj);

  return copy as T;
};

export default copyObj;