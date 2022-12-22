import { flEmpty, flEquals, refqlType } from "../common/consts";
import { Querier, RefMakerPair, RQLTagVariable } from "../common/types";
import RQLTag from "../RQLTag";
import Parser from "../RQLTag/Parser";

interface Table {
  <Params>(strings: TemplateStringsArray, ...variables: RQLTagVariable<Params>[]): RQLTag<Params>;
  name: string;
  schema?: string;
  refs: RefMakerPair[];
  equals(other: Table): boolean;
  empty<Params>(): RQLTag<Params>;
  toString(): string;
  run<Return>(querier: Querier): Promise<Return[]>;
  [flEmpty]: Table["empty"];
  [flEquals]: Table["equals"];
}

const type = "refql/Table";

const prototype = Object.assign (Object.create (Function.prototype), {
  constructor: Table,
  [refqlType]: type,
  equals, [flEquals]: equals,
  empty, [flEmpty]: empty,
  toString,
  run
});

function Table(name: string, refs?: RefMakerPair[]) {
  const table = (<Params>(strings: TemplateStringsArray, ...variables: RQLTagVariable<Params>[]) => {
    const parser = new Parser (strings.join ("$"), variables, table);

    return RQLTag<Params> (table, parser.nodes ());
  }) as Table;

  Object.setPrototypeOf (table, prototype);

  const [tableName, schema] = name.trim ().split (".").reverse ();

  Object.defineProperty (table, "name", {
    value: tableName,
    writable: false,
    enumerable: true
  });

  table.schema = schema;
  table.refs = refs || [];

  return table;
}

function empty(this: Table) {
  return this``;
}

function run(this: Table, querier: Querier) {
  return this.empty ().run (querier);
}

function toString(this: Table) {
  return `${this.schema ? `${this.schema}.` : ""}${this.name}`;
}

function equals(this: Table, other: Table) {
  if (!Table.isTable (other)) return false;

  return (
    this.name === other.name &&
    this.schema === other.schema
  );
}

Table.isTable = function (value: any): value is Table {
  return value != null && value[refqlType] === type;
};

export default Table;