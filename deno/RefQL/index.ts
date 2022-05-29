import compile from "../more/compile";
import tag from "../more/tag";
import makeRefs from "../refs/makeRefs";
import RQLTag from "../RQLTag";
import SQLTag from "../SQLTag";
import { Querier, RefQLConfig, Refs } from "../types";
import defaultConfig from "./defaultConfig";
import readRefs from "./readRefs";
import validateConfig from "./validateConfig";

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

  const query = <T>(...components: [RQLTag | SQLTag, ...any[]]): Promise<T[]> => {
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

  const query1 = <T>(...components: [RQLTag | SQLTag, ...any[]]): Promise<T> =>
    query<T> (...components).then (rows => rows[0]);

  return { query, query1 };
};

export default RefQL;