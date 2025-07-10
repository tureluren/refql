import Prop from "../../Prop/index.ts";
import PropType from "../../Prop/PropType.ts";
import RefProp from "../../Prop/RefProp.ts";
import { Table } from "../../Table/index.ts";
export declare const getTables: (Table: <TableId extends string, Props extends PropType<any>[]>(name: TableId, props: Props) => Table<TableId, { [P in Props[number] as P["as"]]: P extends Prop ? Prop<TableId, P["as"], P["output"], P["params"], P["isOmitted"], P["hasDefaultValue"], P["hasOp"]> : P; }>) => {
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
};