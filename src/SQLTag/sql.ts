import SQLTag from ".";
import { SQLTagVariable } from "../common/types";
import { ASTNode, Raw, Value } from "../nodes";
import { isASTNode } from "../nodes/ASTNode";
import RQLTag from "../RQLTag";
import Table from "../Table";

const parse = <Params, InRQL extends boolean>(strings: TemplateStringsArray, variables: SQLTagVariable<Params, InRQL>[]) => {
  const nodes = [] as ASTNode<Params>[];

  for (let [idx, string] of strings.entries ()) {
    const variable = variables[idx];

    if (string) {
      string = string
        .replace (/\n/g, "")
        .replace (/\s+/g, " ");

      if (idx === 0) {
        string = string.trimStart ();
      }

      if (idx === strings.length - 1) {
        string = string.trimEnd ();
      }

      if (string) {
        nodes.push (Raw (string));
      }
    }

    if (!variable) {
    } else if (SQLTag.isSQLTag (variable)) {
      nodes.push (...variable.nodes);
    } else if (RQLTag.isRQLTag (variable)) {
      throw new Error ("U can't use RQLTags inside SQLTags");
    } else if (Table.isTable (variable)) {
      nodes.push (Raw (variable.name));
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