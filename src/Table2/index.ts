import { Boxes } from "../common/BoxRegistry";
import { flEmpty, flEquals, refqlType } from "../common/consts";
import { ConvertPromise, Querier, RQLTagMaker, Runnable } from "../common/types";
import { NameMap, InputSpec, OnlyFields, OnlyTableFields } from "../common/types2";
import validateTable from "../common/validateTable";
import { ASTNode, Identifier, RefNode } from "../nodes";
import RQLTag from "../RQLTag";
import Table from "../Table";
import Field from "./Field";
import TableField from "./TableField";

interface Table2<Name extends string = any, S = {}, Box extends Boxes = "Promise"> {
  name: Name;
  schema?: string;
  // refs: Ref<Box>[];
  spec: S;
  empty<Params, Output>(): RQLTag<Name, Params, Output, Box> & Runnable<Params, ReturnType<ConvertPromise<Box, Output>>>;
  [flEmpty]: Table2<Name, S, Box>["empty"];
  equals<Box2 extends Boxes>(other: Table2<Name, S, Box2>): boolean;
  [flEquals]: Table2<Name, S, Box>["equals"];
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

function Table2<Name extends string = any, Input extends InputSpec = [], Box extends Boxes = "Promise">(name: Name, spec: Input, defaultQuerier?: Querier, convertPromise?: ConvertPromise<Boxes>) {
  // validateTable (name);

  // if (!Array.isArray (refs)) {
  //   throw new Error ("Invalid refs: not an Array");
  // }

  type SpecS = { [S in typeof spec[number] as S["as"] ]: S };

  const table = (<Comp extends keyof OnlyFields<SpecS> | OnlyFields<SpecS>[keyof OnlyFields<SpecS>] | RQLTag<OnlyTableFields<SpecS>[keyof OnlyTableFields<SpecS>]["tableId"], {}, any, Box>>(comps: Comp[]) => {
    // const table = (<Comp extends keyof SpecS>(comps: Comp[]) => {
    const selected = comps.map (<Fields extends OnlyFields<SpecS>, Tables extends OnlyTableFields<SpecS>, Names extends NameMap<Tables>>(c: Comp):
      Comp extends keyof Fields
        ? {as: Comp; type: Fields[Comp]["type"]}
        : Comp extends Fields[keyof Fields]
          ? {as: Comp["as"]; type: Comp["type"]}
          : Comp extends RQLTag<Tables[keyof Tables]["tableId"], {}, any, Box>
            ? Names[Comp["tableId"]] extends TableField<any, any, "BelongsTo">
              ? {as: Names[Comp["tableId"]]["as"]; type: Comp["type"][0]}
              : Names[Comp["tableId"]] extends TableField<any, any, "HasMany">
              ? {as: Names[Comp["tableId"]]["as"]; type: Comp["type"]}
              : never
            : never => {
      return "" as any;
    });

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


    // const parser = new Parser<Params, Output, Box> (strings.join ("$"), variables, table);

    return RQLTag<Name, {}, { [K in typeof selected[number] as K["as"]]: K["type"] }[], Box> (table as unknown as Table2<Name, SpecS, Box>, nodes, defaultQuerier, convertPromise as ConvertPromise<Box, { [K in typeof selected[number] as K["as"]]: K["type"] }[]>);
    // return RQLTag<As, {}, { [K in typeof selected[number]]: typeof specS[K]["type"] }, Box> (table as unknown as Table2<As, Spec<Input>, Box>, [], defaultQuerier, convertPromise as ConvertPromise<Box, { [K in typeof selected[number]]: typeof specS[K]["type"] }>);
  });
  // as Table2<Spec<Input>> & RQLTagMaker2<Input, Spec<Input>, Box>;

  // Object.setPrototypeOf (table, prototype);

  // const [tableId, schema] = name.trim ().split (".").reverse ();

  // Object.defineProperty (table, "name", {
  //   value: tableId,
  //   writable: false,
  //   enumerable: true
  // });
  // // table.name = tableId;

  // let buh = table

  // (table as any).schema = schema;
  // // table.spec = Object.keys(spec).map((s: Ide) => );
  // (table as any).spec = specS;

  // return buh;
  Object.setPrototypeOf (table, prototype);

  const [tableId, schema] = name.trim ().split (".").reverse ();

  Object.defineProperty (table, "name", {
    value: tableId,
    writable: false,
    enumerable: true
  });

  let specS = Object.keys (spec).reduce ((acc, key) => {
    return {
      ...acc,
      [key]: spec[key]
    };
  }, {} as unknown as SpecS);


  (table as any).spec = specS;
  (table as any).schema = schema;

  return table as unknown as Table2<Name, { [K in keyof SpecS]: SpecS[K] }> & typeof table;
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