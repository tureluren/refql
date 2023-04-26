import RefProp from "./RefProp";

export const hasMany = <As extends string, TableId extends string>(as: As, tableId: TableId) =>
  RefProp<As, TableId, "HasMany"> (as, tableId, "HasMany", "" as any, {} as any);

export default hasMany;