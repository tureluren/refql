let convertPromise = <T>(p: Promise<T>) => p;

const setConvertPromise = (f: <T>(p: Promise<T>) => any) => {
  convertPromise = f;
};

export const getConvertPromise = () =>
  convertPromise;

export default setConvertPromise;