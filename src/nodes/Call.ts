import { refqlType } from "../common/consts";
import { CastAs, StringMap, TagFunctionVariable } from "../common/types";
import { castAs } from "../Interpreter/sqlBuilders";
import Table from "../Table";
import ASTNode, { astNodePrototype } from "./ASTNode";

export interface InterpretedCall<Params> {
  params: TagFunctionVariable<Params>[];
  stringF: TagFunctionVariable<Params>[];
}

interface Call<Params> extends ASTNode<Params>, CastAs {
  name: string;
  nodes: ASTNode<Params>[];
  interpret(): InterpretedCall<Params>;
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

function interpret(this: Call<unknown>): InterpretedCall<unknown> {
  const params = [] as ((p: unknown, t?: Table) => any)[];
  const strings = [] as ((p: unknown, idx: number, t?: Table) => [string, number])[];

  for (const node of this.nodes) {
    node.caseOf<unknown> ({
      Call: call => {
        strings.push (call);
      },
      Identifier: (name, _as, cast) => {
        strings.push ((_, t) => castAs (`${t.name}.${name}`, undefined, cast));
      },
      Raw: run => {
        strings.push (run);
      }
    });
  }

  const compile = (p, t) => {

    return castAs (`${this.name} (${strings.map (c => c (p, t)).join (", ")})`, this.as, this.cast);
  };

  return compile;
}

function caseOf(this: Call<unknown>, structureMap: StringMap) {
  return structureMap.Call (this.interpret ());
}

Call.isCall = function <Params> (value: any): value is Call<Params> {
  return value != null && value[refqlType] === type;
};

export default Call;