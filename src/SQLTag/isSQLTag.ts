import SQLTag from ".";

const isSQLTag = (value): value is SQLTag =>
  value instanceof SQLTag;

export default isSQLTag;