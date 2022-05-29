import refQLConfig from "../test/refQLConfig";
import { DBRef, Refs } from "../types";
import makeRefs from "./makeRefs";

const dbRefs: DBRef[] = [
  {
    tableFrom: "player",
    constraint: "FOREIGN KEY (team_id) REFERENCES team(id) ON DELETE CASCADE"
  },
  {
    tableFrom: "game",
    constraint: "FOREIGN KEY (home_team_id) REFERENCES team(id) ON DELETE CASCADE"
  },
  {
    tableFrom: "game",
    constraint: "FOREIGN KEY (away_team_id) REFERENCES team(id) ON DELETE CASCADE"
  },
  {
    tableFrom: "game",
    constraint: "FOREIGN KEY (won_by) REFERENCES team(id) ON DELETE CASCADE"
  },
  {
    tableFrom: "game",
    constraint: "FOREIGN KEY (league_id) REFERENCES league(id) ON DELETE CASCADE"
  }
];

describe ("refs `makeRefs` - organize detected or provided refs into a map", () => {
  test ("detected refs", () => {
    const refs = makeRefs (refQLConfig, dbRefs);

    const expected: Refs = {
      player: { team: [["team_id", "id" ]] },
      game: {
        league: [["league_id", "id"]],
        "team/1": [["home_team_id", "id"]],
        "team/2": [["away_team_id", "id"]],
        "team/3": [["won_by", "id"]]
      }
    };

    expect (refs).toEqual (expected);
  });

  test ("provided refs", () => {
    const refs = makeRefs ({ ...refQLConfig, detectRefs: false, refs: {
      player: {
        team: [["team_id", "id" ]],
        position: [["position_id", "id" ]]
      },
      goal: {
        player: [["player_id", "id"]]
      },
      game: {
        "team/1": [["home_team_id", "id"]],
        "team/2": [["away_away_team_id", "id"]],
        "team/3": [["lost_by", "id"]],
        "team/4": [["won_by", "id"]]
      }
    } }, dbRefs);

    const expected: Refs = {
      player: {
        team: [["team_id", "id" ]],
        position: [["position_id", "id" ]]
      },
      goal: {
        player: [["player_id", "id"]]
      },
      game: {
        "team/1": [["home_team_id", "id"]],
        "team/2": [["away_away_team_id", "id"]],
        "team/3": [["lost_by", "id"]],
        "team/4": [["won_by", "id"]]
      }
    };

    expect (refs).toEqual (expected);
  });

  test ("both (provided refs overwrite dbRefs)", () => {
    const refs = makeRefs ({ ...refQLConfig, refs: {
      player: {
        team: [["teamId", "id" ]],
        position: [["positionId", "id" ]]
      },
      goal: {
        player: [["playerId", "id"]]
      },
      game: {
        "team/1": [["homeTeamId", "id"]],
        "team/2": [["awayAwayTeamId", "id"]],
        "team/3": [["lostBy", "id"]],
        "team/4": [["wonBy", "id"]]
      }

    } }, dbRefs);

    const expected: Refs = {
      player: {
        team: [["team_id", "id" ]],
        position: [["position_id", "id" ]]
      },
      goal: {
        player: [["player_id", "id"]]
      },
      game: {
        league: [["league_id", "id"]],
        "team/1": [["home_team_id", "id"]],
        "team/2": [["away_away_team_id", "id"]],
        "team/3": [["lost_by", "id"]],
        "team/4": [["won_by", "id"]]
      }
    };

    expect (refs).toEqual (expected);
  });
});