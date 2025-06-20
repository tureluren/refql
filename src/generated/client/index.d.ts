import Prop from "../../Prop";
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
};