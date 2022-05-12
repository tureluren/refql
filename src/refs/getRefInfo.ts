/**
 * [CONSTRAINT fk_name]
 *   FOREIGN KEY(fk_columns)
 *   REFERENCES parent_table(parent_key_columns)
 *   [ON DELETE delete_action]
 *   [ON UPDATE update_action]
 *
 */

const match = (constraint: string) => (regExp: RegExp) => {
  const matched = regExp.exec (constraint);

  return (<NonNullable<string[]>>matched)[1];
};

const getRefInfo = (table: string, constraint: string) => {
  const tableFrom = table.replace (/"/g, "");
  const matchConstraint = match (constraint);

  const tableFromCols = matchConstraint (/FOREIGN KEY.+?\(([^)]+)\)/i)
    .split (",")
    .map (s => s.trim ());

  const tableTo = matchConstraint (/REFERENCES.+?([^]+)\(/i)
    .replace (/"/g, "");

  const tableToCols = matchConstraint (/REFERENCES.+?\(([^)]+)\)/i)
    .split (",")
    .map (s => s.trim ());

  return {
    tableFrom,
    tableTo,
    tableFromCols,
    tableToCols
  };
};

export default getRefInfo;