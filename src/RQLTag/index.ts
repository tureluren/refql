// import JBOInterpreter from "../JBOInterpreter";
// import Interpreter from "../Interpreter";
// import Parser from "../Parser";
// import isRel from "../Rel/isRel";
// import isSub from "../Sub/isSub";
import Environment from "../Environment2";
import Interpreter from "../Interpreter";
import { BelongsTo, HasMany, ManyToMany } from "../Parser/Node";
import SQLTag from "../SQLTag";
import {
  ASTNode, ASTRelation, CompiledQuery, EnvRecord, JsonBuildObject,
  RefQLConfig, RQLValue, Values, Dict, Querier
} from "../types";
import createEnv from "./createEnv";


const makeGo = <Input, Output>(querier: Querier, interpret: (exp: ASTNode, env: Environment<Input>, rows?: any[]) => EnvRecord<Input>) => (compiledQuery: CompiledQuery) => {
  const go = (compiled: CompiledQuery): Promise<Output[]> => {
    console.log (compiled);
    // zie hier dat refs opgehaald worden
    return querier (compiled.query, compiled.values).then (rows => {
      const nextNext = compiled.next.map (c => {

        // is table wel nog nodig nu dat er refs zijn
        const ip = interpret (c.exp, createEnv<Input> (compiled.table, c.refs), rows);
        console.log (ip);

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
class RQLTag <Input> {
  string: string;
  keys: RQLValue<Input>[];
  ast: ASTRelation;

  constructor(ast: ASTRelation) {
    this.ast = ast;
    this.string = "";
    this.keys = [];
  }

  concat<Input2>(other: RQLTag<Input2> | SQLTag<Input2>) {
    // const newMember: ASTNode = other instanceof RQLTag
    //   ? other.ast
    //   : { type: "Variable", value: other };

    // const members = this.ast.members.concat (newMember);

    const members = this.ast.members;

    return new RQLTag<Input & Input2> (
      Object.assign ({}, this.ast, { members })
    );
  }

  map(fn: (ast: ASTRelation) => ASTRelation) {
    return new RQLTag<Input> (fn (this.ast));
  }

  run<Output>(config: RefQLConfig, params: Input): Promise<Output[]> {

    const interpret = Interpreter (config.caseType, config.useSmartAlias, params);

    const go = makeGo<Input, Output> (config.querier, interpret);

    const interpreted = interpret (this.ast);

    return go ({
      next: interpreted.next,
      query: interpreted.query,
      values: interpreted.values,
      table: interpreted.table
    });

  }

  // include(snip: any) {
  //   let nextString, nextKeys;

  //   if (isRel (snip)) {
  //     nextString = this.string
  //       .trim ()
  //       // replace last "}" to include the snippet, and insert }
  //       .replace (/\}$/, snip.symbol + " " + snip.tag.string.trim () + "}");

  //     nextKeys = this.keys.concat (snip.tag.keys);
  //   } else if (isSub (snip)) {
  //     nextString = this.string
  //       .trim ()
  //       .replace (/\}$/, "& " + snip.as + "$ }");

  //     nextKeys = this.keys.concat (snip.tag);
  //   } else {
  //     nextString = this.string.trim ().replace (/\}$/, "$}");
  //     nextKeys = this.keys.concat (snip);
  //   }

  //   return new RQLTag ({} as ASTNode);
  // }
  compile() {
    return {} as CompiledQuery;
  }

  // compile(config: RefQLConfig): CompiledQuery {
  //   const parser = new Parser (
  //     // config.caseType,
  //     // config.caseTypeJS,
  //     // config.pluralize,
  //     // config.plurals
  //   );
  //   const ast = parser.parse (this.string, this.keys);
  //   // const interpreter = new JBOInterpreter (config.refs, config.useSmartAlias);
  //   const interpreter = new Interpreter (config.refs, config.useSmartAlias);

  //   // @ts-ignore
  //   const interpreted: EnvRecord = interpreter.interpret (ast, []);

  //   console.log (interpreted);

  //   // return [query, values, ast];
  //   return {
  //     query: interpreted.query || "",
  //     values: interpreted.values || [],
  //     next: interpreted.next
  //   };
  // }

  // static transform<T>(_config: RefQLConfig, rows: JsonBuildObject<T>[]) {
  //   // return rows.map (r => r.json_build_object);
  //   return rows;
  // }
}

export default RQLTag;