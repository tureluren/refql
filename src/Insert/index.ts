import { refqlType } from "../common/consts";
import { StringMap } from "../common/types";
import Table from "../Table";

interface Insert {
  table: Table;
  columns: string[];
  data: StringMap[];
  compile(paramIdx?: number): [string, any[]];
}

const insertType = "refql/Insert";

const prototype = {
  constructor: Insert,
  [refqlType]: insertType,
  compile, toString
};

function Insert(table: Table, columns?: string[], data?: StringMap[]) {
  let insert: Insert = Object.create (prototype);
  insert.table = table;
  insert.columns = columns || [];
  insert.data = data || [];

  return insert;
}

function compile(this: Insert, paramIdx = 0) {
  const values: any[] = [];

  const valuesStr = this.data
    .map (item =>
      `(${this.columns.map (c => { values.push (item[c]); return `$${values.length + paramIdx}`; }).join (", ")})`)
    .join (", ");

  const insertStr = `insert into ${this.table.compile ()[0]} (${this.columns.join (", ")}) values ${valuesStr}`;

  return [insertStr, values];
}

Insert.isInsert = function (value: any): value is Insert {
  return value != null && value[refqlType] === insertType;
};

export default Insert;