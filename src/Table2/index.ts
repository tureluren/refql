import { Boxes } from "../common/BoxRegistry";
import { flEmpty, flEquals, refqlType } from "../common/consts";
import { ConvertPromise, Querier, RQLTagMaker } from "../common/types";
import { AllInComps, CombinedParams, Comp, OnlyPropFields, Prop, SelectedS } from "../common/types2";
import { ASTNode, Identifier, RefNode } from "../nodes";
import RQLTag from "../RQLTag";
import Field from "./Field";
import TableField from "./TableField";

interface Table2<Name extends string = any, Spec = {}, Box extends Boxes = "Promise"> {
  name: Name;
  schema?: string;
  // refs: Ref<Box>[];
  spec: Spec;
  empty<Params, Output>(): RQLTag<Name, Params, Output, Box>;
  [flEmpty]: Table2<Name, Spec, Box>["empty"];
  equals<Box2 extends Boxes>(other: Table2<Name, Spec, Box2>): boolean;
  [flEquals]: Table2<Name, Spec, Box>["equals"];
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

function Table2<Name extends string = any, Props extends Prop[] = [], Box extends Boxes = "Promise">(name: Name, props: Props, defaultQuerier?: Querier, convertPromise?: ConvertPromise<Boxes>) {
  // validateTable (name);

  // if (!Array.isArray (refs)) {
  //   throw new Error ("Invalid refs: not an Array");
  // }

  let spec = props.reduce ((acc, key) => {
    return {
      ...acc,
      [key.as]: props[key.as]
    };
  }, {} as { [P in Props[number] as P["as"] ]: P });




  const table = (<Comps extends Comp<typeof spec>[]>(comps: Comps) => {
    type Compies = AllInComps<typeof spec, Comps> extends true ? [keyof OnlyPropFields<typeof spec>, ...Comps] : Comps;

    const nodes: ASTNode<{}, any, any>[] = [];

    for (const comp of comps) {
      // and keys includes comp
      if (typeof comp === "string") {
        const id = (table as any).spec[comp] as Field;
        nodes.push (Identifier (id.col || id.as, id.as));
      } else if (RQLTag.isRQLTag (comp)) {
        for (const specKey in (table as any).spec) {
          const sp = (table as any).spec[specKey];

          if (TableField.isTableField (sp) && sp.child.equals (comp.table)) {
            nodes.push (RefNode (sp.refInfo as any, comp, true));
          }
        }

      }
    }

    return RQLTag<Name, CombinedParams<Comps, typeof spec>, { [K in SelectedS<Compies, typeof spec>[number] as K["as"]]: K["type"] }[], Box> (table as unknown as Table2<Name, typeof spec, Box>, nodes as any, defaultQuerier, convertPromise as ConvertPromise<Box, { [K in SelectedS<Compies, typeof spec>[number] as K["as"]]: K["type"] }[]>);
  });

  Object.setPrototypeOf (table, prototype);

  const [tableId, schema] = name.trim ().split (".").reverse ();

  Object.defineProperty (table, "name", {
    value: tableId,
    writable: false,
    enumerable: true
  });


  (table as any).spec = spec;
  (table as any).schema = schema;

  return table as unknown as Table2<Name, { [K in keyof typeof spec]: typeof spec[K] }> & typeof table;
}

function toString<Name extends string, S, Box extends Boxes>(this: Table2<Name, S, Box>) {
  return `${this.schema ? `${this.schema}.` : ""}${this.name}`;
}

function equals<Name extends string, S, Box extends Boxes>(this: Table2<Name, S, Box>, other: Table2<Name, S, Box>) {
  if (!Table2.isTable (other)) return false;

  return (
    this.name === other.name &&
    this.schema === other.schema
  );
}

// Revisit
function empty<Name extends string, S, Box extends Boxes>(this: Table2<Name, S, Box> & RQLTagMaker<Box>) {
  return this``;
}

Table2.isTable = function<Name extends string, S, Box extends Boxes> (x: any): x is Table2<Name, S, Box> {
  return x != null && x[refqlType] === type;
};

export default Table2;