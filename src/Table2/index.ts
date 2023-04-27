import { Boxes } from "../common/BoxRegistry";
import { flEmpty, flEquals, refqlType } from "../common/consts";
import { ConvertPromise, Querier, RQLTagMaker } from "../common/types";
import { AllInComps, CombinedParams, Selectable, OnlyPropFields, SelectedS } from "../common/types2";
import { ASTNode, Identifier, RefNode } from "../nodes";
import { createRQLTag, isRQLTag, RQLTag } from "../RQLTag";
import Prop from "./Prop";
import RefProp from "./RefProp";

interface Table2<Name extends string = any, Props = {}> {
  name: Name;
  schema?: string;
  // refs: Ref<Box>[];
  props: Props;
  empty<Params, Output>(): RQLTag<Name, Params, Output>;
  [flEmpty]: Table2<Name, Props>["empty"];
  equals(other: Table2<Name, Props>): boolean;
  [flEquals]: Table2<Name, Props>["equals"];
  toString(): string;
}

const type = "refql/Table2";

const prototype = Object.assign (Object.create (Function.prototype), {
  constructor: Table2,
  [refqlType]: type,
  equals, [flEquals]: equals,
  empty, [flEmpty]: empty,
  toString
});

function Table2<Name extends string = any, Props extends(Prop | RefProp)[] = []>(name: Name, props: Props, defaultQuerier?: Querier) {
  // validateTable (name);

  if (!Array.isArray (props)) {
    throw new Error ("Invalid props: not an Array");
  }

  let properties = props.reduce ((acc, key) => {
    return {
      ...acc,
      [key.as]: props[key.as]
    };
  }, {} as { [P in Props[number] as P["as"] ]: P });


  const table = (<Components extends Selectable<typeof properties>[]>(components: Components) => {
    type Compies = AllInComps<typeof properties, Components> extends true ? [keyof OnlyPropFields<typeof properties>, ...Components] : Components;

    const nodes: ASTNode<{}, any, any>[] = [];

    for (const comp of components) {
      // and keys includes comp
      if (typeof comp === "string") {
        const id = (table as any).spec[comp] as Prop;
        nodes.push (Identifier (id.col || id.as, id.as));
      } else if (isRQLTag (comp)) {
        for (const specKey in (table as any).spec) {
          const sp = (table as any).spec[specKey];

          if (RefProp.isRefProp (sp) && sp.child.equals (comp.table)) {
            nodes.push (RefNode (sp.refInfo as any, comp, true));
          }
        }

      }
    }

    return createRQLTag<Name, CombinedParams<Components, typeof properties>, { [K in SelectedS<Compies, typeof properties>[number] as K["as"]]: K["type"] }[]> (table as unknown as Table2<Name, typeof properties>, nodes as any, defaultQuerier);
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

  return table as unknown as Table2<Name, { [K in keyof typeof properties]: typeof properties[K] }> & typeof table;
}

function toString<Name extends string, S>(this: Table2<Name, S>) {
  return `${this.schema ? `${this.schema}.` : ""}${this.name}`;
}

function equals<Name extends string, S>(this: Table2<Name, S>, other: Table2<Name, S>) {
  if (!Table2.isTable (other)) return false;

  return (
    this.name === other.name &&
    this.schema === other.schema
  );
}

// Revisit
function empty<Name extends string, S>(this: Table2<Name, S> & RQLTagMaker<any>) {
  return this``;
}

Table2.isTable = function<Name extends string, S> (x: any): x is Table2<Name, S> {
  return x != null && x[refqlType] === type;
};

export default Table2;