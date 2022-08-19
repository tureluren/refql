const isArray = (value: any): value is any[] =>
  Array.isArray (value);

export default isArray;