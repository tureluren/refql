import RefField from "../RefField";
import { RQLTag } from "../RQLTag";
import { SQLTag } from "../SQLTag";
import Table from "../Table";
import Prop from "../Table/Prop";
import RefProp from "../Table/RefProp";


// export type InputSpec = {
//   [key: string]: (...args: any[]) => Field | TableField;
// };

// type buh = ReturnType<InputSpec["1"]>

// export type InputSpec = {
//   [key: string]: Field | TableField;
// };


export type RelType = "BelongsTo" | "HasMany" | "HasOne" | "BelongsToMany";

// export type Spec<S extends InputSpec> = {
//   [As in keyof S]: As extends string ? ReturnType<S[As]> extends Field
//     ? Field<ReturnType<S[As]>["name"], As, ReturnType<S[As]>["type"]>
//     : ReturnType<S[As]> extends TableField<any>
//       ? TableField<ReturnType<S[As]>["rel"], ReturnType<S[As]>["name"], As>
//       : never : never
// };

// export type InputSpec = Record<string, Field | TableField>;

// Rel ipv TableField

export type Only<T, S> = {
  [K in keyof T as T[K] extends S ? K : never]: T[K] extends S ? T[K] : never
};

export type OnlyFields<T> = Only<T, Prop>;

export type OnlyPropFields<T> = {
  [K in keyof T as T[K] extends Prop ? T[K]["col"] extends SQLTag ? never : K : never]: T[K] extends Prop ? T[K]["col"] extends SQLTag ? never : T[K] : never
};

export type OnlyTableFields<T> = Only<T, RefProp>;

export type OnlySQLTags<T> = Only<T, SQLTag>;

export type NameMap<T extends { [key: string]: { tableId: string }}> = {
  [K in keyof T as T[K]["tableId"]]: T[K]
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
  parent: Table;
  lRef: RefField;
  rRef: RefField;
  xTable?: Table<As, any>;
  lxRef?: RefField;
  rxRef?: RefField;
}

export type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export type SQLTag2Objects<T, S, Fields extends OnlyFields<S> = OnlyFields<S>> = T extends (infer U)[]
  ? (U extends SQLTag
    ? U
    : U extends Prop
      ? U["col"] extends SQLTag
        ? U["col"]
        : never
      : U extends keyof Fields
        ? Fields[U]["col"] extends SQLTag
          ? Fields[U]["col"]
          : never
        : never)[]
  : never;

export type CombinedParams<T, S> = UnionToIntersection<SQLTag2Objects<T, S>[number]["params"]>;

export type AllSign = "*";

export type Selectable<T> = AllSign |
  keyof OnlyFields<T> |
  OnlyFields<T>[keyof OnlyFields<T>] |
  RQLTag<OnlyTableFields<T>[keyof OnlyTableFields<T>]["tableId"], any, any> |
  SQLTag;

export type SelectedS<T, S, Fields extends OnlyFields<S> = OnlyFields<S>, Tables extends OnlyTableFields<S> = OnlyTableFields<S>, Names extends NameMap<Tables> = NameMap<Tables>> =
    T extends (infer U)[]
    ? (U extends keyof Fields
      ? {as: U; type: Fields[U]["type"]}
      : U extends Fields[keyof Fields]
        ? {as: U["as"]; type: U["type"]}
        : U extends RQLTag<Tables[keyof Tables]["tableId"], any, any>
          ? Names[U["tableId"]] extends RefProp<any, any, "BelongsTo">
            ? {as: Names[U["tableId"]]["as"]; type: U["type"][0]}
            : Names[U["tableId"]] extends RefProp<any, any, "HasMany">
              ? {as: Names[U["tableId"]]["as"]; type: U["type"]}
              : never
          : never)[]
    : never;

export type AllInComps<S, Comps extends Selectable<S>[]> = "*" extends Comps[number] ? true : false;