import SQLTag from "./index.ts";
import { Boxes } from "../common/BoxRegistry.ts";
import { SQLTagVariable } from "../common/types.ts";
import { ASTNode, Raw, Value } from "../nodes/index.ts";
import { isASTNode } from "../nodes/ASTNode.ts";
import RQLTag from "../RQLTag/index.ts";
import Table from "../Table/index.ts";

export function parse<Params, Output, Box extends Boxes>(strings: TemplateStringsArray, variables: SQLTagVariable<Params, Output, Boxes>[]) {
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
    } else if (SQLTag.isSQLTag<Params, Output, Box> (x)) {
      nodes.push (...x.nodes);
    } else if (RQLTag.isRQLTag (x)) {
      throw new Error ("U can't use RQLTags inside SQLTags");
    } else if (Table.isTable (x)) {
      nodes.push (Raw<Params, Output, Box> (x.name));
    } else if (isASTNode<Params, Output, Box> (x)) {
      nodes.push (x);
    } else {
      nodes.push (Value<Params, Output, Box> (x));
    }
  }

  return nodes;
}

function sql <Params = unknown, Output = unknown, Box extends Boxes = "Promise">(strings: TemplateStringsArray, ...variables: SQLTagVariable<Params, Output, Box>[]) {
  const nodes = parse<Params, Output, Box> (strings, variables);
  return SQLTag (nodes);
}

export default sql;