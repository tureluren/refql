"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
  return (mod && mod.__esModule) ? mod : { default: mod };
};
Object.defineProperty (exports, "__esModule", { value: true });
exports.getTables = void 0;
const Prop_1 = __importDefault (require ("../../Prop"));
const BelongsTo_1 = __importDefault (require ("../../Prop/BelongsTo"));
const BelongsToMany_1 = __importDefault (require ("../../Prop/BelongsToMany"));
const BooleanProp_1 = __importDefault (require ("../../Prop/BooleanProp"));
const DateProp_1 = __importDefault (require ("../../Prop/DateProp"));
const HasMany_1 = __importDefault (require ("../../Prop/HasMany"));
const HasOne_1 = __importDefault (require ("../../Prop/HasOne"));
const NumberProp_1 = __importDefault (require ("../../Prop/NumberProp"));
const StringProp_1 = __importDefault (require ("../../Prop/StringProp"));

const getTables = Table => {
  return {
    general: {
      Setting: Table ("general.setting", [
        (0, NumberProp_1.default) ("id", "id").hasDefault (),
        (0, StringProp_1.default) ("keyName", "key_name"),
        (0, StringProp_1.default) ("keyValue", "key_value")
      ])
    },
    public: {
      Assist: Table ("public.assist", [
        (0, NumberProp_1.default) ("id", "id").hasDefault (),
        (0, NumberProp_1.default) ("gameId", "game_id"),
        (0, NumberProp_1.default) ("goalId", "goal_id"),
        (0, BelongsTo_1.default) ("playerId", "public.game_player", { lRef: "player_id", rRef: "game_id" }),
        (0, BelongsTo_1.default) ("game", "public.game", { lRef: "game_id", rRef: "id" }),
        (0, BelongsTo_1.default) ("goal", "public.goal", { lRef: "goal_id", rRef: "id" }),
        (0, BelongsTo_1.default) ("player", "public.player", { lRef: "player_id", rRef: "id" })
      ]),
      Game: Table ("public.game", [
        (0, NumberProp_1.default) ("id", "id").hasDefault (),
        (0, DateProp_1.default) ("date", "date").nullable (),
        (0, NumberProp_1.default) ("homeTeamId", "home_team_id"),
        (0, NumberProp_1.default) ("awayTeamId", "away_team_id"),
        (0, NumberProp_1.default) ("leagueId", "league_id"),
        (0, StringProp_1.default) ("result", "result"),
        (0, HasMany_1.default) ("assists", "public.assist", { lRef: "id", rRef: "game_id" }),
        (0, HasMany_1.default) ("gamePlayers", "public.game_player", { lRef: "id", rRef: "game_id" }),
        (0, HasMany_1.default) ("goals", "public.goal", { lRef: "id", rRef: "game_id" }),
        (0, BelongsTo_1.default) ("awayTeam", "public.team", { lRef: "away_team_id", rRef: "id" }),
        (0, BelongsTo_1.default) ("homeTeam", "public.team", { lRef: "home_team_id", rRef: "id" }),
        (0, BelongsTo_1.default) ("league", "public.league", { lRef: "league_id", rRef: "id" }),
        (0, BelongsToMany_1.default) ("players", "public.player", { lRef: "id", lxRef: "game_id", xTable: "public.game_player", rxRef: "player_id", rRef: "id" })
      ]),
      GamePlayer: Table ("public.game_player", [
        (0, NumberProp_1.default) ("playerId", "player_id"),
        (0, NumberProp_1.default) ("gameId", "game_id"),
        (0, HasMany_1.default) ("assists", "public.assist", { lRef: "game_id", rRef: "player_id" }),
        (0, HasMany_1.default) ("goals", "public.goal", { lRef: "game_id", rRef: "player_id" }),
        (0, BelongsTo_1.default) ("game", "public.game", { lRef: "game_id", rRef: "id" }),
        (0, BelongsTo_1.default) ("player", "public.player", { lRef: "player_id", rRef: "id" })
      ]),
      Goal: Table ("public.goal", [
        (0, NumberProp_1.default) ("id", "id").hasDefault (),
        (0, NumberProp_1.default) ("gameId", "game_id"),
        (0, BelongsTo_1.default) ("playerId", "public.game_player", { lRef: "player_id", rRef: "game_id" }),
        (0, BooleanProp_1.default) ("ownGoal", "own_goal").hasDefault (),
        (0, NumberProp_1.default) ("minute", "minute"),
        (0, HasMany_1.default) ("assists", "public.assist", { lRef: "id", rRef: "goal_id" }),
        (0, BelongsTo_1.default) ("game", "public.game", { lRef: "game_id", rRef: "id" }),
        (0, BelongsTo_1.default) ("player", "public.player", { lRef: "player_id", rRef: "id" })
      ]),
      League: Table ("public.league", [
        (0, NumberProp_1.default) ("id", "id").hasDefault (),
        (0, StringProp_1.default) ("name", "name"),
        (0, HasMany_1.default) ("games", "public.game", { lRef: "id", rRef: "league_id" }),
        (0, HasMany_1.default) ("teams", "public.team", { lRef: "id", rRef: "league_id" })
      ]),
      Player: Table ("public.player", [
        (0, DateProp_1.default) ("birthday", "birthday").nullable (),
        (0, NumberProp_1.default) ("teamId", "team_id").nullable (),
        (0, NumberProp_1.default) ("positionId", "position_id").nullable (),
        (0, NumberProp_1.default) ("id", "id").hasDefault (),
        (0, Prop_1.default) ("cars", "cars").nullable (),
        (0, StringProp_1.default) ("firstName", "first_name"),
        (0, StringProp_1.default) ("lastName", "last_name"),
        (0, HasMany_1.default) ("assists", "public.assist", { lRef: "id", rRef: "player_id" }),
        (0, HasMany_1.default) ("gamePlayers", "public.game_player", { lRef: "id", rRef: "player_id" }),
        (0, HasMany_1.default) ("goals", "public.goal", { lRef: "id", rRef: "player_id" }),
        (0, HasOne_1.default) ("rating", "public.rating", { lRef: "id", rRef: "player_id" }),
        (0, BelongsTo_1.default) ("position", "public.position", { lRef: "position_id", rRef: "id" }).nullable (),
        (0, BelongsTo_1.default) ("team", "public.team", { lRef: "team_id", rRef: "id" }).nullable (),
        (0, BelongsToMany_1.default) ("games", "public.game", { lRef: "id", lxRef: "player_id", xTable: "public.game_player", rxRef: "game_id", rRef: "id" })
      ]),
      Position: Table ("public.position", [
        (0, NumberProp_1.default) ("id", "id").hasDefault (),
        (0, StringProp_1.default) ("name", "name"),
        (0, HasMany_1.default) ("players", "public.player", { lRef: "id", rRef: "position_id" })
      ]),
      Rating: Table ("public.rating", [
        (0, NumberProp_1.default) ("playerId", "player_id"),
        (0, NumberProp_1.default) ("acceleration", "acceleration"),
        (0, NumberProp_1.default) ("finishing", "finishing"),
        (0, NumberProp_1.default) ("positioning", "positioning"),
        (0, NumberProp_1.default) ("shotPower", "shot_power"),
        (0, NumberProp_1.default) ("freeKick", "free_kick"),
        (0, NumberProp_1.default) ("stamina", "stamina"),
        (0, NumberProp_1.default) ("dribbling", "dribbling"),
        (0, NumberProp_1.default) ("tackling", "tackling"),
        (0, BelongsTo_1.default) ("player", "public.player", { lRef: "player_id", rRef: "id" })
      ]),
      Team: Table ("public.team", [
        (0, NumberProp_1.default) ("id", "id").hasDefault (),
        (0, BooleanProp_1.default) ("active", "active").hasDefault (),
        (0, NumberProp_1.default) ("leagueId", "league_id").nullable (),
        (0, StringProp_1.default) ("name", "name"),
        (0, HasMany_1.default) ("games", "public.game", { lRef: "id", rRef: "home_team_id" }),
        (0, HasMany_1.default) ("players", "public.player", { lRef: "id", rRef: "team_id" }),
        (0, BelongsTo_1.default) ("league", "public.league", { lRef: "league_id", rRef: "id" }).nullable ()
      ])
    }
  };
};

exports.getTables = getTables;