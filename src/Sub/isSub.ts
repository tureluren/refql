import Sub from ".";

const isSub = (value): value is Sub =>
  value instanceof Sub;

export default isSub;