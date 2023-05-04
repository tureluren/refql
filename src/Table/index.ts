import { flEmpty, flEquals, refqlType } from "../common/consts";
import { Querier } from "../common/types";
import { IsAllSignSelected, OnlyStringColProps, Output, Params, RQLNode, Selectable } from "../common/types2";
import validateTable from "../common/validateTable";
import { RefNode } from "../nodes";
import { createRQLTag, isRQLTag, RQLTag } from "../RQLTag";
import { isSQLTag } from "../SQLTag";
import Prop from "./Prop";
import RefProp from "./RefProp";

interface Table<TableId extends string = any, Props = {}> {
  tableId: TableId;
  name: string;
  schema?: string;
  props: Props;
  empty<Params, Output>(): RQLTag<TableId, Params, Output>;
  [flEmpty]: Table<TableId, Props>["empty"];
  equals(other: Table<TableId, Props>): boolean;
  [flEquals]: Table<TableId, Props>["equals"];
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

function Table<TableId extends string = any, Props extends(Prop | RefProp)[] = []>(name: TableId, props: Props, defaultQuerier?: Querier) {
  validateTable (name);

  if (!Array.isArray (props)) {
    throw new Error ("Invalid props: not an Array");
  }

  let properties = props.reduce (
    (acc, prop) => ({ ...acc, [prop.as]: prop }),
    {} as { [P in Props[number] as P["as"] ]: P }
  );

  const run = (<Components extends Selectable<typeof properties>[]>(components: Components) => {
    type FinalComponents = IsAllSignSelected<typeof properties, Components> extends true
      ? [keyof OnlyStringColProps<typeof properties>, ...Components]
      : Components;

    const nodes: RQLNode[] = [];

    for (const comp of components) {
      if (comp === "*") {
        const fieldProps = Object.entries (properties)
          .map (([, prop]) => prop as Prop)
          .filter (prop => Prop.isProp (prop) && !isSQLTag (prop.col));

        nodes.push (...fieldProps);

      } if (typeof comp === "string" && properties[comp]) {
        const prop = properties[comp] as Prop;
        nodes.push (prop);
      } else if (Prop.isProp (comp) && properties[comp.as as keyof typeof properties]) {
        nodes.push (comp);
      } else if (isSQLTag (comp)) {
        nodes.push (comp);
      } else if (isRQLTag (comp)) {
        nodes.push (RefNode (comp, run as unknown as Table));
      }
    }

    return createRQLTag<TableId, Params<Components, typeof properties>, { [K in Output<FinalComponents, typeof properties>[number] as K["as"]]: K["type"] }[]> (table as unknown as Table<TableId, typeof properties>, nodes, defaultQuerier);
  });

  Object.setPrototypeOf (run, prototype);

  let table = run as unknown as Table<TableId, typeof properties> & typeof run;

  const [tableName, schema] = name.trim ().split (".").reverse ();

  Object.defineProperty (table, "name", {
    value: tableName,
    writable: false,
    enumerable: true
  });

  table.tableId = name;
  table.schema = schema;
  table.props = properties;

  return table;
}

function toString<Name extends string, S>(this: Table<Name, S>) {
  return `${this.schema ? `${this.schema}.` : ""}${this.name}`;
}

function equals<Name extends string, S>(this: Table<Name, S>, other: Table<Name, S>) {
  if (!Table.isTable (other)) return false;

  return (
    this.name === other.name &&
    this.schema === other.schema
  );
}

// Revisit
function empty<Name extends string, S>(this: Table<Name, S>) {
  // return this``;
}

Table.isTable = function<Name extends string, S> (x: any): x is Table<Name, S> {
  return x != null && x[refqlType] === type;
};

export default Table;