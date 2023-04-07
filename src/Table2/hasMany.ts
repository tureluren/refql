import TableField from "./TableField";

export const hasMany = <Name extends string>(table: Name) => <As extends string>(as: As) =>
  TableField<"HasMany", Name, As> ("HasMany", table, as);

export default hasMany;