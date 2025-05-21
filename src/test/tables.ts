import BelongsTo from "../Prop/BelongsTo";
import BelongsToMany from "../Prop/BelongsToMany";
import BooleanProp from "../Prop/BooleanProp";
import DateProp from "../Prop/DateProp";
import HasMany from "../Prop/HasMany";
import HasOne from "../Prop/HasOne";
import NumberProp from "../Prop/NumberProp";
import PropType from "../Prop/PropType";
import StringProp from "../Prop/StringProp";
import { SQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import { Table } from "../Table";
import { SQLTagVariable } from "../common/types";


const id = NumberProp ("id").hasDefault ();
const name = StringProp ("name");

const makeTestTables = (
  Table: <TableId extends string, Props extends PropType<any>[]>(name: TableId, props: Props) => Table<TableId, { [P in Props[number] as P["as"]]: P; }>,
  sql: <Params = {}, Output = unknown>(strings: TemplateStringsArray, ...variables: SQLTagVariable<Params>[]) => SQLTag<Params, Output>
) => {
  const Position = Table ("public.position", [
    id,
    name
  ]);

  const Rating = Table ("public.rating", [
    NumberProp ("playerId", "player_id"),
    NumberProp ("acceleration"),
    NumberProp ("finishing"),
    NumberProp ("positioning"),
    NumberProp ("shotPower", "shot_power"),
    NumberProp ("freeKick", "free_kick"),
    NumberProp ("stamina"),
    NumberProp ("dribbling"),
    NumberProp ("tackling")
  ]);

  const League = Table ("public.league", [
    id,
    name,
    HasMany ("teams", "public.team")
  ]);

  const Team = Table ("public.team", [
    id,
    name,
    BooleanProp ("active").hasDefault (),
    NumberProp ("leagueId", "league_id"),
    HasMany ("players", "public.player"),
    BelongsTo ("league", "public.league"),
    HasMany ("homeGames", "public.game", { rRef: "home_team_id" }),
    HasMany ("awayGames", "public.game", { rRef: "away_team_id" }),
    NumberProp ("playerCount", sql`
      select cast(count(*) as int) from player
      where player.team_id = team.id
    `)
  ]);

  const Player = Table ("public.player", [
    id,
    StringProp ("firstName", "first_name"),
    StringProp ("lastName", "last_name"),
    StringProp ("fullName", sql<{ delimiter: string }>`
      concat (player.first_name, ${Raw (p => `'${p.delimiter}'`)}, player.last_name)
    `),
    NumberProp ("goalCount", sql`
      select cast(count(*) as int) from goal
      where goal.player_id = player.id
    `),
    NumberProp ("firstGoalId", sql`
      select id from goal
      where goal.player_id = player.id
      limit 1
    `).nullable (),
    BooleanProp ("isVeteran", sql<{ year: number }>`
      select case when extract(year from birthday) < ${p => p.year} then true else false end
      from player
      where id = player.id
      limit 1
    `),
    StringProp ("cars").arrayOf (),
    DateProp ("birthday"),
    NumberProp ("teamId", "team_id").nullable (),
    BelongsTo ("team", "public.team").nullable (),
    NumberProp ("positionId", "position_id"),
    BelongsTo ("position", "public.position"),
    HasOne ("rating", "public.rating"),
    HasMany ("goals", "public.goal"),
    BelongsToMany ("games", "public.game")
  ]);

  const Player2 = Table ("public.player", [
    id,
    StringProp ("firstName", "first_name"),
    StringProp ("lastName", "last_name"),
    StringProp ("birthday"),
    NumberProp ("teamId", "team_id"),
    BelongsTo ("team", "public.team", {
      lRef: "TEAM_ID",
      rRef: "ID"
    }),
    NumberProp ("positionId", "position_id"),
    HasOne ("rating", "public.rating", {
      lRef: "ID",
      rRef: "PLAYER_ID"
    }),
    HasMany ("goals", "public.goal", {
      lRef: "ID",
      rRef: "PLAYER_ID"
    }),
    BelongsToMany ("games", "public.game", {
      xTable: "GAME_PLAYER"
    }),
    BelongsToMany ("xgames", "public.xgame", {
      lRef: "ID",
      lxRef: "PLAYER_ID",
      rxRef: "XGAME_ID",
      rRef: "ID"
    })
  ]);

  const XGame = Table ("public.xgame", [
    id,
    StringProp ("result"),
    NumberProp ("homeTeamId", "home_team_id"),
    NumberProp ("awayTeamId", "away_team_id"),
    BelongsTo ("homeTeam", "public.team", { lRef: "home_team_id" }),
    BelongsTo ("awayTeam", "public.team", { lRef: "away_team_id" }),
    NumberProp ("leagueId", "league_id"),
    BelongsTo ("league", "public.league")
  ]);

  const Game = Table ("public.game", [
    id,
    DateProp ("date"),
    StringProp ("result"),
    NumberProp ("homeTeamId", "home_team_id"),
    NumberProp ("awayTeamId", "away_team_id"),
    BelongsTo ("awayTeam", "public.team", { lRef: "away_team_id" }),
    BelongsTo ("homeTeam", "public.team", { lRef: "home_team_id" }),
    NumberProp ("leagueId", "league_id"),
    BelongsTo ("league", "public.league")
  ]);

  const Goal = Table ("public.goal", [
    id,
    NumberProp ("minute"),
    NumberProp ("playerId", "player_id"),
    NumberProp ("gameId", "game_id"),
    BooleanProp ("ownGoal", "own_goal").hasDefault (),
    BelongsTo ("game", "public.game"),
    BelongsTo ("player", "public.player")
  ]);

  const Assist = Table ("public.assist", [
    id,
    NumberProp ("playerId", "player_id"),
    NumberProp ("gameId", "game_id"),
    NumberProp ("goalId", "goal_id"),
    BelongsTo ("game", "public.game"),
    BelongsTo ("player", "public.player"),
    BelongsTo ("goal", "public.goal")
  ]);


  const GamePlayer = Table ("public.game_player", []);

  return {
    Assist,
    Game,
    GamePlayer,
    Goal,
    League, Player, Player2, Position, Rating,
    Team, XGame
  };
};

export default makeTestTables;