import { Pool } from "pg";
import { rql } from "./index";
import Raw from "./Raw";
import raw from "./Raw/raw";
import RQLTag from "./RQLTag";
import { Goal, Player } from "./soccer";
import SQLTag from "./SQLTag";
import sql from "./SQLTag/sql";
import Table from "./Table";
import { ASTNode, ASTRelation, RefQLConfig, Dict, Values, CaseType, Keywords } from "./types";

const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 5432
});

const mapSafely = (x: any) => x;

// safeMap, optionele functie die reserved keys stored
const querier = (query: string, values: any[]) =>
  pool.query (query, values).then (mapSafely).then (({ rows }) => rows);

const config: RefQLConfig = {
  caseType: "snake" as CaseType,
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

const makeRun = (config: RefQLConfig) => <Input, Output>(tag: RQLTag<Input> | SQLTag<Input>, params: Input) => {
  return tag.run<Output> (config, params);
};

const run = makeRun (config);

const updateKeywords = (keywords: Keywords) => (ast: ASTRelation): ASTRelation => {
  const newKeywords = { ...ast.keywords, ...keywords };
  return {
    ...ast,
    keywords: newKeywords
  } as ASTRelation;
};

// const toHasMany = (ast: ASTRelation): ASTRelation => {
//   return {
//     ...ast,
//     type: "HasMany"
//   } as ASTRelation;
// };

// const hasMany = <Input> (tag: RQLTag<Input>): RQLTag<Input> => {
//   return tag.map (toHasMany);
// };

// const hasMany2 = <Input> (tag: RQLTag<Input>) => <Input2>(tag2: RQLTag<Input2>): RQLTag<Input & Input2> => {
//   return tag2.concat (tag.map (toHasMany));
// };

const playerQuery = rql<{ id: number }>`
  player {
    id:identifie::text
    last_name
    ${sql`
      select count (*) from goal
      where player_id = player.id 
    `}:goalcount::int
    ${sql`
      limit 11
    `}
  }
`;

console.log (playerQuery);

// const goalsQuery = rql<{ limit: number }>`
//   goals (limit: 1) {
//     id
//     minute
//   }
// `;

const playerGoalsRef = {
  lkey: "id",
  rkey: "goal_id"
};

// const hasManyGoals = hasMany (goalsQuery.map (updateKeywords (playerGoalsRef)));
// const hasManyGoals2 = hasMany2 (goalsQuery.map (updateKeywords (playerGoalsRef)));

// const query = playerQuery.concat (goalsQuery.map (toHasMany));
// const query = playerQuery
//   .concat (hasManyGoals);

// const query2 = hasManyGoals2 (playerQuery);


// run<{ id: number }, Player> (playerQuery, { id: 5 })
//   .then (rows => console.log (rows[1]));

playerQuery.run<Player> (config, { id: 5 }).then (players => {
  console.log (players[10]);
});

const refs = {
  player: {
    team: { leftKey: "team_id", key: "id" },
    goal: { leftKey: "id", key: "player_id" },
    game: {
      x: "player_game",
      leftKey: "id",
      leftXKey: "player_id",
      key: "id",
      xKey: "game_id"
    }
  },
  game: {
    "team/1": { leftKey: "home_team_id", key: "id" },
    "team/2": { leftKey: "away_team_id", key: "id" }
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
//   caseType: "snake",
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


const selectPlayer = sql<{id: number}>`
  select * from player
`;

// const paginate = sql<{}, any>`
//   limit 5
//   offset 0
// `;

const paginate = <Input>(tag: RQLTag<Input> | SQLTag<Input>) =>
  tag.concat (sql<Input & { limit: number}>`
    limit ${(params: any) => params.limit}
    offset 0 
  `);




// compose (orderByName, paginate) (selectPlayer)

const fullPlayer = paginate (selectPlayer);


// run<{limit: number; id: number}, Player> (fullPlayer, { limit: 5, id: 5 }).then (players => {
//   console.log (players);
// });



// class BelongsTo {
//   sign: string;

//   constructor(sign: string) {
//     this.sign = sign;
//   }

//   cata<R>(pattern: Pattern<R>) {
//     return pattern.BelongsTo (this.sign);
//   }
// }

// const exp = new HasMany ("-");

// const res = exp.cata<string> ({
//   BelongsTo: x => x,
//   HasMany: x => x
// });