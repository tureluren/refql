import Prop from "../Prop";
import BelongsTo from "../Prop/BelongsTo";
import BelongsToMany from "../Prop/BelongsToMany";
import BooleanProp from "../Prop/BooleanProp";
import DateProp from "../Prop/DateProp";
import HasMany from "../Prop/HasMany";
import HasOne from "../Prop/HasOne";
import NumberProp from "../Prop/NumberProp";
import StringProp from "../Prop/StringProp";
import Table from "../Table";

export const Assist = Table ("public.assist", [
  NumberProp ("id", "id").hasDefault (),
  NumberProp ("gameId", "game_id"),
  NumberProp ("goalId", "goal_id"),
  BelongsTo ("playerId", "public.game_player", { lRef: "player_id", rRef: "game_id" }),
  BelongsTo ("game", "public.game", { lRef: "game_id", rRef: "id" }),
  BelongsTo ("goal", "public.goal", { lRef: "goal_id", rRef: "id" }),
  BelongsTo ("player", "public.player", { lRef: "player_id", rRef: "id" })
]);

export const Game = Table ("public.game", [
  NumberProp ("id", "id").hasDefault (),
  DateProp ("date", "date").nullable (),
  NumberProp ("homeTeamId", "home_team_id"),
  NumberProp ("awayTeamId", "away_team_id"),
  NumberProp ("leagueId", "league_id"),
  StringProp ("result", "result"),
  BelongsTo ("awayTeam", "public.team", { lRef: "away_team_id", rRef: "id" }),
  BelongsTo ("homeTeam", "public.team", { lRef: "home_team_id", rRef: "id" }),
  BelongsTo ("league", "public.league", { lRef: "league_id", rRef: "id" }),
  HasMany ("assists", "public.assist", { lRef: "id", rRef: "game_id" }),
  HasMany ("gamePlayers", "public.game_player", { lRef: "id", rRef: "game_id" }),
  HasMany ("goals", "public.goal", { lRef: "id", rRef: "game_id" }),
  BelongsToMany ("players", "public.player", { lRef: "id", lxRef: "game_id", xTable: "public.game_player", rxRef: "player_id", rRef: "id" })
]);

export const GamePlayer = Table ("public.game_player", [
  NumberProp ("playerId", "player_id"),
  NumberProp ("gameId", "game_id"),
  BelongsTo ("game", "public.game", { lRef: "game_id", rRef: "id" }),
  BelongsTo ("player", "public.player", { lRef: "player_id", rRef: "id" }),
  HasMany ("assists", "public.assist", { lRef: "game_id", rRef: "player_id" }),
  HasMany ("goals", "public.goal", { lRef: "game_id", rRef: "player_id" })
]);

export const Goal = Table ("public.goal", [
  NumberProp ("id", "id").hasDefault (),
  NumberProp ("gameId", "game_id"),
  BelongsTo ("playerId", "public.game_player", { lRef: "player_id", rRef: "game_id" }),
  BooleanProp ("ownGoal", "own_goal").hasDefault (),
  NumberProp ("minute", "minute"),
  BelongsTo ("game", "public.game", { lRef: "game_id", rRef: "id" }),
  BelongsTo ("player", "public.player", { lRef: "player_id", rRef: "id" }),
  HasMany ("assists", "public.assist", { lRef: "id", rRef: "goal_id" })
]);

export const League = Table ("public.league", [
  NumberProp ("id", "id").hasDefault (),
  StringProp ("name", "name"),
  HasMany ("games", "public.game", { lRef: "id", rRef: "league_id" }),
  HasMany ("teams", "public.team", { lRef: "id", rRef: "league_id" })
]);

export const Player = Table ("public.player", [
  DateProp ("birthday", "birthday").nullable (),
  NumberProp ("teamId", "team_id").nullable (),
  NumberProp ("positionId", "position_id").nullable (),
  NumberProp ("id", "id").hasDefault (),
  Prop ("cars", "cars").nullable (),
  StringProp ("firstName", "first_name"),
  StringProp ("lastName", "last_name"),
  BelongsTo ("position", "public.position", { lRef: "position_id", rRef: "id" }).nullable (),
  BelongsTo ("team", "public.team", { lRef: "team_id", rRef: "id" }).nullable (),
  HasMany ("assists", "public.assist", { lRef: "id", rRef: "player_id" }),
  HasMany ("gamePlayers", "public.game_player", { lRef: "id", rRef: "player_id" }),
  HasMany ("goals", "public.goal", { lRef: "id", rRef: "player_id" }),
  HasOne ("rating", "public.rating", { lRef: "id", rRef: "player_id" }),
  BelongsToMany ("games", "public.game", { lRef: "id", lxRef: "player_id", xTable: "public.game_player", rxRef: "game_id", rRef: "id" })
]);

export const Position = Table ("public.position", [
  NumberProp ("id", "id").hasDefault (),
  StringProp ("name", "name"),
  HasMany ("players", "public.player", { lRef: "id", rRef: "position_id" })
]);

export const Rating = Table ("public.rating", [
  NumberProp ("playerId", "player_id"),
  NumberProp ("acceleration", "acceleration"),
  NumberProp ("finishing", "finishing"),
  NumberProp ("positioning", "positioning"),
  NumberProp ("shotPower", "shot_power"),
  NumberProp ("freeKick", "free_kick"),
  NumberProp ("stamina", "stamina"),
  NumberProp ("dribbling", "dribbling"),
  NumberProp ("tackling", "tackling"),
  BelongsTo ("player", "public.player", { lRef: "player_id", rRef: "id" })
]);

export const Setting = Table ("public.setting", [
  NumberProp ("id", "id").hasDefault (),
  StringProp ("keyName", "key_name"),
  StringProp ("keyValue", "key_value")
]);

export const Team = Table ("public.team", [
  NumberProp ("id", "id").hasDefault (),
  BooleanProp ("active", "active").hasDefault (),
  NumberProp ("leagueId", "league_id").nullable (),
  StringProp ("name", "name"),
  BelongsTo ("league", "public.league", { lRef: "league_id", rRef: "id" }).nullable (),
  HasMany ("games", "public.game", { lRef: "id", rRef: "home_team_id" }),
  HasMany ("players", "public.player", { lRef: "id", rRef: "team_id" })
]);