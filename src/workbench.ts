import { Pool } from "pg";
import { rql } from "./index";
import RQLTag from "./RQLTag";
import { Goal, Player } from "./soccer";
import { ASTNode, ASTRelation, RefQLConfig, Dict, Values, CaseType } from "./types";

const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 5432
});

const querier = (query: string, values: any[]) =>
  pool.query (query, values).then (({ rows }) => rows);

const config = {
  caseTypeDB: "snake" as CaseType,
  caseTypeJS: "camel" as CaseType,
  debug: (query: string, _values: Values) => {
    console.log (query);
    // console.log (_values);
    // console.log (_ast);
  },
  detectRefs: true,
  onSetupError: (err: Error) => {
    console.error (err.message);
  },
  pluralize: true,
  plurals: {},
  refs: {
    game: {
      team: [["id", "teams_id"]]
    }
  },
  useSmartAlias: true,
  querier
};

const makeRun = (config: RefQLConfig) => <Input, Output>(tag: RQLTag<Input, Output>, params: Input) => {
  return tag.run (config, params);
};

const run = makeRun (config);

const toHasMany = (ast: ASTRelation): ASTRelation => {
  return {
    ...ast,
    type: "HasMany"
  } as ASTRelation;
};

const playerQuery = rql<{ id: number }, Player>`
  player (id: 1) {
    id
    last_name
    team_id
    - team (links: ${[["id", "team_id"]]}) {
      id
      name
    }
  }
`;

const goalsQuery = rql<{ limit: number }, Goal>`
  goals (limit: 1) {
    id
    minute
  }
`;

const query = playerQuery.concat (goalsQuery.map (toHasMany));


run (playerQuery, { id: 5, refs: {} }).then (
  console.log
);

const refs = {
  player: {
    team: {
      leftKey: "team_id",
      key: "id"
    },
    goal: {
      leftKey: "id",
      key: "player_id"
    },
    game: {
      x: "player_game",
      leftKey: "id",
      leftXKey: "player_id",
      key: "id",
      xKey: "game_id"
    }
  }
};


// const pool = new Pool ({
//   user: "test",
//   host: "localhost",
//   database: "soccer",
//   password: "test",
//   port: 5432
// });

// const querier = (query: string, values: any[]) =>
//   pool.query (query, values).then (({ rows }) => rows);

// const refQL = RefQL ({
//   caseTypeDB: "snake",
//   caseTypeJS: "camel",
//   debug: (query, _values, _ast) => {
//     console.log (query);
//     // console.log (_values);
//     // console.log (_ast);
//   },
//   detectRefs: true,
//   onSetupError: err => {
//     console.error (err.message);
//   },
//   pluralize: true,
//   plurals: {},
//   refs: {}
// }, querier);

// const {
//   query1, // get one result
//   query // get multiple results
// } = refQL;

// async function getPlayer() {
//   const player = await query1<Player> (rql`
//     player {
//       id
//       lastName
//       - team {
//         id
//         name
//       }
//       - position {
//         id
//         name
//       }
//     }
//   `);


//   // { id: 1, lastName: "Buckley", team: { id: 1, name: "FC Wuharazi" } }
//   console.log (player);
// }

// getPlayer ();
