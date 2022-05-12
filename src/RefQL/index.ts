import { Pool, PoolConfig } from "pg";
import compile from "../more/compile";
import tag from "../more/tag";
import makeRefs from "../refs/makeRefs";
import RQLTag from "../RQLTag";
import SQLTag from "../SQLTag";
import { ExtraEvents, RefQLConfig, Refs } from "../types";
import branchConfig from "./branchConfig";
import readRefs from "./readRefs";
import validateConfig from "./validateConfig";

const RefQL = (userConfig: PoolConfig & Partial<RefQLConfig>) => {
  const [poolConfig, config] = branchConfig (userConfig);

  validateConfig (config);

  let ready = false;
  let refs: Refs = {};
  let queue: ((refs: Refs) => void)[] = [];

  const pool = <Pool & ExtraEvents> new Pool (poolConfig);

  // stil read refs, even if detectRefs = false,
  // just to make sure we're connected to the database
  readRefs (pool)
    .then (dbRefs => {
      refs = makeRefs (config, dbRefs);
      ready = true;
      pool.emit ("ready", null);
      queue.forEach (fn => fn (refs));
      queue = [];
    })
    .catch (err => {
      pool.emit ("error", err);
    });

  const query = <T>(...components: [RQLTag | SQLTag, ...any[]]): Promise<T[]> => {
    const t = tag (...components);
    return new Promise ((resolve, reject) => {
      const run = (refs: Refs) => {
        const [query, values, ast] = compile ({ ...config, refs }, t);

        if (config.debug) {
          config.debug (query, values, ast);
        }

        pool
          .query (query, values)
          .then (({ rows }) => {
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

  return {
    query, query1, pool
  };
};

export default RefQL;