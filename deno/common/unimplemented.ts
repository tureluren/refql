const unimplemented = (by: string) => (type: string) => () => {
  throw new Error (`Unimplemented by ${by}: ${type}`);
};

export default unimplemented;