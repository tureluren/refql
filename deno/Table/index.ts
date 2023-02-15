import { Boxes } from "../common/BoxRegistry.ts";
import { flEmpty, flEquals, refqlType } from "../common/consts.ts";
import { ConvertPromise, Querier, Ref, RQLTagMaker, RQLTagVariable, Runnable } from "../common/types.ts";
import validateTable from "../common/validateTable.ts";
import RQLTag from "../RQLTag/index.ts";
import Parser from "../RQLTag/Parser.ts";

interface Table<Box extends Boxes = "Promise"> {
  name: string;
  schema?: string;
  refs: Ref<Box>[];
  empty<Params, Output>(): RQLTag<Params, Output, Box> & Runnable<Params, ReturnType<ConvertPromise<Box, Output>>>;
  [flEmpty]: Table<Box>["empty"];
  equals<Box2 extends Boxes>(other: Table<Box2>): boolean;
  [flEquals]: Table<Box>["equals"];
  toString(): string;
}

const type = "refql/Table";

const prototype = Object.assign (Object.create (Function.prototype), {
  constructor: Table,
  [refqlType]: type,
  equals, [flEquals]: equals,
  empty, [flEmpty]: empty,
  toString
});

function Table<Box extends Boxes = "Promise">(name: string, refs: Ref<Box>[] = [], defaultQuerier?: Querier, convertPromise?: ConvertPromise<Boxes>) {
  validateTable (name);

  if (!Array.isArray (refs)) {
    throw new Error ("Invalid refs: not an Array");
  }

  const table = (<Params = unknown, Output = unknown>(strings: TemplateStringsArray, ...variables: RQLTagVariable<Params, Output, Box>[]) => {
    const parser = new Parser<Params, Output, Box> (strings.join ("$"), variables, table);

    return RQLTag (table, parser.nodes (), defaultQuerier, convertPromise as ConvertPromise<Box, Output>);
  }) as Table<Box> & RQLTagMaker<Box>;

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

function toString<Box extends Boxes>(this: Table<Box>) {
  return `${this.schema ? `${this.schema}.` : ""}${this.name}`;
}

function equals<Box extends Boxes>(this: Table<Box>, other: Table<Box>) {
  if (!Table.isTable (other)) return false;

  return (
    this.name === other.name &&
    this.schema === other.schema
  );
}

function empty<Box extends Boxes>(this: Table<Box> & RQLTagMaker<Box>) {
  return this``;
}

Table.isTable = function<Box extends Boxes> (x: any): x is Table<Box> {
  return x != null && x[refqlType] === type;
};

export default Table;