import { Pool } from "pg";
import { RefQL, rql } from ".";
import { Player } from "./soccer";

const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 5432
});

const querier = (query, values) =>
  pool.query (query, values).then (({ rows }) => rows);

const refQL = RefQL ({
  pluralize: true,
  plurals: {},
  caseTypeJS: "camel",
  caseTypeDB: "snake",
  detectRefs: true,
  refs: {},
  onSetupError: err => {
    console.error (err.message);
  },
  debug: (_query, _values, _ast) => {
    console.log (_query);
    // console.log (_values);
    // console.log (_ast);
  }
}, querier);

const { query1 } = refQL;

async function exec() {

  try {
    const begin = performance.now ();

    const player = await query1<Player> (rql`
      player (id: 3) {
        id
        lastName
        x game {
          id
          result
        }
      }
    `);

    const end = performance.now ();

    console.log (player);

    console.log ("performance: total " + (end - begin));
  } catch (e) {
    console.log (e);
  }
}

exec ();