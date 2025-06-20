import mariaDB from "mariadb";
import mySQL from "mysql2";
import pg from "pg";
import { Querier } from "../common/types";
import userConfig from "../test/userConfig";
import mySQLQuerier from "../test/mySQLQuerier";
import mariaDBQuerier from "../test/mariaDBQuerier";
import pgQuerier from "../test/pgQuerier";
import RefQL from "../RefQL";
import makeSQL from "../SQLTag/sql";
import withDefaultOptions from "../common/withDefaultOptions";
import { introspectPG } from ".";

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
`import Prop from "../../Prop";
import PropType from "../../Prop/PropType";
import RefProp from "../../Prop/RefProp";
import { Table } from "../../Table";
export declare const getTables: (Table: <TableId extends string, Props extends PropType<any>[]>(name: TableId, props: Props) => Table<TableId, { [P in Props[number] as P["as"]]: P; }>) => {
  public: {
    Assist: Table<"public.assist", {
      game: RefProp<"game", "public.game", "BelongsTo", false>;
      gameId: Prop<"gameId", number, {}, false, false, false>;
      gamePlayer: RefProp<"gamePlayer", "public.game_player", "BelongsTo", false>;
      goal: RefProp<"goal", "public.goal", "BelongsTo", false>;
      goalId: Prop<"goalId", number, {}, false, false, false>;
      id: Prop<"id", number, {}, false, true, false>;
      player: RefProp<"player", "public.player", "BelongsTo", false>;
      playerId: Prop<"playerId", number, {}, false, false, false>;
    }>;
    Game: Table<"public.game", {
      assists: RefProp<"assists", "public.assist", "HasMany", false>;
      awayTeam: RefProp<"awayTeam", "public.team", "BelongsTo", false>;
      awayTeamId: Prop<"awayTeamId", number, {}, false, false, false>;
      date: Prop<"date", Date | null, {}, false, false, false>;
      gamePlayers: RefProp<"gamePlayers", "public.game_player", "HasMany", false>;
      goals: RefProp<"goals", "public.goal", "HasMany", false>;
      homeTeam: RefProp<"homeTeam", "public.team", "BelongsTo", false>;
      homeTeamId: Prop<"homeTeamId", number, {}, false, false, false>;
      id: Prop<"id", number, {}, false, true, false>;
      league: RefProp<"league", "public.league", "BelongsTo", false>;
      leagueId: Prop<"leagueId", number, {}, false, false, false>;
      players: RefProp<"players", "public.player", "BelongsToMany", false>;
      result: Prop<"result", string, {}, false, false, false>;
    }>;
    GamePlayer: Table<"public.game_player", {
      assists: RefProp<"assists", "public.assist", "HasMany", false>;
      game: RefProp<"game", "public.game", "BelongsTo", false>;
      gameId: Prop<"gameId", number, {}, false, false, false>;
      goals: RefProp<"goals", "public.goal", "HasMany", false>;
      player: RefProp<"player", "public.player", "BelongsTo", false>;
      playerId: Prop<"playerId", number, {}, false, false, false>;
    }>;
    Goal: Table<"public.goal", {
      assists: RefProp<"assists", "public.assist", "HasMany", false>;
      game: RefProp<"game", "public.game", "BelongsTo", false>;
      gameId: Prop<"gameId", number, {}, false, false, false>;
      gamePlayer: RefProp<"gamePlayer", "public.game_player", "BelongsTo", false>;
      id: Prop<"id", number, {}, false, true, false>;
      minute: Prop<"minute", number, {}, false, false, false>;
      ownGoal: Prop<"ownGoal", boolean | null, {}, false, true, false>;
      player: RefProp<"player", "public.player", "BelongsTo", false>;
      playerId: Prop<"playerId", number, {}, false, false, false>;
    }>;
    League: Table<"public.league", {
      games: RefProp<"games", "public.game", "HasMany", false>;
      id: Prop<"id", number, {}, false, true, false>;
      name: Prop<"name", string, {}, false, false, false>;
      teams: RefProp<"teams", "public.team", "HasMany", false>;
    }>;
    Player: Table<"public.player", {
      assists: RefProp<"assists", "public.assist", "HasMany", false>;
      birthday: Prop<"birthday", Date | null, {}, false, false, false>;
      cars: Prop<"cars", any | null, {}, false, false, false>;
      firstName: Prop<"firstName", string, {}, false, false, false>;
      gamePlayers: RefProp<"gamePlayers", "public.game_player", "HasMany", false>;
      games: RefProp<"games", "public.game", "BelongsToMany", false>;
      goals: RefProp<"goals", "public.goal", "HasMany", false>;
      id: Prop<"id", number, {}, false, true, false>;
      lastName: Prop<"lastName", string, {}, false, false, false>;
      position: RefProp<"position", "public.position", "BelongsTo", true>;
      positionId: Prop<"positionId", number | null, {}, false, false, false>;
      rating: RefProp<"rating", "public.rating", "HasOne", false>;
      team: RefProp<"team", "public.team", "BelongsTo", true>;
      teamId: Prop<"teamId", number | null, {}, false, false, false>;
    }>;
    Position: Table<"public.position", {
      id: Prop<"id", number, {}, false, true, false>;
      name: Prop<"name", string, {}, false, false, false>;
      players: RefProp<"players", "public.player", "HasMany", false>;
    }>;
    Rating: Table<"public.rating", {
      acceleration: Prop<"acceleration", number, {}, false, false, false>;
      dribbling: Prop<"dribbling", number, {}, false, false, false>;
      finishing: Prop<"finishing", number, {}, false, false, false>;
      freeKick: Prop<"freeKick", number, {}, false, false, false>;
      player: RefProp<"player", "public.player", "BelongsTo", false>;
      playerId: Prop<"playerId", number, {}, false, false, false>;
      positioning: Prop<"positioning", number, {}, false, false, false>;
      shotPower: Prop<"shotPower", number, {}, false, false, false>;
      stamina: Prop<"stamina", number, {}, false, false, false>;
      tackling: Prop<"tackling", number, {}, false, false, false>;
    }>;
    Setting: Table<"public.setting", {
      id: Prop<"id", number, {}, false, true, false>;
      keyName: Prop<"keyName", string, {}, false, false, false>;
      keyValue: Prop<"keyValue", string, {}, false, false, false>;
    }>;
    Team: Table<"public.team", {
      active: Prop<"active", boolean | null, {}, false, true, false>;
      games: RefProp<"games", "public.game", "HasMany", false>;
      id: Prop<"id", number, {}, false, true, false>;
      league: RefProp<"league", "public.league", "BelongsTo", true>;
      leagueId: Prop<"leagueId", number | null, {}, false, false, false>;
      name: Prop<"name", string, {}, false, false, false>;
      players: RefProp<"players", "public.player", "HasMany", false>;
    }>;
  };
};`
    );
  });
});