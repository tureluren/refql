const isArray = (value: any): value is Array<any> =>
  Array.isArray (value);

export default isArray;