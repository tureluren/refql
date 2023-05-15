import RefField from "../RefField";
import { RQLTag } from "../RQLTag";
import Eq from "../RQLTag/Eq";
import Prop from "../RQLTag/Prop";
import RefNode from "../RQLTag/RefNode";
import SQLProp from "../RQLTag/SQLProp";
import { SQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import Value from "../SQLTag/Value";
import Values from "../SQLTag/Values";
import Values2D from "../SQLTag/Values2D";
import Table from "../Table";
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

export type OnlySQLProps<T> = Only<T, SQLProp>;

export type OnlyPropsOrSQLProps<T> = Only<T, Prop | SQLProp>;

export type OnlyRefProps<T> = Only<T, RefProp<any, any, any, true | false>>;

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

export interface RefInfo<As extends string = any> {
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
  | keyof OnlyPropsOrSQLProps<T>
  | OnlyPropsOrSQLProps<T>[keyof OnlyPropsOrSQLProps<T>]
  | RQLTag<OnlyRefProps<T>[keyof OnlyRefProps<T>]["tableId"]>
  | SQLTag
  | When<any>
  | Eq<any>;

export type SQLTagObjects<S, T extends Selectable<S>[], SQLProps extends OnlySQLProps<S> = OnlySQLProps<S>> = T extends (infer U)[]
  ? (U extends (SQLTag | Eq<any> | RQLTag<any, any, any>)
    ? U
    : U extends SQLProp
      ? U["col"]
      : U extends keyof SQLProps
        ? SQLProps[U]["col"]
        : U extends When<any>
          ? U["tag"]
          : { params: {}})[]
  : {params: {}};

export type Params<S, T extends Selectable<S>[]> = UnionToIntersection<SQLTagObjects<S, T>[number]["params"]>;

export type IsAllSignSelected<S, Components extends Selectable<S>[]> = AllSign extends Components[number] ? true : false;

export type FinalComponents<Props, Components extends Selectable<Props>[], > = IsAllSignSelected<Props, Components> extends true
  ? [keyof OnlyProps<Props>, ...Components]
  : Components;

export type Output<S, T extends Selectable<S>[], Props extends OnlyPropsOrSQLProps<S> = OnlyPropsOrSQLProps<S>, RefProps extends OnlyRefProps<S> = OnlyRefProps<S>, TableIds extends TableIdMap<RefProps> = TableIdMap<RefProps>> =
  FinalComponents<S, T> extends (infer U)[]
  ? (U extends keyof Props
    ? {as: U; type: Props[U]["type"]}
    : U extends Props[keyof Props]
      ? {as: U["as"]; type: U["type"]}
      : U extends RQLTag<RefProps[keyof RefProps]["tableId"], any, any>
        ? TableIds[U["tableId"]] extends RefProp<any, any, "BelongsTo" | "HasOne", true | false>
          ? {as: TableIds[U["tableId"]]["as"]; type: TableIds[U["tableId"]]["isNullable"] extends true ? U["type"][0] | null : U["type"][0]}
          : TableIds[U["tableId"]] extends RefProp<any, any, "HasMany" | "BelongsToMany", true | false>
            ? {as: TableIds[U["tableId"]]["as"]; type: TableIds[U["tableId"]]["isNullable"] extends true ? U["type"] | null : U["type"]}
            : never
        : never)[]
  : never;

export type RQLNode = Prop | SQLProp | SQLTag | RefNode<any, any> | When<any> | Eq<any>;