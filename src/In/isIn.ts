import In from ".";

const isIn = <T>(value: any): value is In<T> =>
  value instanceof In;

export default isIn;