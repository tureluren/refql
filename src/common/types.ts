import { ASTNode } from "../nodes";
import RefNode from "../nodes/RefNode";
import RefField from "../RefField";
import RQLTag from "../RQLTag";
import SQLTag from "../SQLTag";
import Table from "../Table";
import { Kind, Boxes } from "./BoxRegistry";

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

export interface CastAs {
  as?: string;
  cast?: string;
}

export interface RefInfo<Box extends Boxes> {
  parent: Table<Box>;
  as: string;
  lRef: RefField;
  rRef: RefField;
  xTable?: Table<Box>;
  lxRef?: RefField;
  rxRef?: RefField;
}

export interface RefInput {
  as?: string;
  lRef?: string;
  rRef?: string;
  xTable?: string;
  lxRef?: string;
  rxRef?: string;
}

export type TagFunctionVariable<Params, Box extends Boxes, Return = ValueType> =
  (params: Params, table?: Table<Box>) => Return;

export type SQLTagVariable<Params, Output, Box extends Boxes> =
  | SQLTag<Params, Output, Box>
  | ASTNode<Params, Output, Box>
  | Table<Box>
  | TagFunctionVariable<Params, Box>
  | ValueType;

export type RQLTagVariable<Params, Output, Box extends Boxes> =
  | RQLTag<Params, Output, Box>
  | SQLTag<Params, Output, Box>
  | ASTNode<Params, Output, Box>
  | ASTNode<Params, Output, Box>[]
  | Table<Box>
  | TagFunctionVariable<Params, Box>
  | ValueType;

export interface RefQLRows {
  refQLRows: any[];
}

export type RefMaker<Box extends Boxes> =
  <Params, Output>(parent: Table<Box>, tag: RQLTag<Params, Output, Box>, as?: string, single?: boolean) => RefNode<Params, Output, Box>;

export type ConvertPromise<F extends Boxes, A = unknown> = (p: Promise<A>) => Kind<F, A>;

export type Runnable<Params, Output> =
  Params extends Record<string, never>
    ? (params?: Params, querier?: Querier) => Output
    : Params extends StringMap
      ? (params: Params, querier?: Querier) => Output
      : (params?: Params, querier?: Querier) => Output;

export type Runnable2<Output> =
  <Params>(params: Params, querier?: Querier) => Output;

export type RQLTagMaker<Box extends Boxes> =
  <Params = unknown, Output = unknown>(strings: TemplateStringsArray, ...variables: RQLTagVariable<Params, Output, Box>[]) => RQLTag<Params, Output, Box> & Runnable<Params, ReturnType<ConvertPromise<Box, Output>>>;

export type Ref<Box extends Boxes> = [
  Table<Box> & RQLTagMaker<Box>,
  RefMaker<Box>
];