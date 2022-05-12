import { RefQL, rql } from ".";
import { Player } from "./soccer";
import SQLTag from "./SQLTag";
import sql from "./SQLTag/sql";

const refQL = RefQL ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  pluralize: true,
  plurals: {},
  caseTypeJS: "snake",
  caseTypeDB: "snake",

  detectRefs: true,
  refs: {},
  debug: (_query, _variables, _ast) => {
    console.log (_query);
    // console.log (_variables);
    // console.log (_ast);
  }
});

const { query, query1, pool } = refQL;

pool.on ("error", err => {
  console.log (err.message);
  pool.end ().then (() => {
    console.log ("pool has ended");
    process.exit (-1);
  });
});

pool.on ("ready", () => {
  console.log ("ready");
});

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

const tag = sql`
  select 
`;
