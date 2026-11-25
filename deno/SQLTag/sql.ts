import { createSQLTag, isSQLTag } from "./index.ts";
import { isRQLTag } from "../RQLTag/index.ts";
import { isTable } from "../Table/index.ts";
import { RequiredRefQLOptions, SQLTagVariable } from "../common/types.ts";
import withDefaultOptions from "../common/withDefaultOptions.ts";
import Raw from "./Raw.ts";
import SQLNode, { isSQLNode } from "./SQLNode.ts";
import Value from "./Value.ts";

export function parse<Params>(strings: TemplateStringsArray, variables: SQLTagVariable<Params>[]) {
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
        nodes.push (Raw (string));
      }
    }

    if (!x) {
    } else if (isSQLTag (x)) {
      nodes.push (...x.nodes);
    } else if (isRQLTag (x)) {
      throw new Error ("U can't use RQLTags inside SQLTags");
    } else if (isTable (x)) {
      nodes.push (Raw<Params> (x));
    } else if (isSQLNode (x)) {
      nodes.push (x);
    } else {
      nodes.push (Value (x));
    }
  }

  return nodes;
}

const makeSQL = (options: RequiredRefQLOptions) => {
  function sql <Params = {}, Output = unknown>(strings: TemplateStringsArray, ...variables: SQLTagVariable<Params>[]) {
    const nodes = parse<Params> (strings, variables);
    return createSQLTag<Params, Output> (nodes, options);
  }

  return sql;
};

export const sqlX = makeSQL (withDefaultOptions ({}));

export default makeSQL;