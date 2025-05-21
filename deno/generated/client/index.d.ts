import Prop from "../../Prop/index.ts";
import PropType from "../../Prop/PropType.ts";
import RefProp from "../../Prop/RefProp.ts";
import { Table } from "../../Table/index.ts";
export declare const getTables: (Table: <TableId extends string, Props extends PropType<any>[]>(name: TableId, props: Props) => Table<TableId, { [P in Props[number] as P["as"]]: P; }>) => {
  general: {
    Setting: Table<"general.setting", {
      id: Prop<"id", number, {}, false, true, false>;
      keyName: Prop<"keyName", string, {}, false, false, false>;
      keyValue: Prop<"keyValue", string, {}, false, false, false>;
    }>;
  };
  public: {
    Assist: Table<"public.assist", {
      id: Prop<"id", number, {}, false, true, false>;
      gameId: Prop<"gameId", number, {}, false, false, false>;
      goalId: Prop<"goalId", number, {}, false, false, false>;
      playerId: RefProp<"playerId", "public.game_player", "BelongsTo", false>;
      game: RefProp<"game", "public.game", "BelongsTo", false>;
      goal: RefProp<"goal", "public.goal", "BelongsTo", false>;
      player: RefProp<"player", "public.player", "BelongsTo", false>;
    }>;
    Game: Table<"public.game", {
      id: Prop<"id", number, {}, false, true, false>;
      date: Prop<"date", Date | null, {}, false, false, false>;
      homeTeamId: Prop<"homeTeamId", number, {}, false, false, false>;
      awayTeamId: Prop<"awayTeamId", number, {}, false, false, false>;
      leagueId: Prop<"leagueId", number, {}, false, false, false>;
      result: Prop<"result", string, {}, false, false, false>;
      assists: RefProp<"assists", "public.assist", "HasMany", false>;
      gamePlayers: RefProp<"gamePlayers", "public.game_player", "HasMany", false>;
      goals: RefProp<"goals", "public.goal", "HasMany", false>;
      awayTeam: RefProp<"awayTeam", "public.team", "BelongsTo", false>;
      homeTeam: RefProp<"homeTeam", "public.team", "BelongsTo", false>;
      league: RefProp<"league", "public.league", "BelongsTo", false>;
      players: RefProp<"players", "public.player", "BelongsToMany", false>;
    }>;
    GamePlayer: Table<"public.game_player", {
      playerId: Prop<"playerId", number, {}, false, false, false>;
      gameId: Prop<"gameId", number, {}, false, false, false>;
      assists: RefProp<"assists", "public.assist", "HasMany", false>;
      goals: RefProp<"goals", "public.goal", "HasMany", false>;
      game: RefProp<"game", "public.game", "BelongsTo", false>;
      player: RefProp<"player", "public.player", "BelongsTo", false>;
    }>;
    Goal: Table<"public.goal", {
      id: Prop<"id", number, {}, false, true, false>;
      gameId: Prop<"gameId", number, {}, false, false, false>;
      playerId: RefProp<"playerId", "public.game_player", "BelongsTo", false>;
      ownGoal: Prop<"ownGoal", boolean | null, {}, false, true, false>;
      minute: Prop<"minute", number, {}, false, false, false>;
      assists: RefProp<"assists", "public.assist", "HasMany", false>;
      game: RefProp<"game", "public.game", "BelongsTo", false>;
      player: RefProp<"player", "public.player", "BelongsTo", false>;
    }>;
    League: Table<"public.league", {
      id: Prop<"id", number, {}, false, true, false>;
      name: Prop<"name", string, {}, false, false, false>;
      games: RefProp<"games", "public.game", "HasMany", false>;
      teams: RefProp<"teams", "public.team", "HasMany", false>;
    }>;
    Player: Table<"public.player", {
      birthday: Prop<"birthday", Date | null, {}, false, false, false>;
      teamId: Prop<"teamId", number | null, {}, false, false, false>;
      positionId: Prop<"positionId", number | null, {}, false, false, false>;
      id: Prop<"id", number, {}, false, true, false>;
      cars: Prop<"cars", any | null, {}, false, false, false>;
      firstName: Prop<"firstName", string, {}, false, false, false>;
      lastName: Prop<"lastName", string, {}, false, false, false>;
      assists: RefProp<"assists", "public.assist", "HasMany", false>;
      gamePlayers: RefProp<"gamePlayers", "public.game_player", "HasMany", false>;
      goals: RefProp<"goals", "public.goal", "HasMany", false>;
      rating: RefProp<"rating", "public.rating", "HasOne", false>;
      position: RefProp<"position", "public.position", "BelongsTo", true>;
      team: RefProp<"team", "public.team", "BelongsTo", true>;
      games: RefProp<"games", "public.game", "BelongsToMany", false>;
    }>;
    Position: Table<"public.position", {
      id: Prop<"id", number, {}, false, true, false>;
      name: Prop<"name", string, {}, false, false, false>;
      players: RefProp<"players", "public.player", "HasMany", false>;
    }>;
    Rating: Table<"public.rating", {
      playerId: Prop<"playerId", number, {}, false, false, false>;
      acceleration: Prop<"acceleration", number, {}, false, false, false>;
      finishing: Prop<"finishing", number, {}, false, false, false>;
      positioning: Prop<"positioning", number, {}, false, false, false>;
      shotPower: Prop<"shotPower", number, {}, false, false, false>;
      freeKick: Prop<"freeKick", number, {}, false, false, false>;
      stamina: Prop<"stamina", number, {}, false, false, false>;
      dribbling: Prop<"dribbling", number, {}, false, false, false>;
      tackling: Prop<"tackling", number, {}, false, false, false>;
      player: RefProp<"player", "public.player", "BelongsTo", false>;
    }>;
    Team: Table<"public.team", {
      id: Prop<"id", number, {}, false, true, false>;
      active: Prop<"active", boolean | null, {}, false, true, false>;
      leagueId: Prop<"leagueId", number | null, {}, false, false, false>;
      name: Prop<"name", string, {}, false, false, false>;
      games: RefProp<"games", "public.game", "HasMany", false>;
      players: RefProp<"players", "public.player", "HasMany", false>;
      league: RefProp<"league", "public.league", "BelongsTo", true>;
    }>;
  };
};