import { flEmpty, flEquals, refqlType } from "../common/consts";
import { Querier } from "../common/types";
import { AllInComps, AllSign, CombinedParams, OnlyPropFields, Selectable, SelectedS } from "../common/types2";
import { ASTNode, Identifier, RefNode } from "../nodes";
import RefField from "../RefField";
import { createRQLTag, isRQLTag, RQLTag } from "../RQLTag";
import { isSQLTag, SQLTag } from "../SQLTag";
import Prop from "./Prop";
import RefProp from "./RefProp";

interface Table<Name extends string = any, Props = {}> {
  name: Name;
  schema?: string;
  props: Props;
  empty<Params, Output>(): RQLTag<Name, Params, Output>;
  [flEmpty]: Table<Name, Props>["empty"];
  equals(other: Table<Name, Props>): boolean;
  [flEquals]: Table<Name, Props>["equals"];
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

function Table<Name extends string = any, Props extends(Prop | RefProp)[] = []>(name: Name, props: Props, defaultQuerier?: Querier) {
  // validateTable (name);

  if (!Array.isArray (props)) {
    throw new Error ("Invalid props: not an Array");
  }

  let properties = props.reduce ((acc, prop) => {
    return {
      ...acc,
      [prop.as]: prop
    };
  }, {} as { [P in Props[number] as P["as"] ]: P });

  const table = (<Components extends Selectable<typeof properties>[]>(components: Components) => {
    type Compies = AllInComps<typeof properties, Components> extends true ? [keyof OnlyPropFields<typeof properties>, ...Components] : Components;

    const nodes: (Prop | RefProp | SQLTag | RefNode<any, any>)[] = [];

    for (const comp of components) {
      // and keys includes comp
      if (comp === "*") {
        const fieldProps = Object.keys (properties)
          .map ((prop: keyof typeof properties) => properties[prop] as Prop)
          .filter (prop => Prop.isProp (prop) && !isSQLTag (prop.col));
          console.log (fieldProps);

        nodes.push (...fieldProps);

      } if (typeof comp === "string" && properties[comp]) {
        const prop = properties[comp] as Prop;
        nodes.push (prop);
      } else if (Prop.isProp (comp) && properties[comp.as as keyof typeof properties]) {
        nodes.push (comp);
      } else if (isSQLTag (comp)) {
        nodes.push (comp);
      } else if (isRQLTag (comp)) {
        nodes.push (RefNode (comp, table as any));
      }
    }

    return createRQLTag<Name, CombinedParams<Components, typeof properties>, { [K in SelectedS<Compies, typeof properties>[number] as K["as"]]: K["type"] }[]> (table as unknown as Table<Name, typeof properties>, nodes, defaultQuerier);
  });

  Object.setPrototypeOf (table, prototype);

  const [tableId, schema] = name.trim ().split (".").reverse ();

  Object.defineProperty (table, "name", {
    value: tableId,
    writable: false,
    enumerable: true
  });


  (table as any).props = properties;
  (table as any).schema = schema;

  return table as unknown as Table<Name, { [K in keyof typeof properties]: typeof properties[K] }> & typeof table;
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