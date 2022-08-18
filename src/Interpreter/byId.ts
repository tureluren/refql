import over from "../Environment2/over";
import Table from "../Table";

const byId = (table: Table, id?: string | number, op: "where" | "and" = "and") =>
  over ("query", q => {
    if (id != null) {
      return `${q} ${op} ${table.as}.id = ${id}`;
    }
    return q;
  });

export default byId;