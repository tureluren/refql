import { flEmpty, flEquals, refqlType } from "../common/consts";
import { Output, Params, Selectable } from "../common/types";
import validateTable from "../common/validateTable";
import Prop from "../Prop";
import PropType from "../Prop/PropType";
import RefProp from "../Prop/RefProp";
import { createRQLTag, isRQLTag, RQLTag } from "../RQLTag";
import RefNode from "../RQLTag/RefNode";
import RQLNode, { isRQLNode } from "../RQLTag/RQLNode";
import When from "../RQLTag/When";
import { isSQLTag } from "../SQLTag";

interface Table<TableId extends string = any, Props = any> {
  <Components extends Selectable<Props>[]>(components: Components): RQLTag<TableId, Params<Props, Components>, { [K in Output<Props, Components>[number] as K["as"]]: K["type"] }[]>;
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

function Table<TableId extends string, Props extends PropType<any>[]>(name: TableId, props: Props) {
  validateTable (name);

  if (props != null && !Array.isArray (props)) {
    throw new Error ("Invalid props: not an Array");
  }

  let properties = props.reduce (
    (acc, prop) => ({ ...acc, [prop.as]: prop }),
    {} as { [P in Props[number] as P["as"] ]: P }
  );

  const table = (components => {
    if (!Array.isArray (components)) {
      // empty array is allowed because `select from player` is valid SQL
      throw new Error ("Invalid components: not an Array");
    }

    const nodes: RQLNode[] = [];

    for (const comp of components) {
      if (comp === "*") {
        const fieldProps = Object.entries (properties)
          .map (([, prop]) => prop as Prop)
          .filter (prop => Prop.isProp (prop) && !isSQLTag (prop.col));

        nodes.push (...fieldProps);

      } else if (typeof comp === "string" && properties[comp]) {
        const prop = properties[comp] as Prop;
        nodes.push (prop);
      } else if (Prop.isProp (comp) && properties[comp.as as keyof typeof properties]) {
        nodes.push (comp);
      } else if (isRQLTag (comp)) {
        const refNodes = Object.keys (properties)
          .map (key => properties[key as keyof typeof properties])
          .filter (prop => RefProp.isRefProp (prop) && comp.table.equals (prop.child))
          .map ((refProp => RefNode (createRQLTag (comp.table, comp.nodes), refProp as any, table as any)));

        if (!refNodes.length) {
          throw new Error (
            `${table.tableId} has no ref defined for: ${comp.table.tableId}`
          );
        }

        nodes.push (...refNodes);
      } else if (When.isWhen (comp)) {
        nodes.push (...comp.components);
      } else if (isRQLNode (comp)) {
        nodes.push (comp);
      } else {
        throw new Error (`Unknown Selectable Type: "${String (comp)}"`);
      }
    }

    return createRQLTag (table, nodes);
  }) as Table<TableId, typeof properties>;

  Object.setPrototypeOf (table, prototype);

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

function empty<Name extends string, S>(this: Table<Name, S>) {
  return this ([]);
}

Table.isTable = function<Name extends string, S> (x: any): x is Table<Name, S> {
  return x != null && x[refqlType] === type;
};

export default Table;