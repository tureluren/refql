import { BelongsTo, BelongsToMany, HasMany, HasOne } from "../nodes";
import Table from "../Table";

const Game = Table ("game");
const GamePlayer = Table ("game_player");
const Goal = Table ("goal");

const Player: Table = Table ("player", [
  () => BelongsTo (Team, {
    as: "team",
    lRef: "team_id",
    rRef: "id"
  }),
  () => BelongsTo (Position, {
    as: "position",
    lRef: "position_id",
    rRef: "id"
  }),
  () => HasOne (Rating, {
    as: "rating",
    lRef: "id",
    rRef: "player_id"
  }),
  () => HasMany (Goal, {
    as: "goals",
    lRef: "id",
    rRef: "player_id"
  }),
  () => BelongsToMany (Game, {
    as: "games",
    lRef: "id",
    rxRef: "player_id",
    lxRef: "game_id",
    rRef: "id",
    xTable: GamePlayer
  })
]);

const Position = Table ("position");

const Rating = Table ("rating");

const Team: Table = Table ("public.team", [
  team => HasMany (Player, {
    as: "players",
    lRef: "id",
    rRef: `${team}_id`
  })
]);

export {
  Game,
  GamePlayer,
  Goal,
  Position,
  Player,
  Rating,
  Team
};