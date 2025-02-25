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

export type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export type AllSign = "*";

export type Pagination = Limit | Offset;

export type Selectable<T> =
  | AllSign
  | keyof OnlyProps<T>
  | OnlyProps<T>[keyof OnlyProps<T>]
  | Prop
  | RQLTag<OnlyRefProps<T>[keyof OnlyRefProps<T>]["tableId"]>
  | RQLNode;
  // | Pagination
  // | SQLTag;

export type Insertable<TableId extends string> =
  | RQLTag<TableId>;
  // | SQLTag


// HOE WERKT DIT? de ene returned array en de andere niet
export type ParamsType<S, T extends Selectable<S>[]> = T extends (infer U)[]
  ? (U extends { params: any }
    ? U
    : { params: {}})[]
  : {params: {}}[];


export type Params<S, T extends Selectable<S>[]> = Simplify<UnionToIntersection<ParamsType<S, T>[number]["params"]>>;


export type IsAllSignSelected<S, Components extends Selectable<S>[]> = AllSign extends Components[number] ? true : false;

export type FinalComponents<Props, Components extends Selectable<Props>[]> = IsAllSignSelected<Props, Components> extends true
  ? [keyof OnlyProps<Props>, ...Components]
  : Components;


export type Output<S, T extends Selectable<S>[], Props extends OnlyProps<S> = OnlyProps<S>, RefProps extends OnlyRefProps<S> = OnlyRefProps<S>, TableIds extends TableIdMap<RefProps> = TableIdMap<RefProps>> =
  FinalComponents<S, T> extends (infer U)[]
  ? (U extends keyof Props
    ? {as: U; type: Props[U]["type"]}
      : U extends Prop
      ? U["isOmitted"] extends false
        ? { as: U["as"]; type: U["type"] }
        : never

      : U extends RQLTag<RefProps[keyof RefProps]["tableId"]>
        ? TableIds[U["tableId"]] extends RefProp<any, any, "BelongsTo" | "HasOne", true | false>
          ? {as: TableIds[U["tableId"]]["as"]; type: TableIds[U["tableId"]]["isNullable"] extends true ? U["type"][0] | null : U["type"][0]}
          : TableIds[U["tableId"]] extends RefProp<any, any, "HasMany" | "BelongsToMany", true | false>
            ? {as: TableIds[U["tableId"]]["as"]; type: TableIds[U["tableId"]]["isNullable"] extends true ? U["type"] | null : U["type"]}
            : never
        : never)[]
  : never;


// Simplify utility to remove unnecessary nesting
export type Simplify<T> = T extends object ? { [K in keyof T]: T[K] } : T;


export type InsertParams<S, Props extends OnlyProps<S> = OnlyProps<S>> = Simplify<
  // Optional properties (hasDefaultValue: true) without | undefined
  { [K in keyof Props as Props[K]["hasDefaultValue"] extends true ? K : never]?: Props[K]["type"] } &

  // Required properties (hasDefaultValue: false) stay as they are
  { [K in keyof Props as Props[K]["hasDefaultValue"] extends false ? K : never]: Props[K]["type"] }
>;

















export type OnlyTableRQLTags<TableId extends string, T extends Insertable<TableId>[]> =
  Extract<T[number], RQLTag<TableId>>[];

export type DefaultReturning<S> =
  { [K in OnlyProps<S>[keyof OnlyProps<S>] as K["as"]]: K["type"] };

export type InsertOutput<
  TableId extends string,
  S,
  T extends Insertable<TableId>[],
  TableRQLTags extends OnlyTableRQLTags<TableId, T> = OnlyTableRQLTags<TableId, T>,
  finalOutput = UnionToIntersection<TableRQLTags[number] extends RQLTag<TableId, any, infer Type> ? Type : never>
> = TableRQLTags extends never[]
  ? RQLTag<TableId, {}, { [K in keyof DefaultReturning<S>]: DefaultReturning<S>[K] }[]>
  : RQLTag<TableId, {}, { [K in keyof finalOutput]: finalOutput[K]}>;

export type OrdOperator = ">" | "<" | ">=" | "<=";

export interface InterpretedCUD<Params = any, Output = any> {
  tag: SQLTag<Params, Output>;
  returning?: RQLTag<any, Output>;
}