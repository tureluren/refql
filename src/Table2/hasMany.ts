import TableField from "./TableField";

export const hasMany = <Name extends string, As extends string>(table: Name, as: As) =>
  TableField<"HasMany", Name, As> ("HasMany", table, as, "" as any, {} as any);

export default hasMany;