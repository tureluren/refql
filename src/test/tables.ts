import BelongsTo from "../Prop/BelongsTo";
import BelongsToMany from "../Prop/BelongsToMany";
import BooleanProp from "../Prop/BooleanProp";
import DateProp from "../Prop/DateProp";
import HasMany from "../Prop/HasMany";
import HasOne from "../Prop/HasOne";
import NumberProp from "../Prop/NumberProp";
import StringProp from "../Prop/StringProp";
import Raw from "../SQLTag/Raw";
import sql from "../SQLTag/sql";
import Table from "../Table";

const id = NumberProp ("id");
const name = StringProp ("name");

const Position = Table ("game", [
  id,
  name
]);

const Rating = Table ("rating", [
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

const League = Table ("league", [
  id,
  name,
  HasMany ("teams", "public.team")
]);

const Team = Table ("public.team", [
  id,
  name,
  NumberProp ("leagueId", "league_id"),
  HasMany ("players", "player"),
  BelongsTo ("league", "league")
]);

const Player = Table ("player", [
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
  BelongsTo ("position", "position"),
  HasOne ("rating", "rating"),
  HasMany ("goals", "goal"),
  BelongsToMany ("games", "game")
]);

const Player2 = Table ("player", [
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
  HasOne ("rating", "rating", {
    lRef: "ID",
    rRef: "PLAYER_ID"
  }),
  HasMany ("goals", "goal", {
    lRef: "ID",
    rRef: "PLAYER_ID"
  }),
  BelongsToMany ("games", "game", {
    xTable: "GAME_PLAYER"
  }),
  BelongsToMany ("xgames", "xgame", {
    lRef: "ID",
    lxRef: "PLAYER_ID",
    rxRef: "XGAME_ID",
    rRef: "ID"
  })
]);

const XGame = Table ("xgame", [
  id,
  StringProp ("result"),
  NumberProp ("homeTeamId", "home_team_id"),
  NumberProp ("awayTeamId", "away_team_id"),
  BelongsTo ("homeTeam", "public.team", { lRef: "home_team_id" }),
  BelongsTo ("awayTeam", "public.team", { lRef: "away_team_id" }),
  NumberProp ("leagueId", "league_id"),
  BelongsTo ("league", "league")
]);

const Game = Table ("game", [
  id,
  StringProp ("result"),
  NumberProp ("homeTeamId", "home_team_id"),
  NumberProp ("awayTeamId", "away_team_id"),
  BelongsTo ("homeTeam", "public.team", { lRef: "home_team_id" }),
  BelongsTo ("awayTeam", "public.team", { lRef: "away_team_id" }),
  NumberProp ("leagueId", "league_id"),
  BelongsTo ("league", "league")
]);

const Goal = Table ("goal", [
  id,
  NumberProp ("minute"),
  NumberProp ("playerId", "player_id"),
  NumberProp ("gameId", "game_id"),
  BooleanProp ("ownGoal", "own_goal"),
  BelongsTo ("game", "game"),
  BelongsTo ("player", "player")
]);

const Assist = Table ("assist", [
  id,
  NumberProp ("playerId", "player_id"),
  NumberProp ("gameId", "game_id"),
  NumberProp ("goalId", "goal_id"),
  BelongsTo ("game", "game"),
  BelongsTo ("player", "player"),
  BelongsTo ("goal", "goal")
]);


const GamePlayer = Table ("game_player", []);

export {
  Assist,
  Game,
  GamePlayer,
  Goal,
  League,
  Position,
  Player,
  Rating,
  Team,
  Player2,
  XGame
};
