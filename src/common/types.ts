import Prop from "../Prop";
import PropType from "../Prop/PropType";
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
  | StringMap
  | Symbol;

export type OrdOperator = ">" | "<" | ">=" | "<=";

export type LogicOperator = "and" | "or";

export type RelType = "BelongsTo" | "HasMany" | "HasOne" | "BelongsToMany";

// { id: string } & { name: string } becomes { id: string, name: string }
// any & {} = {}
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
  Only<T, Prop<any, any, any, any, any, any, false>>;

export type AllProps<S> =
  Simplify<{ [K in OnlyProps<S>[keyof OnlyProps<S>] as K["as"]]: K["output"] }>;

export type TagFunctionVariable<Params, Output = ValueType> =
  (params: Params) => Output;

export type SQLTagVariable<Params> =
  | SQLNode<Params>
  | TagFunctionVariable<Params>
  | ValueType;

export type Pagination = Limit | Offset;

export type Selectable<TableId extends string, T> =
  | keyof OnlyPropsOrSQLProps<T>
  | Prop<TableId>
  | SQLProp
  | RQLTag<OnlyRefProps<T>[keyof OnlyRefProps<T>]["tableId"]>
  | Table<OnlyRefProps<T>[keyof OnlyRefProps<T>]["tableId"]>
  | Pagination
  | SQLTag;

export type Insertable<TableId extends string> =
  | RQLTag<TableId>;

export type Updatable<TableId extends string> =
  | Prop<TableId>
  | SQLProp
  | RQLTag<TableId>
  | SQLTag;

export type Deletable<TableId extends string> =
  | Prop<TableId>
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

export type ParamsType<TableId extends string, S, T extends Selectable<TableId, S>[], SQLProps extends OnlySQLProps<S> = OnlySQLProps<S>> = T extends (infer U)[]
  ? (U extends { params: any }
    ? { params: Simplify<U["params"]>}
    : U extends keyof SQLProps
      ? { params: Simplify<SQLProps[U]["params"]> }
      : { params: {}})[]
  : {params: {}};

export type RQLParams<TableId extends string, S, T extends Selectable<TableId, S>[]> = Simplify<UnionToIntersection<ParamsType<TableId, S, T>[number]["params"]>>;

export type InsertParams<S, Props extends OnlyProps<S> = OnlyProps<S>> = Simplify<
  { [K in keyof Props as Props[K]["hasDefaultValue"] extends true ? K : Extract<Props[K]["output"], null> extends never ? never : K]?: Exclude<Props[K]["output"], null> } &
  { [K in keyof Props as Props[K]["hasDefaultValue"] extends false ? (Extract<Props[K]["output"], null> extends never ? K : never) : never]: Props[K]["output"] }
>;

export type UpdateParams<S, Props extends OnlyProps<S> = OnlyProps<S>> = Simplify<
  { [K in keyof Props]?: Props[K]["output"] }
>;

export type ShouldSelectAll<TableId extends string, S, T extends Selectable<TableId, S>[]> =
  Extract<T[number], keyof OnlyProps<S> | OnlyWithEmptyOperations<S>[keyof OnlyWithEmptyOperations<S>]>[] extends never[] ? true : false;

export type ExtractOmittedPropsMap<TableId extends string, S, T extends Selectable<TableId, S>[]> =
  { [K in T[number] as K extends Prop<any, infer Key, any, any, true> ? Key : never]: K extends Prop<any, any, any, any, true> ? K : never;}
  & { [K in T[number] as K extends SQLProp<infer Key, any, any, true> ? Key : never]: K extends SQLProp<any, any, any, true> ? K : never;};

export type IgnoreOmitted<TableId extends string, S, T extends Selectable<TableId, S>[], OmitMap = ExtractOmittedPropsMap<TableId, S, T>> = T extends (infer U)[]
  ? (U extends keyof OmitMap
      ? never
      : U extends Prop | SQLProp
        ? U["as"] extends keyof OmitMap
          ? never
          : U
        : U)[]
    : never;

export type FinalComponents<TableId extends string, Props, Components extends Selectable<TableId, Props>[]> = ShouldSelectAll<TableId, Props, Components> extends true
  ? [Exclude<keyof OnlyProps<Props>, keyof ExtractOmittedPropsMap<TableId, Props, Components>>, ...IgnoreOmitted<TableId, Props, Components>]
  : IgnoreOmitted<TableId, Props, Components>;

type TypesWithAs<Union, Key extends string> =
  Union extends { as: Key; type: infer T } ? T : never;

type IsNullableForAs<Union, Key extends string> =
  Extract<Union, { as: Key }> extends infer Entries
    ? Entries extends { nullable: true } ? true : false
    : false;

// We need to avoid using UnionToIntersection on primitives and fallback to U directly (as a union) if intersection doesn't make sense.
type UnionIfObject<U> =
  [U] extends [Date]
    ? U
    : [U] extends [object]
      ? Simplify<UnionToIntersection<U>>
      : U;

/**
 * Converts a union of `{ as, type, nullable }` entries into a flat object type,
 * where each key corresponds to the `as` value and its value is the associated `type`.
 *
 * - If multiple entries share the same `as` key, their `type`s are merged:
 *   - If all `type`s are object types, they're combined into an intersection.
 *   - If any `type`s are primitives or incompatible, they remain a union.
 *
 * - If any entry for a given `as` has `nullable: true`, the final type includes `null`.
 *
 * Example input union:
 *   | { as: "id", type: number, nullable: false }
 *   | { as: "team", type: { name: string }, nullable: true }
 *
 * Resulting output:
 *   {
 *     id: number;
 *     team: { name: string } | null;
 *   }
 */
type MergeByAsWithNullability<Union extends { as: string; type: any; nullable: boolean }> = Simplify<{
  [K in Union["as"]]: IsNullableForAs<Union, K> extends true
    ? UnionIfObject<TypesWithAs<Union, K>> | null
    : UnionIfObject<TypesWithAs<Union, K>>;
}>;

export type RQLOutput<
  TableId extends string,
  S,
  T extends Selectable<TableId, S>[],
  Props extends OnlyPropsOrSQLProps<S> = OnlyPropsOrSQLProps<S>,
  TableIds extends TableIdMap<S> = TableIdMap<S>
> = MergeByAsWithNullability<
  FinalComponents<TableId, S, T>[number] extends infer U
    ? U extends keyof Props
      ? U extends string
        ? { as: U; type: Props[U]["output"]; nullable: false }
        : never
      : U extends Prop | SQLProp
        ? { as: U["as"]; type: U["output"]; nullable: false }

      : U extends RQLTag<infer RefTableId>
        ? TableIds[RefTableId] extends RefProp<
            infer As, any, infer RelType, infer IsNullable
          >
          ? As extends string
            ? {
                as: As;
                type: RelType extends "BelongsTo" | "HasOne"
                  ? U["output"]
                  : U["output"][];
                nullable: IsNullable;
              }
            : never
          : never

      : U extends Table<infer RefTableId, infer RefProps>
        ? TableIds[RefTableId] extends RefProp<
            infer As, any, infer RelType, infer IsNullable
          >
          ? As extends string
            ? {
                as: As;
                type: RelType extends "BelongsTo" | "HasOne"
                  ? AllProps<RefProps>
                  : AllProps<RefProps>[];
                nullable: IsNullable;
              }
            : never
          : never

      : never
    : never
>;


export type OnlyTableRQLTags<TableId extends string, T extends (Insertable<TableId> | Updatable<TableId>)[]> =
  Extract<T[number], RQLTag<TableId>>[];

export type CUDOutput<
  TableId extends string,
  S,
  T extends (Insertable<TableId> | Updatable<TableId>)[],
  TableRQLTags extends OnlyTableRQLTags<TableId, T> = OnlyTableRQLTags<TableId, T>
> = TableRQLTags extends never[]
  ? RQLOutput<TableId, S, T>
  : Simplify<UnionToIntersection<TableRQLTags[number]["output"]>>;

export interface InterpretedCUD<Params = any, Output = any> {
  tag: SQLTag<Params, Output>;
  returning?: RQLTag<any, any, any, any, Output>;
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

export type PropMap<TableId extends string, Props extends PropType<any>[]> = {
  [P in Props[number] as P["as"] ]:
    P extends Prop
      ? Prop<TableId, P["as"], P["output"], P["params"], P["isOmitted"], P["hasDefaultValue"], P["hasOp"]>
      : P extends SQLProp
        ? SQLProp<P["as"], P["output"], P["params"], P["isOmitted"], P["hasOp"]>
        : P
};