import castAs from "../common/castAs";
import { refqlType } from "../common/consts";
import joinMembers from "../common/joinMembers";
import { CastAs, StringMap } from "../common/types";
import unimplemented from "../common/unimplemented";
import SQLTag from "../SQLTag";
import sql from "../SQLTag/sql";
import ASTNode, { astNodePrototype } from "./ASTNode";
import Raw from "./Raw";

interface Call<Params> extends ASTNode<Params>, CastAs {
  name: string;
  nodes: ASTNode<Params>[];
  interpret(): SQLTag<Params>;
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

const unsupported = unimplemented ("Call");

function interpret<Params>(this: Call<Params>) {
  const args = [] as (Raw<Params> | SQLTag<Params>)[];

  for (const node of this.nodes) {
    node.caseOf<void> ({
      Call: (call, name, _as, cast) => {
        args.push (sql`
          ${Raw (name)} (${call})${Raw (castAs (cast))}
        `);
      },
      Identifier: (name, _as, cast) => {
        args.push (Raw ((_, t) => `${t!.name}.${name}${castAs (cast)}`));
      },
      Raw: run => {
        args.push (Raw (run));
      },
      Literal: value => {
        args.push (Raw (value));
      },
      StringLiteral: value => {
        args.push (Raw (`'${value}'`));
      },
      Variable: (value, _as, cast) => {
        args.push (sql`${value}${Raw (castAs (cast))}`);
      },
      RefNode: unsupported ("RefNode"),
      BelongsToMany: unsupported ("BelongsToMany"),
      All: unsupported ("All"),
      Value: unsupported ("Value"),
      Values: unsupported ("Values"),
      Values2D: unsupported ("Values2D")
    });
  }

  return joinMembers (args);
}

function caseOf(this: Call<unknown>, structureMap: StringMap) {
  return structureMap.Call (this.interpret (), this.name, this.as, this.cast);
}

Call.isCall = function <Params> (value: any): value is Call<Params> {
  return value != null && value[refqlType] === type;
};

export default Call;