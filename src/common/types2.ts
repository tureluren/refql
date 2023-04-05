import { Identifier } from "../nodes";
import RQLTag from "../RQLTag";
import Field from "../Table2/Field";
import { Boxes, BoxRegistry } from "./BoxRegistry";
import { ConvertPromise, Runnable } from "./types";


export type InputSpec = {
  [key: string]: (as: any) => Field;
};

export type Spec<S extends InputSpec> = {
  [As in keyof S]: Field<ReturnType<S[As]>["name"], As, ReturnType<S[As]>["type"]>
};



// export type RQLTagMaker2<S, Box extends Boxes> =
//   <Params = unknown>(comps: (keyof S | S[keyof S])[])
//     => RQLTag<Params, { [] }, Box> & Runnable<Params, ReturnType<ConvertPromise<Box, Output>>>;

// type extractFromObj<T, K extends keyof T> = (obj: T, keys: K[]): Pick<T, K>;

// type Pickie<Input extends InputSpec, S extends Spec<Input>, Comp> = Comp extends keyof S ? Pick<S, Comp> : never;
// type Pickie<Input extends InputSpec, S extends Spec<Input>, Comp extends keyof S> = Comp extends keyof S ? Pick<S, Comp> : never;

// export type RQLTagMaker2<Input extends InputSpec, S extends Spec<Input>, Box extends Boxes> =
//   <Output extends Pickie<Input, S, Comp>, Params = unknown, Comp extends keyof S = "">(comps: Comp[])
//     => RQLTag<Params, { [k in keyof Output]: Output[k]["type"]}, Box> & Runnable<Params, ReturnType<ConvertPromise<Box, { [k in keyof Output]: Output[k]["type"]}>>>;

// export type RQLTagMaker2<Input extends InputSpec, S extends Spec<Input>, Box extends Boxes> =
//   <Output extends Pick<S, Comp>, Params = unknown, Comp extends keyof S = "">(comps: Comp[])
//     => RQLTag<Params, { [k in keyof Output]: Output[k]["type"]}, Box> & Runnable<Params, ReturnType<ConvertPromise<Box, { [k in keyof Output]: Output[k]["type"]}>>>;