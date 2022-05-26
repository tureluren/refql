import SQLTag from ".";

const isSQLTag = (value: any): value is SQLTag =>
  value instanceof SQLTag;

export default isSQLTag;