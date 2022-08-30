// import JBOInterpreter from "../JBOInterpreter";
// import Interpreter from "../Interpreter";
// import Parser from "../Parser";
// import isRel from "../Rel/isRel";
// import isSub from "../Sub/isSub";
import Env from "../Env";
import Interpreter from "../Interpreter";
import { BelongsTo, HasMany, ManyToMany, Root } from "../Parser/nodes";
import SqlTag from "../SqlTag";
import {
  AstNode, Rec, JsonBuildObject,
  RefQLConfig, RQLValue, Dict, Querier, KeywordsNode, MembersNode
} from "../types";
import createEnv from "../Env/createEnv";


const makeGo = <Input, Output>(querier: Querier, interpret: (exp: AstNode<Input, true | false>, env: Env<Input>, rows?: any[]) => Rec<Input>) => (compiledQuery: Rec<Input>) => {
  const go = (compiled: Rec<Input>): Promise<Output[]> => {
    console.log (compiled);
    return querier (compiled.query, compiled.values).then (rows => {
      const nextNext = compiled.next.map (c => {

        const rec = interpret (c.node, createEnv<Input> (compiled.table, c.refs), rows);

        return go (rec);

      });
      return Promise.all (
        nextNext
      ).then (aggs => {
        return rows.map (row => {
          return aggs.reduce ((acc, agg, idx) => {
            const { node, refs } = compiled.next[idx];

            const lrefs = refs.lrefs.map (lr => lr.as);
            const rrefs = refs.rrefs.map (rr => rr.as);
            const lxrefs = refs.lxrefs.map (lxr => lxr.as);

            if (node instanceof BelongsTo) {
              acc[node.table.as || node.table.name] = agg.find ((r: any) =>
                rrefs.reduce ((acc, rr, idx) => acc && (r[rr] === row[lrefs[idx]]), true as boolean)
              );

              lrefs.forEach (lr => {
                delete acc[lr];
              });

            } else if (node instanceof HasMany) {
              acc[node.table.as || node.table.name] = agg.filter ((r: any) =>
                rrefs.reduce ((acc, rr, idx) => acc && (r[rr] === row[lrefs[idx]]), true as boolean)
              );

              lrefs.forEach (lr => {
                delete acc[lr];
              });
            } else if (node instanceof ManyToMany) {
              acc[node.table.as || node.table.name] = agg.filter ((r: any) =>
                lxrefs.reduce ((acc, lxr, idx) => acc && (r[lxr] === row[lrefs[idx]]), true as boolean)
              );
            }
            return acc;
          }, row);
        });
      });
    });
  };

  return go (compiledQuery);
};

// vervang INput door params en
class RqlTag <Input> {
  string: string;
  keys: RQLValue<Input>[];
  ast: KeywordsNode<Input>;

  constructor(ast: KeywordsNode<Input>) {
    this.ast = ast;
    this.string = "";
    this.keys = [];
  }

  concat<Input2>(other: RqlTag<Input2> | SqlTag<Input2>): RqlTag<Input & Input2> {

    // of has many of manytomany
    if (!(this.ast instanceof Root)) {
      return this;
    }
    // const newMember: AstNode = other instanceof RqlTag
    //   ? other.ast
    //   : { type: "Variable", value: other };

    // const members = this.ast.members.concat (newMember);

    const members = this.ast.members;

    return new RqlTag<Input & Input2> (
      Object.assign ({}, this.ast, { members })
    );
  }

  map(fn: (ast: KeywordsNode<Input>) => KeywordsNode<Input>) {
    return new RqlTag<Input> (fn (this.ast));
  }

  run<Output>(config: RefQLConfig, querier: any, params: Input): Promise<Output[]> {

    const interpret = Interpreter (config.caseType, params);

    const go = makeGo<Input, Output> (config.querier, interpret);

    if (!(this.ast instanceof Root)) {
      throw new Error ("No Root");
    }

    // if ast has no table (when changing astrelation to ast node) throw error
    if (!this.ast.hasOwnProperty ("table")) {
      throw new Error ("No Table");
    }

    const rec = interpret (this.ast, createEnv (this.ast.table));

    return go (rec);

  }

  compile() {
    return {} as Rec<Input>;
  }
}

export default RqlTag;