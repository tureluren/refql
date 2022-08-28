import compile from "../more/compile";
import tag from "../more/tag";
import makeRefs from "../refs/makeRefs";
import RqlTag from "../RqlTag";
import SqlTag from "../SqlTag";
import { Querier, RefQLConfig, RefsOld } from "../types";
import defaultConfig from "./defaultConfig";
import readRefs from "./readRefs";
import validateConfig from "./validateConfig";

// const makeGo = (querier: Querier) => (compiledQuery: CompiledQuery) => {
//   const go = <T>(compiled: CompiledQuery): Promise<T[]> => {
//     return querier (compiled.query, compiled.values).then (rows => {
//       const nextNext = compiled.next.map (c => {

//       });
//       return Promise.all (
//         compiled.next.map (c => go (c))
//       ).then (aggs => {
//         return rows.map (row => {
//           return aggs.reduce ((acc, agg, idx) => {
//             const incl = compiled.next[idx];
//             // const inclRes = agg.
//             return acc;
//           }, {} as T);
//         });
//       });
//     });
//   };

//   return go (compiledQuery);
// };

const RefQL = (userConfig: Partial<RefQLConfig>, querier: Querier) => {
  const config = defaultConfig (userConfig);

  validateConfig (config);

  let ready = false;
  let refs: RefsOld = {};
  let queue: ((refs: RefsOld) => void)[] = [];

  if (config.detectRefs) {
    readRefs (querier)
      .then (dbRefs => {
        // @ts-ignore
        refs = makeRefs (config, dbRefs);
        ready = true;
        queue.forEach (fn => fn (refs));
        queue = [];
      })
      .catch (err => {
        if (config.onSetupError) {
          config.onSetupError (err);
        }
      });
  } else {
    ready = true;
    refs = config.refs;
  }

  // const go = makeGo (querier);

  // const query = <T>(...components: [RqlTag | SqlTag, ...any[]]): Promise<T[]> => {
  const query = <T>(...components: [any | SqlTag<any>, ...any[]]): Promise<T[]> => {
    const t = tag (...components);
    return new Promise ((resolve, reject) => {
      const run = (refs: RefsOld) => {
        const { query, values } = compile ({ ...config, refs }, t);

        if (config.debug) {
          config.debug (query, values);
        }

        querier (query, values)
          .then (rows => {
            resolve (
              // @ts-ignore
              t.constructor.transform<T> (config, rows)
            );
          })
          .catch (reject);
      };

      if (!ready) {
        queue.push (run);
      } else {
        run (refs);
      }
    });
  };

  // const query1 = <T>(...components: [RqlTag | SqlTag, ...any[]]): Promise<T> =>
  const query1 = <T>(...components: [any | SqlTag<any>, ...any[]]): Promise<T> =>
    query<T> (...components).then (rows => rows[0]);

  return { query, query1 };
};

export default RefQL;