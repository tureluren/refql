// import JBOInterpreter from "../JBOInterpreter";
// import Interpreter from "../Interpreter";
// import Parser from "../Parser";
// import isRel from "../Rel/isRel";
// import isSub from "../Sub/isSub";
import Interpreter from "../Interpreter";
import { Root } from "../Parser/nodes";
import SqlTag from "../SqlTag";
import {
  AstNode, Rec, InterpretF, JsonBuildObject,
  RefQLConfig, RQLValue, Dict, Querier, KeywordNode, MembersNode
} from "../types";
import aggregate from "./aggregate";

class RqlTag <Params> {
  ast: KeywordNode<Params>;

  constructor(ast: KeywordNode<Params>) {
    this.ast = ast;
  }

  concat<Params2>(other: RqlTag<Params2> | SqlTag<Params2>): RqlTag<Params & Params2> {

    // of has many of manytomany
    if (!(this.ast instanceof Root)) {
      return this;
    }
    // const newMember: AstNode = other instanceof RqlTag
    //   ? other.ast
    //   : { type: "Variable", value: other };

    // const members = this.ast.members.concat (newMember);

    const members = this.ast.members;

    return new RqlTag<Params & Params2> (
      Object.assign ({}, this.ast, { members })
    );
  }

  map(fn: (ast: KeywordNode<Params>) => KeywordNode<Params>) {
    return new RqlTag<Params> (fn (this.ast));
  }

  run<Output>(config: RefQLConfig, querier: Querier<Output>, params: Params): Promise<Output[]> {
    if (!(this.ast instanceof Root)) {
      throw new Error ("No Root");
    }

    if (!this.ast.hasOwnProperty ("table")) {
      throw new Error ("No Table");
    }

    const interpret = Interpreter (config.caseType, params);

    return aggregate<Params> (querier, interpret, this.ast);
  }

  compile() {
    return {} as Rec<Params>;
  }
}

export default RqlTag;