import Prop from "../Prop";
import RefProp from "../Prop/RefProp";
import SQLProp from "../Prop/SQLProp";
import { RQLTag } from "../RQLTag";
import Limit from "../RQLTag/Limit";
import Offset from "../RQLTag/Offset";
import RefField from "../RQLTag/RefField";
import { SQLTag } from "../SQLTag";
import SQLNode from "../SQLTag/SQLNode";
import Table from "../Table";

type Test<T> = T extends object ? "Yes" : "No";

type A = Test<{}>; // "Yes"  (empty object extends itself)
type B = Test<{ id: number }>; // "No"   ({} is not assignable to { id: number })
type C = Test<any>; // "Yes"  (any allows everything)
type D = Test<{} & any>; // "Yes"  (unknown is a top type)
type E = Test<never>; // "No"   (never accepts nothing)

// Helpers
export type Simplify<T> = T extends object ? { [K in keyof T]: T[K] } : {};

export type UnionToIntersection<U> =
  Simplify<(U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never>;

export type Only<T, S> = {
  [K in keyof T as T[K] extends S ? K : never]: T[K] extends S ? T[K] : never
};

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

export type OnlyProps<T> = Only<T, Prop>;

export type OnlySQLProps<T> = Only<T, SQLProp>;

export type OnlyRefProps<T> = Only<T, RefProp<any, any, any, true | false>>;

export type OnlyPropsOrSQLProps<T> = Only<T, Prop | SQLProp>;

export type PropMap<S> =
  Simplify<{ [K in OnlyProps<S>[keyof OnlyProps<S>] as K["as"]]: K["output"] }>;

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

export type Pagination = Limit | Offset;

export type Selectable<T> =
  | keyof OnlyPropsOrSQLProps<T>
  | Prop<keyof OnlyProps<T>>
  | SQLProp
  | RQLTag<OnlyRefProps<T>[keyof OnlyRefProps<T>]["tableId"]>
  | Table<OnlyRefProps<T>[keyof OnlyRefProps<T>]["tableId"]>
  | Pagination
  | SQLTag;

export type Insertable<TableId extends string> =
  | RQLTag<TableId>;

export type Updatable<TableId extends string, T> =
  | OnlyProps<T>[keyof OnlyProps<T>]
  | Prop<keyof OnlyProps<T>>
  | SQLProp
  | RQLTag<TableId>
  | SQLTag;

export type Deletable<T> =
  | OnlyProps<T>[keyof OnlyProps<T>]
  | Prop<keyof OnlyProps<T>>
  | SQLProp
  | SQLTag;


export type ParamsType<S, T extends Selectable<S>[], SQLProps extends OnlySQLProps<S> = OnlySQLProps<S>> = T extends (infer U)[]
  ? (U extends { params: any }
    ? U
    : U extends keyof SQLProps
      ? SQLProps[U]
      : { params: {}})[]
  : {params: {}};

export type Params<S, T extends Selectable<S>[]> = UnionToIntersection<ParamsType<S, T>[number]["params"]>;


export type OnlyBuh<S, T extends Selectable<S>[]> =
  Extract<T[number], keyof OnlyProps<S> | OnlyProps<S>[keyof OnlyProps<S>]>[];

export type NoPropsSelected<S, Components extends Selectable<S>[], Props extends OnlyBuh<S, Components> = OnlyBuh<S, Components>> =
  Props extends never[] ? true : false;

export type FinalComponents<Props, Components extends Selectable<Props>[]> = NoPropsSelected<Props, Components> extends true
  ? [keyof OnlyProps<Props>, ...Components]
  : Components;


export type Output<S, T extends Selectable<S>[], Props extends OnlyPropsOrSQLProps<S> = OnlyPropsOrSQLProps<S>, RefProps extends OnlyRefProps<S> = OnlyRefProps<S>, TableIds extends TableIdMap<RefProps> = TableIdMap<RefProps>> =
  FinalComponents<S, T> extends (infer U)[]
  ? U extends keyof Props
    ? {as: U; type: Props[U]["output"]}
      : U extends Prop | SQLProp
      ? U["isOmitted"] extends false
        ? { as: U["as"]; type: U["output"] }
        : never

      : U extends RQLTag<RefProps[keyof RefProps]["tableId"]>
        ? TableIds[U["tableId"]] extends RefProp<any, any, "BelongsTo" | "HasOne", true | false>
          ? {as: TableIds[U["tableId"]]["as"]; type: TableIds[U["tableId"]]["isNullable"] extends true ? U["output"][][0] | null : U["output"][][0]}
          : TableIds[U["tableId"]] extends RefProp<any, any, "HasMany" | "BelongsToMany", true | false>
            ? {as: TableIds[U["tableId"]]["as"]; type: TableIds[U["tableId"]]["isNullable"] extends true ? U["output"][] | null : U["output"][]}
            : never

        : U extends Table<RefProps[keyof RefProps]["tableId"]>
          ? TableIds[U["tableId"]] extends RefProp<any, any, "BelongsTo" | "HasOne", true | false>
            ? {as: TableIds[U["tableId"]]["as"]; type: TableIds[U["tableId"]]["isNullable"] extends true ? PropMap<U["props"]>[][0] | null : PropMap<U["props"]>[][0]}
            : TableIds[U["tableId"]] extends RefProp<any, any, "HasMany" | "BelongsToMany", true | false>
              ? {as: TableIds[U["tableId"]]["as"]; type: TableIds[U["tableId"]]["isNullable"] extends true ? PropMap<U["props"]>[] | null : PropMap<U["props"]>[]}
              : never
        : never
  : never;



export type InsertParams<S, Props extends OnlyProps<S> = OnlyProps<S>> = Simplify<
  { [K in keyof Props as Props[K]["hasDefaultValue"] extends true ? K : Extract<Props[K]["output"], null> extends never ? never : K]?: Exclude<Props[K]["output"], null> } &
  { [K in keyof Props as Props[K]["hasDefaultValue"] extends false ? (Extract<Props[K]["output"], null> extends never ? K : never) : never]: Props[K]["output"] }
>;

export type UpdateParams<S, Props extends OnlyProps<S> = OnlyProps<S>> = Simplify<
  { [K in keyof Props]?: Props[K]["output"] }
>;

export type OnlyTableRQLTags<TableId extends string, S, T extends (Insertable<TableId> | Updatable<TableId, S>)[]> =
  Extract<T[number], RQLTag<TableId>>[];

export type CUDOutput<
  TableId extends string,
  S,
  T extends (Insertable<TableId> | Updatable<TableId, S>)[],
  TableRQLTags extends OnlyTableRQLTags<TableId, S, T> = OnlyTableRQLTags<TableId, S, T>,
  finalOutput = UnionToIntersection<TableRQLTags[number]["output"]>
> = TableRQLTags extends never[]
  ? RQLTag<TableId, {}, PropMap<S>>
  : RQLTag<TableId, {}, finalOutput>;

export type OrdOperator = ">" | "<" | ">=" | "<=";

export interface InterpretedCUD<Params = any, Output = any> {
  tag: SQLTag<Params, Output>;
  returning?: RQLTag<any, Output>;
}