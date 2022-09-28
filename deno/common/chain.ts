const chain = <A, B, R>(g: (r: R) => A, f: (a: A) => (r: R) => B) => (x: R) =>
  f (g (x)) (x);

export default chain;