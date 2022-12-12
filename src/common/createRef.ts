const createRef = (as: string) => (kw: string, ref: string) => ({
  name: ref.trim (),
  as: `${(as).replace (/_/g, "").toLowerCase ()}${kw}`
});

export default createRef;