import SQLTag from ".";
import { SQLTagVariable } from "../common/types";
import { ASTNode, Raw, Value } from "../nodes";
import { isASTNode } from "../nodes/ASTNode";
import formatTlString from "./formatTLString";

const parse = <Params, InRQL extends boolean>(strings: TemplateStringsArray, variables: SQLTagVariable<Params, InRQL>[]) => {
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

const sql = <Params, InRQL extends boolean = false> (strings: TemplateStringsArray, ...variables: SQLTagVariable<Params, InRQL>[]) => {
  const nodes = parse (strings, variables);
  return SQLTag<Params, InRQL> (nodes);
};

export default sql;