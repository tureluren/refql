import { Boxes } from "../common/BoxRegistry";
import { flEmpty, flEquals, refqlType } from "../common/consts";
import { ConvertPromise, Querier, RQLTagMaker, Runnable } from "../common/types";
import { NameMap, InputSpec, OnlyFields, Spec } from "../common/types2";
import validateTable from "../common/validateTable";
import RQLTag from "../RQLTag";
import Table from "../Table";
import Field from "./Field";
import numberField from "./NumberField";
import TableField from "./TableField";

interface Table2<Name, S, Box extends Boxes = "Promise"> {
  name: Name;
  schema?: string;
  // refs: Ref<Box>[];
  spec: S;
  empty<Params, Output>(): RQLTag<Name, Params, Output, Box> & Runnable<Params, ReturnType<ConvertPromise<Box, Output>>>;
  [flEmpty]: Table2<S, Box>["empty"];
  equals<Box2 extends Boxes>(other: Table2<S, Box2>): boolean;
  [flEquals]: Table2<S, Box>["equals"];
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

function Table2<Name extends string, Input extends InputSpec, Box extends Boxes = "Promise">(name: Name, spec: Input, defaultQuerier?: Querier, convertPromise?: ConvertPromise<Boxes>) {
  // let iep = (Object.keys (spec) as (keyof Input)[]).reduce ((acc, key) => {

  // }, {} as { [key: keyof Input]: Field });


  let specS: Spec<Input> = spec as unknown as Spec<Input>;

  // validateTable (name);

  // if (!Array.isArray (refs)) {
  //   throw new Error ("Invalid refs: not an Array");
  // }



  const table = (<Comp extends keyof OnlyFields<Spec<Input>> | OnlyFields<Spec<Input>>[keyof OnlyFields<Spec<Input>>] | RQLTag<Spec<Input>[keyof Spec<Input>]["name"], {}, any, Box>>(comps: Comp[]) => {
    const selected = comps.map ((c: Comp):
      Comp extends keyof OnlyFields<Spec<Input>>
        ? {as: Comp; type: OnlyFields<Spec<Input>>[Comp]["type"]}
        : Comp extends OnlyFields<Spec<Input>>[keyof OnlyFields<Spec<Input>>]
          ? {as: Comp["as"]; type: Comp["type"]}
          : Comp extends RQLTag<Spec<Input>[keyof Spec<Input>]["name"], {}, any, Box>
            ? NameMap<Spec<Input>>[Comp["as"]] extends TableField<"BelongsTo">
              ? {as: NameMap<Spec<Input>>[Comp["as"]]["as"]; type: Comp["type"]}
              : NameMap<Spec<Input>>[Comp["as"]] extends TableField<"HasMany">
              ? {as: NameMap<Spec<Input>>[Comp["as"]]["as"]; type: Comp["type"][]}
              : never
            : never => {
      return "" as any;
    });



    // const parser = new Parser<Params, Output, Box> (strings.join ("$"), variables, table);

    return RQLTag<Name, {}, { [K in typeof selected[number] as K["as"]]: K["type"] }, Box> (table as unknown as Table2<Name, Spec<Input>, Box>, [], defaultQuerier, convertPromise as ConvertPromise<Box, { [K in typeof selected[number] as K["as"]]: K["type"] }>);
    // return RQLTag<As, {}, { [K in typeof selected[number]]: typeof specS[K]["type"] }, Box> (table as unknown as Table2<As, Spec<Input>, Box>, [], defaultQuerier, convertPromise as ConvertPromise<Box, { [K in typeof selected[number]]: typeof specS[K]["type"] }>);
  });
  // as Table2<Spec<Input>> & RQLTagMaker2<Input, Spec<Input>, Box>;

  Object.setPrototypeOf (table, prototype);

  const [tableName, schema] = name.trim ().split (".").reverse ();

  Object.defineProperty (table, "name", {
    value: tableName,
    writable: false,
    enumerable: true
  });
  // table.name = tableName;

  let buh = table as unknown as Table2<As, { [K in keyof Spec<Input>]: Spec<Input>[K] }> & typeof table;

  (table as any).schema = schema;
  // table.spec = Object.keys(spec).map((s: Ide) => );
  (table as any).spec = specS;

  return buh;

}

function toString<Box extends Boxes>(this: Table2<Box>) {
  return `${this.schema ? `${this.schema}.` : ""}${this.name}`;
}

function equals<Box extends Boxes>(this: Table2<Box>, other: Table2<Box>) {
  if (!Table2.isTable (other)) return false;

  return (
    this.name === other.name &&
    this.schema === other.schema
  );
}

function empty<Box extends Boxes>(this: Table2<Box> & RQLTagMaker<Box>) {
  return this``;
}

Table2.isTable = function<Box extends Boxes> (x: any): x is Table2<Box> {
  return x != null && x[refqlType] === type;
};

export default Table2;