import { refqlType } from "../common/consts";
import { RefQLValue, StringMap } from "../common/types";
import Parser from "../Parser";
import RQLTag from "../RQLTag";

interface Table {
  (strings: TemplateStringsArray, ...values: RefQLValue<any>[]): any;
  tableName: string;
  // ?
  as: string;
  schema?: string;
  refs: StringMap;
  compile(alias?: boolean): [string, any[]];
  toString(): string;
}

const tableType = "refql/Table";

const prototype = {
  constructor: Table,
  [refqlType]: tableType,
  compile, toString
};


function Table(name: string, refsF?: () => StringMap) {

  const table = (<Params>(strings: TemplateStringsArray, ...values: RefQLValue<Params>[]) => {
    const parser = new Parser (strings.join ("$"), values);

    return RQLTag<Params> (parser.Root ());
  }) as Table;

  Object.setPrototypeOf (table, Object.assign (Object.create (Function.prototype), prototype));

  const [tableName, schema] = name.trim ().split (".").reverse ();

  table.tableName = tableName;
  table.as = tableName;
  // table.as = as || name;
  table.schema = schema;
  table.refs = refsF ? refsF () : {};

  return table;
}

// ?
function compile(this: Table, alias: boolean = false) {
  return [`${this.schema ? `${this.schema}.` : ""}${this.name}${alias ? ` ${this.as}` : ""}`];
}

function toString(this: Table) {
  return `Table (${this.name}, ${this.as}, ${this.schema})`;
}

Table.isTable = function (value: any): value is Table {
  return value != null && value[refqlType] === tableType;
};

export default Table;