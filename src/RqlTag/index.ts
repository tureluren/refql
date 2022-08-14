// import JBOInterpreter from "../JBOInterpreter";
// import Interpreter from "../Interpreter";
// import Parser from "../Parser";
// import isRel from "../Rel/isRel";
// import isSub from "../Sub/isSub";
import Environment from "../Environment2";
import Interpreter from "../Interpreter";
import { BelongsTo, HasMany, ManyToMany, MembersNode, Root } from "../Parser/Node";
import SqlTag from "../SqlTag";
import {
  ASTNode, CompiledQuery, EnvRecord, JsonBuildObject,
  RefQLConfig, RQLValue, Values, Dict, Querier, TableNode
} from "../types";
import createEnv from "./createEnv";


const makeGo = <Input, Output>(querier: Querier, interpret: (exp: ASTNode, env: Environment<Input>, rows?: any[]) => EnvRecord<Input>) => (compiledQuery: CompiledQuery) => {
  const go = (compiled: CompiledQuery): Promise<Output[]> => {
    console.log (compiled);
    return querier (compiled.query, compiled.values).then (rows => {
      const nextNext = compiled.next.map (c => {

        const ip = interpret (c.exp, createEnv<Input> (compiled.table, c.refs), rows);

        return go ({
          next: ip.next,
          query: ip.query,
          values: ip.values,
          table: ip.table
        });

      });
      return Promise.all (
        nextNext
      ).then (aggs => {
        return rows.map (row => {
          return aggs.reduce ((acc, agg, idx) => {
            const { exp, refs } = compiled.next[idx];

            const lkeys = refs.lkeys.map (lk => lk.as);
            const rkeys = refs.rkeys.map (rk => rk.as);
            const lxkeys = refs.lxkeys.map (lxk => lxk.as);

            if (exp instanceof BelongsTo) {
              acc[exp.table.as || exp.table.name] = agg.find ((r: any) =>
                rkeys.reduce ((acc, rk, idx) => acc && (r[rk] === row[lkeys[idx]]), true as boolean)
              );

              lkeys.forEach (lk => {
                delete acc[lk];
              });

            } else if (exp instanceof HasMany) {
              acc[exp.table.as || exp.table.name] = agg.filter ((r: any) =>
                rkeys.reduce ((acc, rk, idx) => acc && (r[rk] === row[lkeys[idx]]), true as boolean)
              );

              lkeys.forEach (lk => {
                delete acc[lk];
              });
            } else if (exp instanceof ManyToMany) {
              acc[exp.table.as || exp.table.name] = agg.filter ((r: any) =>
                lxkeys.reduce ((acc, rk, idx) => acc && (r[rk] === row[lkeys[idx]]), true as boolean)
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
  ast: TableNode;

  constructor(ast: TableNode) {
    this.ast = ast;
    this.string = "";
    this.keys = [];
  }

  concat<Input2>(other: RqlTag<Input2> | SqlTag<Input2>): RqlTag<Input & Input2> {

    if (!(this.ast instanceof MembersNode)) {
      return this;
    }
    // const newMember: ASTNode = other instanceof RqlTag
    //   ? other.ast
    //   : { type: "Variable", value: other };

    // const members = this.ast.members.concat (newMember);

    const members = this.ast.members;

    return new RqlTag<Input & Input2> (
      Object.assign ({}, this.ast, { members })
    );
  }

  map(fn: (ast: TableNode) => TableNode) {
    return new RqlTag<Input> (fn (this.ast));
  }

  run<Output>(config: RefQLConfig, params: Input): Promise<Output[]> {

    const interpret = Interpreter (config.caseType, params);

    const go = makeGo<Input, Output> (config.querier, interpret);

    if (!(this.ast instanceof Root)) {
      throw new Error ("No Root");
    }

    // if ast has no table (when changing astrelation to ast node) throw error
    if (!this.ast.hasOwnProperty ("table")) {
      throw new Error ("No Table");
    }

    const interpreted = interpret (this.ast, createEnv (this.ast.table));

    return go ({
      next: interpreted.next,
      query: interpreted.query,
      values: interpreted.values,
      table: interpreted.table
    });

  }

  compile() {
    return {} as CompiledQuery;
  }
}

export default RqlTag;