import { createSQLTag2, isSQLTag } from ".";
import { SQLTagVariable } from "../common/types";
import { ASTNode, Raw, Value } from "../nodes";
import { isASTNode } from "../nodes/ASTNode";
import { isRQLTag } from "../RQLTag";
import Table from "../Table";

export function parse<Params, Output>(strings: TemplateStringsArray, variables: SQLTagVariable<Params, Output>[]) {
  const nodes = [] as ASTNode<Params, Output>[];

  for (let [idx, string] of strings.entries ()) {
    const x = variables[idx];

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
        nodes.push (Raw<Params, Output> (string));
      }
    }

    if (!x) {
    } else if (isSQLTag<Params, Output> (x)) {
      nodes.push (...x.nodes);
    } else if (isRQLTag (x)) {
      throw new Error ("U can't use RQLTags inside SQLTags");
    } else if (Table.isTable (x)) {
      nodes.push (Raw<Params, Output> (x));
    } else if (isASTNode<Params, Output> (x)) {
      nodes.push (x);
    } else {
      nodes.push (Value<Params, Output> (x));
    }
  }

  return nodes;
}

function sql <Params = unknown, Output = unknown>(strings: TemplateStringsArray, ...variables: SQLTagVariable<Params, Output>[]) {
  const nodes = parse<Params, Output> (strings, variables);
  return createSQLTag2 (nodes);
}

export default sql;