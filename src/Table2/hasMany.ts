import TableField from "./TableField";

export const hasMany = <As extends string, TableId extends string>(as: As, tableId: TableId) =>
  TableField<As, TableId, "HasMany"> (as, tableId, "HasMany", "" as any, {} as any);

export default hasMany;