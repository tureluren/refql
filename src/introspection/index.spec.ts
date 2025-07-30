import mariaDB from "mariadb";
import mySQL from "mysql2";
import pg from "pg";
import { introspectPG } from ".";
import makeSQL from "../SQLTag/sql";
import { Querier } from "../common/types";
import withDefaultOptions from "../common/withDefaultOptions";
import mariaDBQuerier from "../test/mariaDBQuerier";
import mySQLQuerier from "../test/mySQLQuerier";
import pgQuerier from "../test/pgQuerier";
import userConfig from "../test/userConfig";

describe ("RQLTag type", () => {
  let pool: any;
  let querier: Querier;

  if (process.env.DB_TYPE === "mysql") {
    pool = mySQL.createPool (userConfig ("mysql"));
    querier = mySQLQuerier (pool);
  } else if (process.env.DB_TYPE === "mariadb") {
    pool = mariaDB.createPool (userConfig ("mariadb"));
    querier = mariaDBQuerier (pool);
  } else {
    pool = new pg.Pool (userConfig ("pg"));
    querier = pgQuerier (pool);
  }

  const options = withDefaultOptions ({ querier });

  const sqlRunnerless = makeSQL (options);

  afterAll (() => {
    pool.end ();
  });

  test ("introspect PostGres database", async () => {
    const [outputJs, outputTs] = await introspectPG (sqlRunnerless, options);

    expect (outputJs).toEqual (
`"use strict";
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
    public: {
      Assist: Table ("public.assist", [
        (0, BelongsTo_1.default) ("game", "public.game", { lRef: ["game_id"], rRef: ["id"] }),
        (0, NumberProp_1.default) ("gameId", "game_id"),
        (0, BelongsTo_1.default) ("gamePlayer", "public.game_player", { lRef: ["player_id", "game_id"], rRef: ["player_id", "game_id"] }),
        (0, BelongsTo_1.default) ("goal", "public.goal", { lRef: ["goal_id"], rRef: ["id"] }),
        (0, NumberProp_1.default) ("goalId", "goal_id"),
        (0, NumberProp_1.default) ("id", "id").hasDefault (),
        (0, BelongsTo_1.default) ("player", "public.player", { lRef: ["player_id"], rRef: ["id"] }),
        (0, NumberProp_1.default) ("playerId", "player_id")
      ]),
      Game: Table ("public.game", [
        (0, HasMany_1.default) ("assists", "public.assist", { lRef: ["id"], rRef: ["game_id"] }),
        (0, BelongsTo_1.default) ("awayTeam", "public.team", { lRef: ["away_team_id"], rRef: ["id"] }),
        (0, NumberProp_1.default) ("awayTeamId", "away_team_id"),
        (0, DateProp_1.default) ("date", "date").nullable (),
        (0, HasMany_1.default) ("gamePlayers", "public.game_player", { lRef: ["id"], rRef: ["game_id"] }),
        (0, HasMany_1.default) ("goals", "public.goal", { lRef: ["id"], rRef: ["game_id"] }),
        (0, BelongsTo_1.default) ("homeTeam", "public.team", { lRef: ["home_team_id"], rRef: ["id"] }),
        (0, NumberProp_1.default) ("homeTeamId", "home_team_id"),
        (0, NumberProp_1.default) ("id", "id").hasDefault (),
        (0, BelongsTo_1.default) ("league", "public.league", { lRef: ["league_id"], rRef: ["id"] }),
        (0, NumberProp_1.default) ("leagueId", "league_id"),
        (0, BelongsToMany_1.default) ("players", "public.player", { lRef: ["id"], lxRef: ["game_id"], xTable: "public.game_player", rxRef: ["player_id"], rRef: ["id"] }),
        (0, StringProp_1.default) ("result", "result")
      ]),
      GamePlayer: Table ("public.game_player", [
        (0, HasMany_1.default) ("assists", "public.assist", { lRef: ["player_id", "game_id"], rRef: ["player_id", "game_id"] }),
        (0, BelongsTo_1.default) ("game", "public.game", { lRef: ["game_id"], rRef: ["id"] }),
        (0, NumberProp_1.default) ("gameId", "game_id"),
        (0, HasMany_1.default) ("goals", "public.goal", { lRef: ["player_id", "game_id"], rRef: ["player_id", "game_id"] }),
        (0, BelongsTo_1.default) ("player", "public.player", { lRef: ["player_id"], rRef: ["id"] }),
        (0, NumberProp_1.default) ("playerId", "player_id")
      ]),
      Goal: Table ("public.goal", [
        (0, HasMany_1.default) ("assists", "public.assist", { lRef: ["id"], rRef: ["goal_id"] }),
        (0, BelongsTo_1.default) ("game", "public.game", { lRef: ["game_id"], rRef: ["id"] }),
        (0, NumberProp_1.default) ("gameId", "game_id"),
        (0, BelongsTo_1.default) ("gamePlayer", "public.game_player", { lRef: ["player_id", "game_id"], rRef: ["player_id", "game_id"] }),
        (0, NumberProp_1.default) ("id", "id").hasDefault (),
        (0, NumberProp_1.default) ("minute", "minute"),
        (0, BooleanProp_1.default) ("ownGoal", "own_goal").hasDefault (),
        (0, BelongsTo_1.default) ("player", "public.player", { lRef: ["player_id"], rRef: ["id"] }),
        (0, NumberProp_1.default) ("playerId", "player_id")
      ]),
      League: Table ("public.league", [
        (0, HasMany_1.default) ("games", "public.game", { lRef: ["id"], rRef: ["league_id"] }),
        (0, NumberProp_1.default) ("id", "id").hasDefault (),
        (0, StringProp_1.default) ("name", "name"),
        (0, HasMany_1.default) ("teams", "public.team", { lRef: ["id"], rRef: ["league_id"] })
      ]),
      Player: Table ("public.player", [
        (0, HasMany_1.default) ("assists", "public.assist", { lRef: ["id"], rRef: ["player_id"] }),
        (0, DateProp_1.default) ("birthday", "birthday").nullable (),
        (0, Prop_1.default) ("cars", "cars").nullable (),
        (0, StringProp_1.default) ("firstName", "first_name"),
        (0, HasMany_1.default) ("gamePlayers", "public.game_player", { lRef: ["id"], rRef: ["player_id"] }),
        (0, BelongsToMany_1.default) ("games", "public.game", { lRef: ["id"], lxRef: ["player_id"], xTable: "public.game_player", rxRef: ["game_id"], rRef: ["id"] }),
        (0, HasMany_1.default) ("goals", "public.goal", { lRef: ["id"], rRef: ["player_id"] }),
        (0, NumberProp_1.default) ("id", "id").hasDefault (),
        (0, StringProp_1.default) ("lastName", "last_name"),
        (0, BelongsTo_1.default) ("position", "public.position", { lRef: ["position_id"], rRef: ["id"] }).nullable (),
        (0, NumberProp_1.default) ("positionId", "position_id").nullable (),
        (0, HasOne_1.default) ("rating", "public.rating", { lRef: ["id"], rRef: ["player_id"] }),
        (0, BelongsTo_1.default) ("team", "public.team", { lRef: ["team_id"], rRef: ["id"] }).nullable (),
        (0, NumberProp_1.default) ("teamId", "team_id").nullable ()
      ]),
      Position: Table ("public.position", [
        (0, NumberProp_1.default) ("id", "id").hasDefault (),
        (0, StringProp_1.default) ("name", "name"),
        (0, HasMany_1.default) ("players", "public.player", { lRef: ["id"], rRef: ["position_id"] })
      ]),
      Rating: Table ("public.rating", [
        (0, NumberProp_1.default) ("acceleration", "acceleration"),
        (0, NumberProp_1.default) ("dribbling", "dribbling"),
        (0, NumberProp_1.default) ("finishing", "finishing"),
        (0, NumberProp_1.default) ("freeKick", "free_kick"),
        (0, BelongsTo_1.default) ("player", "public.player", { lRef: ["player_id"], rRef: ["id"] }),
        (0, NumberProp_1.default) ("playerId", "player_id"),
        (0, NumberProp_1.default) ("positioning", "positioning"),
        (0, NumberProp_1.default) ("shotPower", "shot_power"),
        (0, NumberProp_1.default) ("stamina", "stamina"),
        (0, NumberProp_1.default) ("tackling", "tackling")
      ]),
      Setting: Table ("public.setting", [
        (0, NumberProp_1.default) ("id", "id").hasDefault (),
        (0, StringProp_1.default) ("keyName", "key_name"),
        (0, StringProp_1.default) ("keyValue", "key_value")
      ]),
      Team: Table ("public.team", [
        (0, BooleanProp_1.default) ("active", "active").hasDefault (),
        (0, HasMany_1.default) ("games", "public.game", { lRef: ["id"], rRef: ["home_team_id"] }),
        (0, NumberProp_1.default) ("id", "id").hasDefault (),
        (0, BelongsTo_1.default) ("league", "public.league", { lRef: ["league_id"], rRef: ["id"] }).nullable (),
        (0, NumberProp_1.default) ("leagueId", "league_id").nullable (),
        (0, StringProp_1.default) ("name", "name"),
        (0, HasMany_1.default) ("players", "public.player", { lRef: ["id"], rRef: ["team_id"] })
      ])
    }
  };
};

exports.getTables = getTables;`
    );

    expect (outputTs).toEqual (
`import { PropMap } from "../../common/types";
import Prop from "../../Prop";
import PropType from "../../Prop/PropType";
import RefProp from "../../Prop/RefProp";
import { Table } from "../../Table";
export declare const getTables: (Table: <TableId extends string, Props extends PropType<any>[]>(name: TableId, props: Props) => Table<TableId, PropMap<TableId, Props>>) => {
  public: {
    Assist: Table<"public.assist", {
      game: RefProp<"game", "public.game", "BelongsTo", false>;
      gameId: Prop<"public.assist", "gameId", number, {}, false, false, false>;
      gamePlayer: RefProp<"gamePlayer", "public.game_player", "BelongsTo", false>;
      goal: RefProp<"goal", "public.goal", "BelongsTo", false>;
      goalId: Prop<"public.assist", "goalId", number, {}, false, false, false>;
      id: Prop<"public.assist", "id", number, {}, false, true, false>;
      player: RefProp<"player", "public.player", "BelongsTo", false>;
      playerId: Prop<"public.assist", "playerId", number, {}, false, false, false>;
    }>;
    Game: Table<"public.game", {
      assists: RefProp<"assists", "public.assist", "HasMany", false>;
      awayTeam: RefProp<"awayTeam", "public.team", "BelongsTo", false>;
      awayTeamId: Prop<"public.game", "awayTeamId", number, {}, false, false, false>;
      date: Prop<"public.game", "date", Date | null, {}, false, false, false>;
      gamePlayers: RefProp<"gamePlayers", "public.game_player", "HasMany", false>;
      goals: RefProp<"goals", "public.goal", "HasMany", false>;
      homeTeam: RefProp<"homeTeam", "public.team", "BelongsTo", false>;
      homeTeamId: Prop<"public.game", "homeTeamId", number, {}, false, false, false>;
      id: Prop<"public.game", "id", number, {}, false, true, false>;
      league: RefProp<"league", "public.league", "BelongsTo", false>;
      leagueId: Prop<"public.game", "leagueId", number, {}, false, false, false>;
      players: RefProp<"players", "public.player", "BelongsToMany", false>;
      result: Prop<"public.game", "result", string, {}, false, false, false>;
    }>;
    GamePlayer: Table<"public.game_player", {
      assists: RefProp<"assists", "public.assist", "HasMany", false>;
      game: RefProp<"game", "public.game", "BelongsTo", false>;
      gameId: Prop<"public.game_player", "gameId", number, {}, false, false, false>;
      goals: RefProp<"goals", "public.goal", "HasMany", false>;
      player: RefProp<"player", "public.player", "BelongsTo", false>;
      playerId: Prop<"public.game_player", "playerId", number, {}, false, false, false>;
    }>;
    Goal: Table<"public.goal", {
      assists: RefProp<"assists", "public.assist", "HasMany", false>;
      game: RefProp<"game", "public.game", "BelongsTo", false>;
      gameId: Prop<"public.goal", "gameId", number, {}, false, false, false>;
      gamePlayer: RefProp<"gamePlayer", "public.game_player", "BelongsTo", false>;
      id: Prop<"public.goal", "id", number, {}, false, true, false>;
      minute: Prop<"public.goal", "minute", number, {}, false, false, false>;
      ownGoal: Prop<"public.goal", "ownGoal", boolean | null, {}, false, true, false>;
      player: RefProp<"player", "public.player", "BelongsTo", false>;
      playerId: Prop<"public.goal", "playerId", number, {}, false, false, false>;
    }>;
    League: Table<"public.league", {
      games: RefProp<"games", "public.game", "HasMany", false>;
      id: Prop<"public.league", "id", number, {}, false, true, false>;
      name: Prop<"public.league", "name", string, {}, false, false, false>;
      teams: RefProp<"teams", "public.team", "HasMany", false>;
    }>;
    Player: Table<"public.player", {
      assists: RefProp<"assists", "public.assist", "HasMany", false>;
      birthday: Prop<"public.player", "birthday", Date | null, {}, false, false, false>;
      cars: Prop<"public.player", "cars", any | null, {}, false, false, false>;
      firstName: Prop<"public.player", "firstName", string, {}, false, false, false>;
      gamePlayers: RefProp<"gamePlayers", "public.game_player", "HasMany", false>;
      games: RefProp<"games", "public.game", "BelongsToMany", false>;
      goals: RefProp<"goals", "public.goal", "HasMany", false>;
      id: Prop<"public.player", "id", number, {}, false, true, false>;
      lastName: Prop<"public.player", "lastName", string, {}, false, false, false>;
      position: RefProp<"position", "public.position", "BelongsTo", true>;
      positionId: Prop<"public.player", "positionId", number | null, {}, false, false, false>;
      rating: RefProp<"rating", "public.rating", "HasOne", true>;
      team: RefProp<"team", "public.team", "BelongsTo", true>;
      teamId: Prop<"public.player", "teamId", number | null, {}, false, false, false>;
    }>;
    Position: Table<"public.position", {
      id: Prop<"public.position", "id", number, {}, false, true, false>;
      name: Prop<"public.position", "name", string, {}, false, false, false>;
      players: RefProp<"players", "public.player", "HasMany", false>;
    }>;
    Rating: Table<"public.rating", {
      acceleration: Prop<"public.rating", "acceleration", number, {}, false, false, false>;
      dribbling: Prop<"public.rating", "dribbling", number, {}, false, false, false>;
      finishing: Prop<"public.rating", "finishing", number, {}, false, false, false>;
      freeKick: Prop<"public.rating", "freeKick", number, {}, false, false, false>;
      player: RefProp<"player", "public.player", "BelongsTo", false>;
      playerId: Prop<"public.rating", "playerId", number, {}, false, false, false>;
      positioning: Prop<"public.rating", "positioning", number, {}, false, false, false>;
      shotPower: Prop<"public.rating", "shotPower", number, {}, false, false, false>;
      stamina: Prop<"public.rating", "stamina", number, {}, false, false, false>;
      tackling: Prop<"public.rating", "tackling", number, {}, false, false, false>;
    }>;
    Setting: Table<"public.setting", {
      id: Prop<"public.setting", "id", number, {}, false, true, false>;
      keyName: Prop<"public.setting", "keyName", string, {}, false, false, false>;
      keyValue: Prop<"public.setting", "keyValue", string, {}, false, false, false>;
    }>;
    Team: Table<"public.team", {
      active: Prop<"public.team", "active", boolean | null, {}, false, true, false>;
      games: RefProp<"games", "public.game", "HasMany", false>;
      id: Prop<"public.team", "id", number, {}, false, true, false>;
      league: RefProp<"league", "public.league", "BelongsTo", true>;
      leagueId: Prop<"public.team", "leagueId", number | null, {}, false, false, false>;
      name: Prop<"public.team", "name", string, {}, false, false, false>;
      players: RefProp<"players", "public.player", "HasMany", false>;
    }>;
  };
};`
    );
  });
});