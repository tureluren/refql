import Prop from "../Prop";
import RefProp from "../Prop/RefProp";
import { RQLTag } from "../RQLTag";
import Limit from "../RQLTag/Limit";
import Offset from "../RQLTag/Offset";
import RQLNode from "../RQLTag/RQLNode";
import RefField from "../RQLTag/RefField";
import { SQLTag } from "../SQLTag";
import SQLNode from "../SQLTag/SQLNode";
import Table from "../Table";

// Helpers

export type Simplify<T> = T extends object ? { [K in keyof T]: T[K] } : T;

export type UnionToIntersection<U> =
  Simplify<(U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never>;

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
  <T = any>(query: string, values: ValueType[]) => Promise<T[]>;

export interface RefQLRows {
  refQLRows: any[];
}

export type TagFunctionVariable<Params, Output = ValueType> =
  (params: Params) => Output;

export type SQLTagVariable<Params> =
  | SQLNode<Params>
  | TagFunctionVariable<Params>
  | ValueType;

export type RelType = "BelongsTo" | "HasMany" | "HasOne" | "BelongsToMany";

export type Only<T, S> = {
  [K in keyof T as T[K] extends S ? K : never]: T[K] extends S ? T[K] : never
};

export type OnlyProps<T> = Only<T, Prop>;

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

export interface RefInfo {
  parent: Table;
  lRef: RefField;
  rRef: RefField;
  as: string;
  xTable?: Table;
  lxRef?: RefField;
  rxRef?: RefField;
}

export type AllSign = "*";

export type Pagination = Limit | Offset;

export type Selectable<T> =
  | AllSign
  | keyof OnlyProps<T>
  | OnlyProps<T>[keyof OnlyProps<T>]
  // ?
  | Prop
  | RQLTag<OnlyRefProps<T>[keyof OnlyRefProps<T>]["tableId"]>
  | RQLNode;
  // | Pagination
  // | SQLTag;

export type Insertable<TableId extends string> =
  | RQLTag<TableId>;
  // | SQLTag

export type Updatable<TableId extends string, T> =
  | OnlyProps<T>[keyof OnlyProps<T>]
  | Prop
  | RQLTag<TableId>
  | SQLTag;

export type Deletable<T> =
  | OnlyProps<T>[keyof OnlyProps<T>]
  | Prop
  | SQLTag;

export type ParamsType<S, T extends Selectable<S>[]> = T extends (infer U)[]
  ? (U extends { params: any }
    ? U
    : { params: {}})[]
  : {params: {}}[];


export type Params<S, T extends Selectable<S>[]> = UnionToIntersection<ParamsType<S, T>[number]["params"]>;


export type IsAllSignSelected<S, Components extends Selectable<S>[]> = AllSign extends Components[number] ? true : false;

export type FinalComponents<Props, Components extends Selectable<Props>[]> = IsAllSignSelected<Props, Components> extends true
  ? [keyof OnlyProps<Props>, ...Components]
  : Components;


export type Output<S, T extends Selectable<S>[], Props extends OnlyProps<S> = OnlyProps<S>, RefProps extends OnlyRefProps<S> = OnlyRefProps<S>, TableIds extends TableIdMap<RefProps> = TableIdMap<RefProps>> =
  FinalComponents<S, T> extends (infer U)[]
  ? U extends keyof Props
    ? {as: U; type: Props[U]["type"]}
      : U extends Prop
      ? U["isOmitted"] extends false
        ? { as: U["as"]; type: U["type"] }
        : never

      : U extends RQLTag<RefProps[keyof RefProps]["tableId"]>
        ? TableIds[U["tableId"]] extends RefProp<any, any, "BelongsTo" | "HasOne", true | false>
          ? {as: TableIds[U["tableId"]]["as"]; type: TableIds[U["tableId"]]["isNullable"] extends true ? U["type"][][0] | null : U["type"][][0]}
          : TableIds[U["tableId"]] extends RefProp<any, any, "HasMany" | "BelongsToMany", true | false>
            ? {as: TableIds[U["tableId"]]["as"]; type: TableIds[U["tableId"]]["isNullable"] extends true ? U["type"][] | null : U["type"][]}
            : never
        : never
  : never;



export type InsertParams<S, Props extends OnlyProps<S> = OnlyProps<S>> = Simplify<
  { [K in keyof Props as Props[K]["hasDefaultValue"] extends true ? K : Extract<Props[K]["type"], null> extends never ? never : K]?: Exclude<Props[K]["type"], null> } &
  { [K in keyof Props as Props[K]["hasDefaultValue"] extends false ? (Extract<Props[K]["type"], null> extends never ? K : never) : never]: Props[K]["type"] }
>;

export type UpdateParams<S, Props extends OnlyProps<S> = OnlyProps<S>> = Simplify<
  { [K in keyof Props]?: Props[K]["type"] }
>;

export type OnlyTableRQLTags<TableId extends string, S, T extends (Insertable<TableId> | Updatable<TableId, S>)[]> =
  Extract<T[number], RQLTag<TableId>>[];

export type DefaultReturning<S> =
  Simplify<{ [K in OnlyProps<S>[keyof OnlyProps<S>] as K["as"]]: K["type"] }>;

export type CUDOutput<
  TableId extends string,
  S,
  T extends (Insertable<TableId> | Updatable<TableId, S>)[],
  TableRQLTags extends OnlyTableRQLTags<TableId, S, T> = OnlyTableRQLTags<TableId, S, T>,
  finalOutput = UnionToIntersection<TableRQLTags[number]["type"]>
> = TableRQLTags extends never[]
  ? RQLTag<TableId, {}, DefaultReturning<S>>
  : RQLTag<TableId, {}, finalOutput>;

export type OrdOperator = ">" | "<" | ">=" | "<=";

export interface InterpretedCUD<Params = any, Output = any> {
  tag: SQLTag<Params, Output>;
  returning?: RQLTag<any, Output>;
}