import { Boxes } from "../common/BoxRegistry";
import { flEmpty, flEquals, refqlType } from "../common/consts";
import { ConvertPromise, Querier, Ref, RQLTagMaker, RQLTagVariable, Runnable } from "../common/types";
import validateTable from "../common/validateTable";
import RQLTag from "../RQLTag";
import Parser from "../RQLTag/Parser";

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
    const parser = new Parser<Params, Output, Box> (strings.join ("$"), variables, table as unknown as Table<Box>);

    return RQLTag (table as unknown as Table<Box>, parser.nodes (), defaultQuerier, convertPromise as ConvertPromise<Box, Output>);
  });

  Object.setPrototypeOf (table, prototype);

  const [tableName, schema] = name.trim ().split (".").reverse ();

  Object.defineProperty (table, "name", {
    value: tableName,
    writable: false,
    enumerable: true
  });

  (table as unknown as Table<Box>).schema = schema;
  (table as unknown as Table<Box>).refs = refs;

  return table as Table<Box> & typeof table;
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