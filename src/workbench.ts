import { Pool } from "pg";
import RefQL, {
  BooleanProp,
  Limit, NumberProp,
  Values
} from ".";

const pool = new Pool ({
  user: "test",
  host: "localhost",
  database: "soccer",
  password: "test",
  port: 3308
});


// natural transformation
const querier = async (query: string, values: any[]) => {
  console.log ("'" + query + "'");
  // console.log (values);
  const res = await pool.query (query, values);

  // return rows;
  return res.rows;
};


const { tables, sql, Table } = RefQL ({
  querier
});


const { League, Player, Game, Team, GamePlayer, Goal, Rating, Assist } = tables.public;


const { id: playerId, birthday } = Player.props;


const { id, name, active } = Team.props;
const { result } = Game.props;


// .concat (Team (["name", Game (["date"])]));

// teamById ().then (ts => console.log (ts[0]));

// const getTeams = Team ([Game, Limit (1)]);
// getTeams ().then (e => console.log (e));

// const teamById = sql`
//   select id, name, ${Raw ("active")} from team
//   where id = ${p => p.id}
//   or id = ${2}
//   or id in ${Values ([3, 4, 5])}
// `;

// teamById ({ id: 1 }).then (console.log);


// count enzo toevoegen om subselects zonder sqlTag te doen

// OrderBy rqlNode OrderBy(p => p.ordery) (kan ook gewoon een SQL worden he) (maar dan maakt volgorde wel uit)
// const OrderBy = sql`
// ->   {Raw(p => order by `p.orderBy`)}
// -> ` write in docs en tests miss ?


// semigroup
// paginated = allPlayers.concat([Limit, Offset])


// know Issues:
// - refprops zitten ook op table.props, maar we kunnen er niet veel mee omdat die geen weet heeft van de columns die op bv team zitten
// - in delete no option to define returning RQLTag cause i don't see the point
// - in returning rql tag (inserts, updates) params is any to no type info about returns, so we need
//    const byIds = sql<{ id: number}[]>`
//      and id in ${Values (rows => rows.map (r => r.id))}
//     `;

// TODO:
// refprops zitten ook op props, dit ook laten toevoegen aan query ?
// const { id, name, playerCount, active, homeGames } = Team.props;
// monoid weghalen uit spec

// Future plans
// aggregation, grouping, distinct
// tx
// or
// upsert

// DECISIONS
// inc ipv omit, omdat bij update statements, byId, meestal wilt ge dan geen set id ={}, enkel op filteren en bij gewone selects kunt ge met * werken ipv incl()





