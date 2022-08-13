import compile from "../more/compile.ts";
import tag from "../more/tag.ts";
import makeRefs from "../refs/makeRefs.ts";
import RqlTag from "../RqlTag/index.ts";
import SqlTag from "../SqlTag/index.ts";
import { Querier, RefQLConfig, Refs } from "../types.ts";
import defaultConfig from "./defaultConfig.ts";
import readRefs from "./readRefs.ts";
import validateConfig from "./validateConfig.ts";

const RefQL = (userConfig: Partial<RefQLConfig>, querier: Querier) => {
  const config = defaultConfig (userConfig);

  validateConfig (config);

  let ready = false;
  let refs: Refs = {};
  let queue: ((refs: Refs) => void)[] = [];

  if (config.detectRefs) {
    readRefs (querier)
      .then (dbRefs => {
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

  const query = <T>(...components: [RqlTag | SqlTag, ...any[]]): Promise<T[]> => {
    const t = tag (...components);
    return new Promise ((resolve, reject) => {
      const run = (refs: Refs) => {
        const [query, values, ast] = compile ({ ...config, refs }, t);

        if (config.debug) {
          config.debug (query, values, ast);
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

  const query1 = <T>(...components: [RqlTag | SqlTag, ...any[]]): Promise<T> =>
    query<T> (...components).then (rows => rows[0]);

  return { query, query1 };
};

export default RefQL;