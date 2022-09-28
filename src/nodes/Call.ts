import { CastAs, StringMap } from "../common/types";
import ASTNode, { astNodePrototype } from "./ASTNode";

interface Call<Params> extends ASTNode<Params>, CastAs {
  name: string;
  members: ASTNode<Params>[];
  addMember<Params2>(node: ASTNode<Params2>): Call<Params & Params2>;
}

const callPrototype = {
  constructor: Call,
  addMember,
  caseOf
};

function Call<Params>(name: string, members: ASTNode<Params>[], as?: string, cast?: string) {
  let call: Call<Params> = Object.create (
    Object.assign ({}, astNodePrototype, callPrototype)
  );

  call.name = name;
  call.members = members;
  call.as = as;
  call.cast = cast;

  return call;
}

function addMember(this: Call<unknown>, node: ASTNode<unknown>) {
  return Call (
    this.name, this.members.concat (node), this.as, this.cast
  );
}

function caseOf(this: Call<unknown>, structureMap: StringMap) {
  return structureMap.Call (this.name, this.members, this.as, this.cast);
}

export default Call;