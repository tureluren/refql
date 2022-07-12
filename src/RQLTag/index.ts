// import JBOInterpreter from "../JBOInterpreter";
// import Interpreter from "../Interpreter";
// import Parser from "../Parser";
// import isRel from "../Rel/isRel";
// import isSub from "../Sub/isSub";
import Environment from "../Environment2";
import Interpreter from "../Interpreter";
import {
  ASTNode, ASTRelation, CompiledQuery, EnvRecord, JsonBuildObject,
  RefQLConfig, RQLValue, Values, Dict, Querier
} from "../types";

const makeGo = <Input>(querier: Querier, interpreter: Interpreter<Input>) => (compiledQuery: CompiledQuery) => {
  const go = <T>(compiled: CompiledQuery): Promise<T[]> => {
    console.log (compiled.query);
    // zie hier dat refs opgehaald worden
    return querier (compiled.query, compiled.values).then (rows => {
      const nextNext = compiled.next.map (c => {
        const ip = interpreter.interpret (c.exp, new Environment ({ table: compiled.table }, null), rows);

        return go ({
          next: ip?.next!,
          query: ip?.query!,
          values: ip?.values!,
          table: ip?.table!
        });

      });
      return Promise.all (
        nextNext
      ).then (aggs => {
        return rows.map (row => {
          return aggs.reduce ((acc, agg, idx) => {
            const { exp, lkeys, rkeys } = compiled.next[idx];
            if (exp.type === "BelongsTo") {
              acc[exp.as || exp.name] = agg.find ((r: any) =>
                rkeys.reduce ((acc, rk, idx) => acc && (r[rk] === row[lkeys[idx]]), true as boolean)
              );

              lkeys.forEach (lk => {
                delete acc[lk];
              });

            } else if (exp.type === "HasMany") {
              acc[exp.as || exp.name] = agg.filter ((r: any) =>
                rkeys.reduce ((acc, rk, idx) => acc && (r[rk] === row[lkeys[idx]]), true as boolean)
              );

              lkeys.forEach (lk => {
                delete acc[lk];
              });
            } else if (exp.type === "ManyToMany") {
              acc[exp.as || exp.name] = agg.filter ((r: any) =>
                rkeys.reduce ((acc, rk, idx) => acc && (r[rk] === row[lkeys[idx]]), true as boolean)
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

// vervang INput door params en outPut door return
class RQLTag <Input, Output> {
  string: string;
  keys: RQLValue<Input>[];
  ast: ASTRelation;

  constructor(ast: ASTRelation) {

    this.ast = ast;
    this.string = "";
    this.keys = [];
  }

  concat<Input2, Output2>(other: RQLTag<Input2, Output2>) {
    const members = this.ast.members.concat (other.ast);

    return new RQLTag<Input & Input2, Output> (
      Object.assign ({}, this.ast, { members })
    );
  }

  map(fn: (ast: ASTRelation) => ASTRelation) {
    return new RQLTag<Input, Output> (fn (this.ast));
  }

  run(config: RefQLConfig, params: Input) {

    const interpreter = new Interpreter (config.caseType, config.useSmartAlias, params);

    const go = makeGo<Input> (config.querier, interpreter);


    const interpreted = interpreter.interpret (this.ast);

    return go ({
      next: interpreted?.next!,
      query: interpreted?.query!,
      values: interpreted?.values!,
      table: interpreted?.table!
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