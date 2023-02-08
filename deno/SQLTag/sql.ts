import SQLTag from "./index.ts";
import { Querier, SQLTagVariable } from "../common/types.ts";
import { ASTNode, Raw, Value } from "../nodes/index.ts";
import { isASTNode } from "../nodes/ASTNode.ts";
import RQLTag from "../RQLTag/index.ts";
import Table from "../Table/index.ts";

const parse = <Params, Output>(strings: TemplateStringsArray, variables: SQLTagVariable<Params, Output>[]) => {
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
        nodes.push (Raw (string));
      }
    }

    if (!x) {
    } else if (SQLTag.isSQLTag<Params, Output> (x)) {
      nodes.push (...x.nodes);
    } else if (RQLTag.isRQLTag (x)) {
      throw new Error ("U can't use RQLTags inside SQLTags");
    } else if (Table.isTable (x)) {
      nodes.push (Raw (x.name));
    } else if (isASTNode<Params, Output> (x)) {
      nodes.push (x);
    } else {
      nodes.push (Value (x));
    }
  }

  return nodes;
};

const sql = <Params = unknown, Output = unknown> (strings: TemplateStringsArray, ...variables: SQLTagVariable<Params, Output>[]) => {
  const nodes = parse (strings, variables);
  return SQLTag<Params, Output> (nodes);
};

export const createSQLWithDefaultQuerier = (defaultQuerier: Querier) => {
  return <Params = unknown, Output = unknown> (strings: TemplateStringsArray, ...variables: SQLTagVariable<Params, Output>[]) => {
    const nodes = parse (strings, variables);
    return SQLTag<Params, Output> (nodes, defaultQuerier);
  };
};

export default sql;