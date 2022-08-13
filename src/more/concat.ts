const concat = (semi1: any) => <T extends { concat: Function}>(semi2: T): T =>
  semi2.concat (semi1);

export default concat;