// import JBOInterpreter from "../JBOInterpreter";
// import Interpreter from "../Interpreter";
// import Parser from "../Parser";
// import isRel from "../Rel/isRel";
// import isSub from "../Sub/isSub";
import Interpreter from "../Interpreter";
import { BelongsTo, Call, HasMany, ManyToMany, Root, Variable } from "../Parser/nodes";
import SqlTag from "../SqlTag";
import {
  AstNode, Rec, InterpretF, JsonBuildObject,
  RefQLConfig, RQLValue, Dict, Querier, TableNode
} from "../types";
import aggregate from "./aggregate";

class RqlTag <Params> {
  ast: AstNode<Params>;

  constructor(ast: AstNode<Params>) {
    this.ast = ast;
  }

  concat<Params2>(other: RqlTag<Params2> | SqlTag<Params2>): RqlTag<Params & Params2> {

    // only nodes with members
    if (!(
      this.ast instanceof Root ||
      this.ast instanceof HasMany ||
      this.ast instanceof BelongsTo ||
      this.ast instanceof ManyToMany ||
      this.ast instanceof Call
    )) {
      return this;
    }

    const newMember = other instanceof RqlTag
      ? other.ast
      : Variable.of (other);

    const members = (this.ast.members as AstNode<Params & Params2>[])
      .concat (newMember);

    return new RqlTag<Params & Params2> (
      Object.assign (Object.create (this.ast.constructor.prototype), this.ast, { members })
    );
  }

  map(fn: (ast: AstNode<Params>) => AstNode<Params>) {
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

  static of<Params>(ast: AstNode<Params>) {
    return new RqlTag<Params> (ast);
  }
}

export default RqlTag;