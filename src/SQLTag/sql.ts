import SQLTag from ".";
import { RefQLValue, SqlTagParam } from "../common/types";
import { Variable } from "../nodes";
import Raw from "../Raw";
import Table from "../Table";
import formatSQLString from "./formatSQLString";

// export type SqlTagParam<Input, Output> =
//   | SQLTag<Input, Output>
//   | Raw
//   // unknown ?
//   | ParamF2<Input>
//   | In<unknown>
//   | Select
//   | Insert
//   | Update
//   | Table
//   | Raw
//   | BuiltIn;
// of astnode

// const parse = <Input, Output>(strings: TemplateStringsArray, ...params: SqlTagParam<Input, Output>[]) => AstNode<Input>[] {
const parse = <Input, Output>(strings: TemplateStringsArray, ...params: SqlTagParam<Input, Output>[]): any[] => {
  // const nodes = [] as AstNode<Input>[];
  const nodes = [] as any[];

  for (const idx in strings) {
    const string = strings[idx];
    const param = params[idx];

    nodes.push ({ type: "string", value: string });

    if (!param) {
    } else if (Table.isTable (param)) {

    } else if (SQLTag.isSQLTag (param)) {
      nodes.push (...param.nodes);
    } else if (Raw.isRaw (param)) {
      nodes.push ({ type: "string", value: param.toString () });
    } else if (Array.isArray (param)) {
      nodes.push (...param);
    } else if (typeof param === "function") {
      nodes.push ({ type: "computed", value: param });
    } else {
      nodes.push ({ type: "built-in", value: param });
    }
  }

  return nodes;
};

const sql = <Input, Output> (strings: TemplateStringsArray, ...values: SqlTagParam<Input, Output>[]) => {
  console.log (strings);
  return SQLTag<Input, Output> (strings
    .map (formatSQLString)
    .map ((s, idx) =>
      values[idx] ? [s, Variable (values[idx])] : s)

    .flat (1)
    .filter (s => s !== ""));
};

export default sql;