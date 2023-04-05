import { Boxes } from "../common/BoxRegistry";
import { flEmpty, flEquals, refqlType } from "../common/consts";
import { ConvertPromise, Querier, RQLTagMaker, Runnable } from "../common/types";
import { InputSpec, Spec } from "../common/types2";
import validateTable from "../common/validateTable";
import RQLTag from "../RQLTag";
import Table from "../Table";
import Field from "./Field";
import numberField from "./NumberField";

interface Table2<As, S, Box extends Boxes = "Promise"> {
  name: As;
  schema?: string;
  // refs: Ref<Box>[];
  spec: S;
  empty<Params, Output>(): RQLTag<As, Params, Output, Box> & Runnable<Params, ReturnType<ConvertPromise<Box, Output>>>;
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

function Table2<As extends string, Input extends InputSpec, Box extends Boxes = "Promise">(name: As, spec: Input, defaultQuerier?: Querier, convertPromise?: ConvertPromise<Boxes>) {
  // let iep = (Object.keys (spec) as (keyof Input)[]).reduce ((acc, key) => {

  // }, {} as { [key: keyof Input]: Field });


  let specS: Spec<Input> = spec as unknown as Spec<Input>;

  // validateTable (name);

  // if (!Array.isArray (refs)) {
  //   throw new Error ("Invalid refs: not an Array");
  // }


  const table = (<Comp extends keyof Spec<Input> | Spec<Input>[keyof Spec<Input>] | RQLTag<Spec<Input>[keyof Spec<Input>]["name"], {}, any, Box>>(comps: Comp[]) => {

    // filter never uit type ?
    // const selected = comps.map ((c: Comp):
    //   Comp extends keyof Spec<Input>
    //     ? Comp
    //     : Comp extends Spec<Input>[keyof Spec<Input>]
    //       ? Comp["as"]
    //       : Comp extends RQLTag<{}, any, Box>
    //         ? Comp["output"]
    //         : never => {

    //   return "" as any;
    // });

    const isTypeOf = (value: any): value is keyof Spec<Input> => {
      return typeof value === "string";
    };

    const isAs = (value: any): value is Spec<Input>[keyof Spec<Input>] => {
      return typeof value === "string";
    };

    const isRQLTag = (value: any): value is RQLTag<keyof Spec<Input>, {}, any, Box> => {
      return typeof value === "object";
    };

    // const getAsFromTag = (value: RQLTag<any, {}, any, Box>) => {
    //   return value;
    // };

    const getKey = <As extends keyof Spec<Input>>(value: any, as: As): As => {
      return as;
    };

    const getAs = <T>(value: T): T extends Spec<Input>[keyof Spec<Input>] ? T["as"] : never => {
      return "" as any;
    };



    const selected = comps.map ((c: Comp):
      Comp extends keyof Spec<Input>
        ? Comp
        : Comp extends Spec<Input>[keyof Spec<Input>]
          ? Comp["as"]
          : Comp extends RQLTag<string, {}, any, Box>
            ? Spec<Input>[Comp["as"]]["as"]
            : never => {
      return "" as any;
    });



    // const parser = new Parser<Params, Output, Box> (strings.join ("$"), variables, table);

    return RQLTag<As, {}, { [K in typeof selected[number]]: typeof specS[K]["type"] }, Box> (table as unknown as Table2<As, Spec<Input>, Box>, [], defaultQuerier, convertPromise as ConvertPromise<Box, { [K in typeof selected[number]]: typeof specS[K]["type"] }>);
    // return RQLTag<{}, {}, Box> (table as unknown as Table<Box>, [], defaultQuerier, convertPromise as ConvertPromise<Box, {}>);
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

  let buh = table as unknown as Table2<As, Spec<Input>> & typeof table;

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