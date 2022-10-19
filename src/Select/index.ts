import { refqlType } from "../common/consts";
import Table from "../Table";

interface Select {
  table: Table;
  columns: string[];
  compile(prefix?: boolean, distinct?: boolean): [string, any[]];
}

const selectType = "refql/Select";

const prototype = {
  constructor: Select,
  [refqlType]: selectType,
  compile, toString
};

function Select(table: Table | string, columns: string[] = []) {
  let select: Select = Object.create (prototype);
  select.table = typeof table === "string" ? Table (table) : table;
  select.columns = columns.length ? columns : ["*"];

  return select;
}

function compile(this: Select, prefix = true, distinct = false) {
  const str = (
    prefix
      ? this.columns.map (c => `${this.table.as}.${c}`)
      : this.columns
    ).join (", ");

  return [`select${distinct ? " distinct" : ""} ${str} from ${this.table.compile ()[0]}`, []];
}

Select.isSelect = function (value: any): value is Select {
  return value != null && value[refqlType] === selectType;
};

export default Select;