import SQLTag from ".";

const isSQLTag = <Input>(value: any): value is SQLTag<Input> =>
  value instanceof SQLTag;

export default isSQLTag;