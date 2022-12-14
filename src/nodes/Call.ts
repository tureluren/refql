import { refqlType } from "../common/consts";
import { CastAs, StringMap, TagFunctionVariable } from "../common/types";
import { castAs } from "../Interpreter/sqlBuilders";
import Raw from "../Raw";
import SQLTag from "../SQLTag";
import sql from "../SQLTag/sql";
import Table from "../Table";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface Call<Params> extends ASTNode<Params>, CastAs {
  name: string;
  nodes: ASTNode<Params>[];
  interpret(): SQLTag<Params, unknown>;
}

const type = "refql/Call";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Call,
  caseOf,
  interpret,
  [refqlType]: type
});

function Call<Params>(name: string, nodes: ASTNode<Params>[], as?: string, cast?: string) {
  let call: Call<Params> = Object.create (prototype);

  call.name = name;
  call.nodes = nodes;
  call.as = as;
  call.cast = cast;

  return call;
}

function interpret(this: Call<unknown>): SQLTag<unknown, unknown> {
  const args = [] as any[];

  for (const node of this.nodes) {
    node.caseOf<unknown> ({
      Call: (call, name, _as, cast) => {
        args.push (sql`
          ${Raw (name)} (${call}) ${Raw (cast ? `::${cast}` : "")}
        `);
      },
      Identifier: (name, _as, cast) => {
        args.push (Raw ((_, t) => castAs (`${t.name}.${name}`, undefined, cast)));
      },
      Raw: run => {
       args.push (Raw (run));
      },
      StringLiteral: value => {
        args.push (Raw (`'${value}'`));
      }
    });
  }

  return args.reduce ((tag, arg, idx) => {
    return tag.concat (sql`
      ${Raw (idx ? ", " : "")}${arg} 
    `);
  }, SQLTag.empty ());
}

function caseOf(this: Call<unknown>, structureMap: StringMap) {
  return structureMap.Call (this.interpret (), this.name, this.as, this.cast);
}

Call.isCall = function <Params> (value: any): value is Call<Params> {
  return value != null && value[refqlType] === type;
};

export default Call;