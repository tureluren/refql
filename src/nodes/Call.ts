import castAs from "../common/castAs";
import { refqlType } from "../common/consts";
import joinMembers from "../common/joinMembers";
import { CastAs, StringMap } from "../common/types";
import unimplemented from "../common/unimplemented";
import { SQLTag } from "../SQLTag";
import sql from "../SQLTag/sql";
import ASTNode, { astNodePrototype } from "./ASTNode";
import Raw from "./Raw";

interface Call<Params, Output> extends ASTNode<Params, Output>, CastAs {
  name: string;
  nodes: ASTNode<Params, Output>[];
  interpret(): SQLTag<Params, Output>;
}

const type = "refql/Call";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Call,
  caseOf,
  interpret,
  [refqlType]: type
});

function Call<Params, Output>(name: string, nodes: ASTNode<Params, Output>[], as?: string, cast?: string) {
  let call: Call<Params, Output> = Object.create (prototype);

  call.name = name;
  call.nodes = nodes;
  call.as = as;
  call.cast = cast;

  return call;
}

const unsupported = unimplemented ("Call");

function interpret<Params, Output>(this: Call<Params, Output>) {
  const args = [] as (Raw<Params, Output> | SQLTag<Params, Output>)[];

  for (const node of this.nodes) {
    node.caseOf<void> ({
      // Call: (call, name, _as, cast) => {
      //   args.push (sql`
      //     ${Raw (name)} (${call})${Raw (castAs (cast))}
      //   `);
      // },
      // Identifier: (name, _as, cast) => {
      //   args.push (Raw ((_, t) => `${t!.name}.${name}${castAs (cast)}`));
      // },
      Raw: run => {
        args.push (Raw (run));
      },
      // Literal: x => {
      //   args.push (Raw (x));
      // },
      // StringLiteral: x => {
      //   args.push (Raw (`'${x}'`));
      // },
      // Variable: (x, _as, cast) => {
      //   args.push (sql`${x}${Raw (castAs (cast))}`);
      // },
      When: unsupported ("When"),
      // RefNode: unsupported ("RefNode"),
      // BelongsToMany: unsupported ("BelongsToMany"),
      // All: unsupported ("All"),
      Value: unsupported ("Value"),
      Values: unsupported ("Values"),
      Values2D: unsupported ("Values2D")
    });
  }

  return joinMembers (args);
}

function caseOf<Params, Output>(this: Call<Params, Output>, structureMap: StringMap) {
  return structureMap.Call (this.interpret (), this.name, this.as, this.cast);
}

Call.isCall = function <Params, Output> (x: any): x is Call<Params, Output> {
  return x != null && x[refqlType] === type;
};

export default Call;