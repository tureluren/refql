import { flEmpty, flEquals, refqlType } from "../common/consts";
import { OnlyStringColProps, Output, Params, Querier, RQLNode, Selectable, TagFunctionVariable } from "../common/types";
import validateTable from "../common/validateTable";
import When from "../common/When";
import { createRQLTag, isRQLTag, RQLTag } from "../RQLTag";
import RefNode from "../RQLTag/RefNode";
import { isSQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import sql from "../SQLTag/sql";
import Eq from "./Eq";
import Prop from "./Prop";
import RefProp from "./RefProp";

interface Table<TableId extends string = any, Props = {}> {
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
  eq<P extends keyof OnlyStringColProps<Props>>(prop: P): <Params>(run: TagFunctionVariable<Params, OnlyStringColProps<Props>[P]["type"]> | OnlyStringColProps<Props>[P]["type"]) => Eq<Props, Params>;
}

const type = "refql/Table";

const prototype = Object.assign (Object.create (Function.prototype), {
  constructor: Table,
  [refqlType]: type,
  equals, [flEquals]: equals,
  empty, [flEmpty]: empty,
  toString,
  eq
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

  const table = (components => {

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
      } else if (isSQLTag (comp)) {
        nodes.push (comp);
      } else if (isRQLTag (comp)) {
        const refNodes = Object.keys (properties)
          .map (key => properties[key as keyof typeof properties])
          .filter (prop => RefProp.isRefProp (prop) && comp.table.equals (prop.child))
          .map (refProp => RefNode (createRQLTag (comp.table, comp.nodes), refProp, table as unknown as Table));

        if (!refNodes.length) {
          throw Error ("wrong");
        }

        nodes.push (...refNodes);
      } else if (When.isWhen (comp)) {
        nodes.push (comp);
      } else if (Eq.isEq (comp)) {
        nodes.push (sql`
          and ${Raw (`${table.name}.${comp.prop}`)} = ${comp.run}
        `);
      } else {
        throw new Error ("errorke");
      }
    }

    return createRQLTag (table, nodes, defaultQuerier);
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

function eq<Name extends string, S, P extends keyof OnlyStringColProps<S>>(this: Table<Name, S>, prop: P) {
  return <Params>(run: TagFunctionVariable<Params, OnlyStringColProps<S>[P]["type"]>) => {
    return Eq<S, Params, P> (prop, run);
  };
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