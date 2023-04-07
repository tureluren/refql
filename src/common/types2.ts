import Field from "../Table2/Field";
import TableField from "../Table2/TableField";


export type InputSpec = {
  [key: string]: (as: any) => Field | TableField<any>;
};

export type RelType = "BelongsTo" | "HasMany";

export type Spec<S extends InputSpec> = {
  [As in keyof S]: As extends string ? ReturnType<S[As]> extends Field
    ? Field<ReturnType<S[As]>["name"], As, ReturnType<S[As]>["type"]>
    : ReturnType<S[As]> extends TableField<any>
      ? TableField<ReturnType<S[As]>["rel"], ReturnType<S[As]>["name"], As>
      : never : never
};

export type OnlyFields<T> = {
  [P in keyof T as T[P] extends Field ? P : never]: T[P] extends Field ? T[P] : never
};

export type NameMap<T extends { [key: string]: { name: string }}> = {
  [b in keyof T as T[b]["name"]]: T[b]
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