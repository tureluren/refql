import { createSQLTag, isSQLTag } from ".";
import { isRQLTag } from "../RQLTag";
import { isTable } from "../Table";
import { RequiredRefQLOptions, SQLTagVariable, TagFunctionVariable } from "../common/types";
import withDefaultOptions from "../common/withDefaultOptions";
import Raw from "./Raw";
import SQLNode, { isSQLNode } from "./SQLNode";
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
    } else if (isTable (x)) {
      nodes.push (Raw<Params> (x));
    } else if (isSQLNode<Params> (x)) {
      nodes.push (x);
    } else {
      nodes.push (Value<Params> (x));
    }
  }

  return nodes;
}

const makeSQL = (options: RequiredRefQLOptions) => {
  function sql <Params = {}, Output = unknown>(strings: TemplateStringsArray, ...variables: SQLTagVariable<Params>[]) {
    const nodes = parse<Params, Output> (strings, variables);
    return createSQLTag<Params, Output> (nodes, options);
  }

  return sql;
};

export function sqlP <Params = {}, Output = unknown>(pred: TagFunctionVariable<Params, boolean>) {
  return function (strings: TemplateStringsArray, ...variables: SQLTagVariable<Params>[]) {
    const nodes = parse<Params, Output> (strings, variables);
    const withPred = nodes.map (n => n.setPred (pred));

    return createSQLTag<Params, Output> (withPred, withDefaultOptions ({}));
  };
}

export const sqlX = makeSQL (withDefaultOptions ({}));

export default makeSQL;