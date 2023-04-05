import TableField from "./TableField";

const tableF = <Name extends string>(col: Name) => <As extends string>(as: As) =>
  TableField<Name, As> (col, as);

export default tableF;