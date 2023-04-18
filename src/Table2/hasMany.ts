import TableField from "./TableField";

export const hasMany = < As extends string, Name extends string>(as: As, table: Name) =>
  TableField<As, Name, "HasMany"> (as, table, "HasMany", "" as any, {} as any);

export default hasMany;