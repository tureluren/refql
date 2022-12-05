import SQLTag from ".";
import { TagFunctionVariable, RefQLValue, SQLTagVariable } from "../common/types";
import { ASTNode, Value, Variable } from "../nodes";
import { isASTNode } from "../nodes/ASTNode";
import Raw from "../Raw";
import Table from "../Table";
import formatTlString from "./formatTLString";

// export type SQLTagVariable<Params, Output> =
//   | SQLTag<Params, Output>
//   | Raw
//   // unknown ?
//   | TagFunctionVariable<Params>
//   | In<unknown>
//   | Table
//   | Raw
//   | BuiltIn;
// of astnode

const parse = <Params, Output>(strings: TemplateStringsArray, variables: SQLTagVariable<Params, Output>[]) => {
  const nodes = [] as ASTNode<Params>[];

  for (const idx in strings) {
    const string = strings[idx];
    const variable = variables[idx];

    if (string.trim ()) {
      nodes.push (Raw (formatTlString (string)));
    }

    if (!variable) {
    } else if (SQLTag.isSQLTag (variable)) {
      nodes.push (...variable.nodes);
    } else if (isASTNode (variable)) {
      nodes.push (variable);
      // check ook of alle array elements astnodes zijn
    } else if (Array.isArray (variable)) {
      nodes.push (...variable);
    } else {
      nodes.push (Value (variable));
    }
  }

  return nodes;
};

const sql = <Params, Output> (strings: TemplateStringsArray, ...variables: SQLTagVariable<Params, Output>[]) => {
  const nodes = parse (strings, variables);
  return SQLTag<Params, Output> (nodes);
};

export default sql;