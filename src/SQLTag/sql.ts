import { createSQLTag, isSQLTag } from ".";
import { SQLNode, SQLTagVariable } from "../common/types";
import { isRQLTag } from "../RQLTag";
import Table from "../Table";
import isSQLNode from "./isSQLNode";
import Raw from "./Raw";
import Value from "./Value";

export function parse<Params, Output>(strings: TemplateStringsArray, variables: SQLTagVariable<Params>[]) {
  const nodes = [] as SQLNode<Params>[];

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
        nodes.push (Raw<Params> (string));
      }
    }

    if (!x) {
    } else if (isSQLTag<Params, Output> (x)) {
      nodes.push (...x.nodes);
    } else if (isRQLTag (x)) {
      throw new Error ("U can't use RQLTags inside SQLTags");
    } else if (Table.isTable (x)) {
      nodes.push (Raw<Params> (x));
    } else if (isSQLNode<Params> (x)) {
      nodes.push (x);
    } else {
      nodes.push (Value<Params> (x));
    }
  }

  return nodes;
}

function sql <Params = unknown, Output = unknown>(strings: TemplateStringsArray, ...variables: SQLTagVariable<Params>[]) {
  const nodes = parse<Params, Output> (strings, variables);
  return createSQLTag<Params, Output> (nodes);
}

export default sql;