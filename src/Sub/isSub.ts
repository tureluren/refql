import Sub from ".";

const isSub = (value: any): value is Sub =>
  value instanceof Sub;

export default isSub;