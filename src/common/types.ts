import RefField from "../RefField";
import { RQLTag } from "../RQLTag";
import RefNode from "../RQLTag/RefNode";
import { SQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import Value from "../SQLTag/Value";
import Values from "../SQLTag/Values";
import Values2D from "../SQLTag/Values2D";
import Table from "../Table";
import Eq from "../Table/Eq";
import Prop from "../Table/Prop";
import RefProp from "../Table/RefProp";
import When from "./When";

// Array, Function, Date, ...
export type StringMap = Record<string, any>;

export type ValueType =
  | boolean
  | null
  | undefined
  | number
  | bigint
  | string
  | StringMap;

export type Querier =
  <T>(query: string, values: ValueType[]) => Promise<T[]>;

export interface RefQLRows {
  refQLRows: any[];
}

export type TagFunctionVariable<Params, Output = ValueType> =
  (params: Params) => Output;

export type SQLNode<Params> =
  | Raw<Params>
  | Value<Params>
  | Values<Params>
  | Values2D<Params>
  | When<Params>;

export type SQLTagVariable<Params> =
  | SQLNode<Params>
  | TagFunctionVariable<Params>
  | ValueType;

export type RelType = "BelongsTo" | "HasMany" | "HasOne" | "BelongsToMany";

export type Only<T, S> = {
  [K in keyof T as T[K] extends S ? K : never]: T[K] extends S ? T[K] : never
};

export type OnlyProps<T> = Only<T, Prop>;

export type OnlyStringColProps<T> = {
  [K in keyof T as T[K] extends Prop ? T[K]["col"] extends SQLTag ? never : K : never]: T[K] extends Prop ? T[K]["col"] extends SQLTag ? never : T[K] : never
};

export type OnlyRefProps<T> = Only<T, RefProp>;

export type TableIdMap<T extends { [key: string]: { tableId: string }}> = {
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
  as: As;
  xTable?: Table;
  lxRef?: RefField;
  rxRef?: RefField;
}

export type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export type AllSign = "*";

export type Selectable<T> =
  | AllSign
  | keyof OnlyProps<T>
  | OnlyProps<T>[keyof OnlyProps<T>]
  | RQLTag<OnlyRefProps<T>[keyof OnlyRefProps<T>]["tableId"], any, any>
  | SQLTag
  | When<any>
  | Eq<any, any>;

export type SQLTagObjects<S, T extends Selectable<S>[], Props extends OnlyProps<S> = OnlyProps<S>> = T extends (infer U)[]
  ? (U extends (SQLTag | Eq<any, any>)
    ? U
    : U extends Prop
      ? U["col"] extends SQLTag
        ? U["col"]
        : never
      : U extends keyof Props
        ? Props[U]["col"] extends SQLTag
          ? Props[U]["col"]
          : never
        : U extends When<any>
          ? U["tag"]
          : never)[]
  : never;

export type Params<S, T extends Selectable<S>[]> = UnionToIntersection<SQLTagObjects<S, T>[number]["params"]>;

export type IsAllSignSelected<S, Components extends Selectable<S>[]> = AllSign extends Components[number] ? true : false;

export type FinalComponents<Props, Components extends Selectable<Props>[], > = IsAllSignSelected<Props, Components> extends true
  ? [keyof OnlyStringColProps<Props>, ...Components]
  : Components;

export type Output<S, T extends Selectable<S>[], Props extends OnlyProps<S> = OnlyProps<S>, RefProps extends OnlyRefProps<S> = OnlyRefProps<S>, TableIds extends TableIdMap<RefProps> = TableIdMap<RefProps>> =
  FinalComponents<S, T> extends (infer U)[]
  ? (U extends keyof Props
    ? {as: U; type: Props[U]["type"]}
    : U extends Props[keyof Props]
      ? {as: U["as"]; type: U["type"]}
      : U extends RQLTag<RefProps[keyof RefProps]["tableId"], any, any>
        ? TableIds[U["tableId"]] extends RefProp<any, any, "BelongsTo" | "HasOne">
          ? {as: TableIds[U["tableId"]]["as"]; type: U["type"][0]}
          : TableIds[U["tableId"]] extends RefProp<any, any, "HasMany" | "BelongsToMany">
            ? {as: TableIds[U["tableId"]]["as"]; type: U["type"]}
            : never
        : never)[]
  : never;

export type RQLNode = Prop | SQLTag | RefNode<any, any> | When<any>;