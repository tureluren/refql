const copyObj = (obj: any): any => {
  const copy = Object.create (Object.getPrototypeOf (obj));

  Object.assign (copy, obj);

  return copy;
};

export default copyObj;