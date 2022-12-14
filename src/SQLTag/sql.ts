import SQLTag from ".";
import { SQLTagVariable } from "../common/types";
import { ASTNode, Value } from "../nodes";
import { isASTNode } from "../nodes/ASTNode";
import Raw from "../Raw";
import formatTlString from "./formatTLString";

const parse = <Params, Output, InRQL extends boolean = false>(strings: TemplateStringsArray, variables: SQLTagVariable<Params, Output, InRQL>[]) => {
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
    } else {
      nodes.push (Value (variable));
    }
  }

  return nodes;
};

const sql = <Params, Output, InRQL extends boolean = false> (strings: TemplateStringsArray, ...variables: SQLTagVariable<Params, Output, InRQL>[]) => {
  const nodes = parse (strings, variables);
  return SQLTag<Params, Output, InRQL> (nodes);
};

export default sql;