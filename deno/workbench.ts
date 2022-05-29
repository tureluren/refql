import { Pool } from "pg";
import { RefQL, rql, sql } from ".";

const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 5432
});

const querier = (query: string, values: any[]) =>
  pool.query (query, values).then (({ rows }) => rows);

const refQL = RefQL ({
  caseTypeDB: "snake",
  caseTypeJS: "camel",
  debug: (query, _values, _ast) => {
    console.log (query);
    // console.log (_values);
    // console.log (_ast);
  },
  detectRefs: true,
  onSetupError: err => {
    console.error (err.message);
  },
  pluralize: true,
  plurals: {},
  refs: {}
}, querier);

const {
  query1, // get one result
  query // get multiple results
} = refQL;

async function getPlayer() {
  const player = await query1 (rql`
    player (id: 1) {
      id
      lastName
      - team {
        id
        name
      }
    }
  `);

  const alternative = await query1 (rql`
    player () {
      id
      lastName
      - team {
        id
        name
      }
      ${"dkdkdk"}
    }
  `);

  // { id: 1, lastName: "Buckley", team: { id: 1, name: "FC Wuharazi" } }
  console.log (player);
  // { id: 1, lastName: "Buckley", team: { id: 1, name: "FC Wuharazi" } }
  console.log (alternative);
}

getPlayer ();
