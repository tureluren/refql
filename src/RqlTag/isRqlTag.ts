import RqlTag from ".";

const isRqlTag = <Input>(value: any): value is RqlTag<Input> =>
  value instanceof RqlTag;

export default isRqlTag;