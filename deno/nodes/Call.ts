import castAs from "../common/castAs.ts";
import { refqlType } from "../common/consts.ts";
import { Boxes } from "../common/BoxRegistry.ts";
import joinMembers from "../common/joinMembers.ts";
import { CastAs, StringMap } from "../common/types.ts";
import unimplemented from "../common/unimplemented.ts";
import SQLTag from "../SQLTag/index.ts";
import sql from "../SQLTag/sql.ts";
import ASTNode, { astNodePrototype } from "./ASTNode.ts";
import Raw from "./Raw.ts";

interface Call<Params, Output, Box extends Boxes> extends ASTNode<Params, Output, Box>, CastAs {
  name: string;
  nodes: ASTNode<Params, Output, Box>[];
  interpret(): SQLTag<Params, Output, Box>;
}

const type = "refql/Call";

const prototype = Object.assign ({}, astNodePrototype, {
  constructor: Call,
  caseOf,
  interpret,
  [refqlType]: type
});

function Call<Params, Output, Box extends Boxes>(name: string, nodes: ASTNode<Params, Output, Box>[], as?: string, cast?: string) {
  let call: Call<Params, Output, Box> = Object.create (prototype);

  call.name = name;
  call.nodes = nodes;
  call.as = as;
  call.cast = cast;

  return call;
}

const unsupported = unimplemented ("Call");

function interpret<Params, Output, Box extends Boxes>(this: Call<Params, Output, Box>) {
  const args = [] as (Raw<Params, Output, Box> | SQLTag<Params, Output, Box>)[];

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
      Literal: x => {
        args.push (Raw (x));
      },
      StringLiteral: x => {
        args.push (Raw (`'${x}'`));
      },
      Variable: (x, _as, cast) => {
        args.push (sql`${x}${Raw (castAs (cast))}`);
      },
      When: unsupported ("When"),
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

function caseOf<Params, Output, Box extends Boxes>(this: Call<Params, Output, Box>, structureMap: StringMap) {
  return structureMap.Call (this.interpret (), this.name, this.as, this.cast);
}

Call.isCall = function <Params, Output, Box extends Boxes> (x: any): x is Call<Params, Output, Box> {
  return x != null && x[refqlType] === type;
};

export default Call;