import { Pool } from "pg";
import In from "./In";
import { rql } from "./index";
import { BelongsTo, Call, HasMany, Identifier, ManyToMany, Root, StringLiteral } from "./Parser/nodes";
import Raw from "./Raw";
import RqlTag from "./RqlTag";
import { Goal, Player } from "./soccer";
import SqlTag from "./SqlTag";
import sql from "./SqlTag/sql";
import Table from "./Table";
import { AstNode, RefQLConfig, Dict, CaseType, Keywords, TableNode, Querier } from "./types";

// RENAME record to rec

const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 5432
});

const querier = <T>(query: string, values: any[]) =>
  pool.query<T> (query, values).then (({ rows }) => rows);

const config: RefQLConfig = {
  caseType: "snake" as CaseType
};

const makeRun = <Output>(config: RefQLConfig, querier: Querier<Output>) => <Input>(tag: RqlTag<Input> | SqlTag<Input>, params: Input) => {
  return tag.run (config, querier, params);
};

const run = makeRun<Player> (config, querier);

const updateKeywords = <Params>(keywords: Keywords<Params>) => (ast: TableNode<Params>): TableNode<Params> => {
  const newKeywords = { ...ast.keywords, ...keywords };
  return {
    ...ast,
    keywords: newKeywords
  } as typeof ast;
};


// const toHasMany = <Params> (ast: TableNode<Params>): HasMany<Params> => {
//   return HasMany.of (ast.table, ast.members, ast.keywords);
// };

// const hasMany = <Params> (tag: RqlTag<Params>): RqlTag<Params> => {
//   return tag.map (ast => {
//     if (!(
//       ast instanceof Root ||
//       ast instanceof HasMany ||
//       ast instanceof BelongsTo ||
//       ast instanceof ManyToMany
//     )) {
//       // or throw error
//       return ast;
//     }
//     return toHasMany (ast);
//   });
// };

// const hasMany2 = <Params> (tag: RqlTag<Params>) => <Params2>(tag2: RqlTag<Params2>): RqlTag<Params & Params2> => {
//   return tag2.concat (tag.map (ast => {
//     if (!(
//       ast instanceof Root ||
//       ast instanceof HasMany ||
//       ast instanceof BelongsTo ||
//       ast instanceof ManyToMany
//     )) {
//       // or throw error
//       return ast;
//     }
//     return toHasMany (ast);
//   }));
// };

const playerQuery = rql<{ id: number; limit: number }>`
  ${Table.of ("player")} (limit: 5, offset: 8) {
    id
    x game:games {
      id
      result
    }
  }
`;


// const upd = playerQuery.map (ast => updateKeywords<{off: number}> ({
//   offset: p => p.off
// }) (ast));

// console.log (upd);

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


// run (playerQuery, { id: 1, limit: 5 })
//   .then (rows => console.log (rows[1]));

// playerQuery.run<Player> (config, querier, { id: 1, limit: 5 }).then (players => {
//   console.log (players.map (({ games }) => games));
//   // console.log (players);
// });

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

const paginate = <Input>(tag: RqlTag<Input> | SqlTag<Input>) =>
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


const playerAst = rql<{}>`
  player (id:1) {
    last_name
  }
`;

const id = Identifier.of<{}> ("id");
const name = Identifier.of<{}> ("name");
const idAst = RqlTag.of<{}> (id);
const nameAst = new RqlTag<{}> (name);

const fullname = Call.of ("concat", []);

const fullnameAst = RqlTag.of (fullname).concat (idAst).concat (nameAst);

console.log (fullname);
console.log (fullnameAst);

const fullPlayerAst = playerAst.concat (idAst);

// console.log (fullPlayerAst);
// console.log (idAst.concat (nameAst));

fullPlayerAst.run (config, querier, {}).then (console.log);