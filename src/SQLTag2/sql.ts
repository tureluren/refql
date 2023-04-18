import SQLTag2 from ".";
import { Boxes } from "../common/BoxRegistry";
import { SQLTagVariable } from "../common/types";
import { ASTNode, Raw, Value } from "../nodes";
import { isASTNode } from "../nodes/ASTNode";
import RQLTag from "../RQLTag";
import Table from "../Table";

export function parse<Params, Output, T extends Table, Box extends Boxes>(strings: TemplateStringsArray, variables: SQLTagVariable<Params, Output, Boxes>[]) {
  const nodes = [] as ASTNode<Params, Output, Box>[];

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
        nodes.push (Raw<Params, Output, Box> (string));
      }
    }

    if (!x) {
    } else if (SQLTag2.isSQLTag<Params, Output, T, Box> (x)) {
      nodes.push (...x.nodes);
    } else if (RQLTag.isRQLTag (x)) {
      throw new Error ("U can't use RQLTags inside SQLTags");
    } else if (Table.isTable (x)) {
      nodes.push (Raw<Params, Output, Box> (x));
    } else if (isASTNode<Params, Output, Box> (x)) {
      nodes.push (x);
    } else {
      nodes.push (Value<Params, Output, Box> (x));
    }
  }

  return nodes;
}

function sql <Params = unknown, Output = unknown, T extends Table = any, Box extends Boxes = "Promise">(strings: TemplateStringsArray, ...variables: SQLTagVariable<Params, Output, Box>[]) {
  const nodes = parse<Params, Output, T, Box> (strings, variables);
  return SQLTag2 (nodes);
}

export default sql;