import TableField from "./TableField";

export const belongsTo = <Name extends string>(table: Name) => <As extends string>(as: As) =>
  TableField<"BelongsTo", Name, As> ("BelongsTo", table, as);

export default belongsTo;