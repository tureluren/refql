import SQLTag from ".";
import { ParamF2, RefQLValue, SqlTagParam } from "../common/types";
import { ASTNode, Param, Variable } from "../nodes";
import { isASTNode } from "../nodes/ASTNode";
import Raw from "../Raw";
import Table from "../Table";
import formatTlString from "./formatTLString";

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

const parse = <Input, Output>(strings: TemplateStringsArray, params: SqlTagParam<Input, Output>[]) => {
  const nodes = [] as ASTNode<Input>[];

  for (const idx in strings) {
    const string = strings[idx];
    const param = params[idx];

    if (string) {
      nodes.push (Raw (formatTlString (string)));
    }

    if (!param) {
    } else if (SQLTag.isSQLTag (param)) {
      nodes.push (...param.nodes);
    } else if (isASTNode (param)) {
      nodes.push (param);
      // check ook of alle array elements astnodes zijn
    } else if (Array.isArray (param)) {
      nodes.push (...param);
    } else if (typeof param === "function") {
      nodes.push (Param (param as ParamF2<Input>));
    } else {
      nodes.push (Param (() => param));
    }
  }

  return nodes;
};

const sql = <Input, Output> (strings: TemplateStringsArray, ...params: SqlTagParam<Input, Output>[]) => {
  const nodes = parse (strings, params);
  return SQLTag<Input, Output> (nodes);
};

export default sql;