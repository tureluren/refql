import RefField from "../RefField";
import Table2 from "../Table2";
import Field from "../Table2/Field";
import TableField from "../Table2/TableField";


export type InputSpec = {
  [key: string]: (...args: any[]) => Field | TableField;
};

export type RelType = "BelongsTo" | "HasMany" | "HasOne" | "BelongsToMany";

export type Spec<S extends InputSpec> = {
  [As in keyof S]: As extends string ? ReturnType<S[As]> extends Field
    ? Field<ReturnType<S[As]>["name"], As, ReturnType<S[As]>["type"]>
    : ReturnType<S[As]> extends TableField<any>
      ? TableField<ReturnType<S[As]>["rel"], ReturnType<S[As]>["name"], As>
      : never : never
};

export type Only<T, S> = {
  [K in keyof T as T[K] extends S ? K : never]: T[K] extends S ? T[K] : never
};

export type OnlyFields<T> = Only<T, Field>;

export type OnlyTableFields<T> = Only<T, TableField>;

export type NameMap<T extends { [key: string]: { name: string }}> = {
  [K in keyof T as T[K]["name"]]: T[K]
};

export interface RefInput {
  lRef?: string;
  rRef?: string;
  xTable?: string;
  lxRef?: string;
  rxRef?: string;
}

export type RefNodeInput = Omit<RefInput, "lxRef" | "rxRef" | "xTable">;

export interface RefInfo<As extends string> {
  parent: Table2;
  lRef: RefField;
  rRef: RefField;
  xTable?: Table2<As, any>;
  lxRef?: RefField;
  rxRef?: RefField;
}

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