import Prop from "../Prop";
import RefProp from "../Prop/RefProp";
import SQLProp from "../Prop/SQLProp";
import { RQLTag } from "../RQLTag";
import CUD from "../RQLTag/CUD";
import Limit from "../RQLTag/Limit";
import Offset from "../RQLTag/Offset";
import RefField from "../RQLTag/RefField";
import { SQLTag } from "../SQLTag";
import SQLNode from "../SQLTag/SQLNode";
import { Table } from "../Table";

export type StringMap = Record<string, any>;

export type ValueType =
  | boolean
  | null
  | undefined
  | number
  | bigint
  | string
  | StringMap;

export type OrdOperator = ">" | "<" | ">=" | "<=";

export type RelType = "BelongsTo" | "HasMany" | "HasOne" | "BelongsToMany";

// 0 extends (1 & T) = any
export type Simplify<T> = 0 extends (1 & T) ? {} : { [K in keyof T]: T[K] };

export type UnionToIntersection<U> =
  (U extends any ? (k: U) => void : never) extends (k: infer I) => void ? I : never;

export type Only<T, S> = {
  [K in keyof T as T[K] extends S ? K : never]: T[K] extends S ? T[K] : never
};

export type OnlyProps<T> = Only<T, Prop>;

export type OnlySQLProps<T> = Only<T, SQLProp>;

export type OnlyRefProps<T> = Only<T, RefProp>;

export type OnlyPropsOrSQLProps<T> = Only<T, Prop | SQLProp>;

export type OnlyWithEmptyOperations<T> =
  Only<T, Prop<any, any, any, any, any, false> | SQLProp<any, any, any, any, false>>;

export type AllProps<S> =
  Simplify<{ [K in OnlyProps<S>[keyof OnlyProps<S>] as K["as"]]: K["output"] }>;

export type TagFunctionVariable<Params, Output = ValueType> =
  (params: Params) => Output;

export type SQLTagVariable<Params> =
  | SQLNode<Params>
  | TagFunctionVariable<Params>
  | ValueType;

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
  | Prop<keyof OnlyProps<T>>
  | SQLProp
  | RQLTag<TableId>
  | SQLTag;

export type Deletable<T> =
  | Prop<keyof OnlyProps<T>>
  | SQLProp
  | SQLTag;

export type Querier =
  <T = any>(query: string, values: ValueType[]) => Promise<T[]>;

export type Runner =
  <TagType extends RQLTag | CUD | SQLTag>(tag: TagType, params: TagType["params"]) => any;

export interface RefQLRows {
  refQLRows: any[];
}

export type TableIdMap<S, T extends OnlyRefProps<S> = OnlyRefProps<S>> = {
  [K in keyof T as T[K]["tableId"]]: T[K]
};

export interface RefInput {
  lRef?: string[];
  rRef?: string[];
  xTable?: string;
  lxRef?: string[];
  rxRef?: string[];
}

export type RefNodeInput = Omit<RefInput, "lxRef" | "rxRef" | "xTable">;

export interface RefInfo {
  parent: Table;
  lRef: RefField[];
  rRef: RefField[];
  as: string;
  xTable?: Table;
  lxRef?: RefField[];
  rxRef?: RefField[];
}

export type ParamsType<S, T extends Selectable<S>[], SQLProps extends OnlySQLProps<S> = OnlySQLProps<S>> = T extends (infer U)[]
  ? (U extends { params: any }
    ? { params: Simplify<U["params"]>}
    : U extends keyof SQLProps
      ? { params: Simplify<SQLProps[U]["params"]> }
      : { params: {}})[]
  : {params: {}};

export type Params<S, T extends Selectable<S>[]> = Simplify<UnionToIntersection<ParamsType<S, T>[number]["params"]>>;

export type InsertParams<S, Props extends OnlyProps<S> = OnlyProps<S>> = Simplify<
  { [K in keyof Props as Props[K]["hasDefaultValue"] extends true ? K : Extract<Props[K]["output"], null> extends never ? never : K]?: Exclude<Props[K]["output"], null> } &
  { [K in keyof Props as Props[K]["hasDefaultValue"] extends false ? (Extract<Props[K]["output"], null> extends never ? K : never) : never]: Props[K]["output"] }
>;

export type UpdateParams<S, Props extends OnlyProps<S> = OnlyProps<S>> = Simplify<
  { [K in keyof Props]?: Props[K]["output"] }
>;

export type ShouldSelectAll<S, T extends Selectable<S>[]> =
  Extract<T[number], keyof OnlyPropsOrSQLProps<S> | OnlyWithEmptyOperations<S>[keyof OnlyWithEmptyOperations<S>]>[] extends never[] ? true : false;

export type ExtractOmittedPropsMap<S, T extends Selectable<S>[]> =
  { [K in T[number] as K extends Prop<infer Key, any, any, true> ? Key : never]: K extends Prop<any, any, any, true> ? K : never;}
  & { [K in T[number] as K extends SQLProp<infer Key, any, any, true> ? Key : never]: K extends SQLProp<any, any, any, true> ? K : never;};

export type IgnoreOmitted<S, T extends Selectable<S>[], OmitMap = ExtractOmittedPropsMap<S, T>> = T extends (infer U)[]
  ? (U extends keyof OmitMap
      ? never
      : U extends Prop | SQLProp
        ? U["as"] extends keyof OmitMap
          ? never
          : U
        : U)[]
    : never;

export type FinalComponents<Props, Components extends Selectable<Props>[]> = ShouldSelectAll<Props, Components> extends true
  ? [Exclude<keyof OnlyProps<Props>, keyof ExtractOmittedPropsMap<Props, Components>>, ...IgnoreOmitted<Props, Components>]
  : IgnoreOmitted<Props, Components>;

export type Output<
  S,
  T extends Selectable<S>[],
  Props extends OnlyPropsOrSQLProps<S> = OnlyPropsOrSQLProps<S>,
  TableIds extends TableIdMap<S> = TableIdMap<S>
> = FinalComponents<S, T> extends (infer U)[]
  ? U extends keyof Props
    ? {as: U; type: Props[U]["output"]}

      : U extends Prop | SQLProp
        ? { as: U["as"]; type: U["output"] }

      : U extends RQLTag<infer TableId, any, infer Output>
        ? TableIds[TableId] extends RefProp<infer As, any, infer RelType, infer IsNullable>
          ? {
              as: As;
              type: IsNullable extends true
                ? RelType extends "BelongsTo" | "HasOne"
                  ? Output[][0] | null
                  : Output[] | null
                : RelType extends "BelongsTo" | "HasOne"
                  ? Output[][0]
                  : Output[];
          }
          : never

        : U extends Table<infer TableId, infer Props>
          ? TableIds[TableId] extends RefProp<infer As, any, infer RelType, infer IsNullable>
            ? {
                as: As;
                type: IsNullable extends true
                  ? RelType extends "BelongsTo" | "HasOne"
                    ? AllProps<Props>[][0] | null
                    : AllProps<Props>[] | null
                  : RelType extends "BelongsTo" | "HasOne"
                    ? AllProps<Props>[][0]
                    : AllProps<Props>[];
            }
            : never
        : never
  : never;

export type OnlyTableRQLTags<TableId extends string, S, T extends (Insertable<TableId> | Updatable<TableId, S>)[]> =
  Extract<T[number], RQLTag<TableId>>[];

export type CUDOutput<
  TableId extends string,
  S,
  T extends (Insertable<TableId> | Updatable<TableId, S>)[],
  TableRQLTags extends OnlyTableRQLTags<TableId, S, T> = OnlyTableRQLTags<TableId, S, T>,
  FinalOutput = Simplify<UnionToIntersection<TableRQLTags[number]["output"]>>
> = TableRQLTags extends never[]
  ? RQLTag<TableId, {}, AllProps<S>>
  : RQLTag<TableId, {}, FinalOutput>;

export interface InterpretedCUD<Params = any, Output = any> {
  tag: SQLTag<Params, Output>;
  returning?: RQLTag<any, Output>;
}

export type Casing = "PascalCase" | "camelCase" | "snake_case" | "kebap-case";

export interface RefQLOptions {
  querier: Querier;
  runner?: Runner;
  parameterSign?: string;
  indexedParameters?: boolean;
  casing?: Casing;
}

export type RequiredRefQLOptions = Omit<Required<RefQLOptions>, "casing"> & { toCase: (str: string) => string};