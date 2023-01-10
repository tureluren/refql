import { flEmpty, flEquals, refqlType } from "../common/consts.ts";
import { Querier, RefMakerPair, RQLTagVariable } from "../common/types.ts";
import validateTable from "../common/validateTable.ts";
import RQLTag from "../RQLTag/index.ts";
import Parser from "../RQLTag/Parser.ts";

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

function Table(name: string, refs: RefMakerPair[] = []) {
  validateTable (name);

  if (!Array.isArray (refs)) {
    throw new Error ("Invalid refs: not an Array");
  }

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
  table.refs = refs;

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

Table.isTable = function (x: any): x is Table {
  return x != null && x[refqlType] === type;
};

export default Table;