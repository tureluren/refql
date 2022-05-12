"use strict";

const Chance = require ("chance");
const log = require ("npmlog");
const mapDBError = require ("./mapDBError");
const query = require ("./query");

const chance = new Chance ();

const NO_OF_LEAGUES = 6;
const NO_OF_TEAMS_PER_LEAGUE = 10;
const NO_OF_TEAMS = NO_OF_LEAGUES * NO_OF_TEAMS_PER_LEAGUE;
const NO_OF_PLAYERS_PER_TEAM = 11;

const seedLeagues = async () => {
  const leagues = {};
  let idx = 0;

  while (idx < NO_OF_LEAGUES) {
    const country = chance.country ({ full: true }).replace (/'/g, "''");

    if (!leagues[country]) {
      leagues[country] = country + " league";
      idx += 1;
    }
  }

  const sql = Object.keys (leagues).reduce ((acc, key) => {
    const league = leagues[key];
    return `${acc} ('${league}'),`;
  }, 'insert into "league" (name) values').slice (0, -1);;

  await query ('delete from "league"');
  await query ("alter sequence league_id_seq restart with 1");
  await query (sql);

  log.info ("seed leagues", "leagues successfully seeded");
};

const seedTeams = async () => {
  const teams = {};
  let leagueId = 1;

  while (leagueId <= NO_OF_LEAGUES) {
    let idx = 0;

    while (idx < NO_OF_TEAMS_PER_LEAGUE) {
      const city = chance.city ().replace (/'/g, "''");

      if (!teams[city]) {
        teams[city] = { name: "FC " + city, leagueId };
        idx += 1;
      }
    }

    leagueId += 1;
  }

  const sql = Object.keys (teams).reduce ((acc, key) => {
    const team = teams[key];
    return `${acc} ('${team.name}', ${team.leagueId}),`;
  }, 'insert into "team" (name, league_id) values').slice (0, -1);;

  await query ('delete from "team"');
  await query ("alter sequence team_id_seq restart with 1");
  await query (sql);

  log.info ("seed teams", "teams successfully seeded");
};

const seedPlayers = async () => {
  const players = {};
  let teamId = 1;

  while (teamId <= NO_OF_TEAMS) {
    let idx = 0;

    while (idx < NO_OF_PLAYERS_PER_TEAM) {
      const firstName = chance.first ().replace (/'/g, "''");
      const lastName = chance.last ().replace (/'/g, "''");
      const fullName = firstName + " " + lastName;
      const positionId = idx + 1;
      const birthday = chance.birthday ({ string: true, year: chance.year ({ min: 1985, max: 2004 }) });

      if (!players[fullName]) {
        players[fullName] = { firstName, lastName, teamId, positionId, birthday };
        idx += 1;
      }
    }

    teamId += 1;
  }

  const sql = Object.keys (players).reduce ((acc, key) => {
    const player = players[key];
    return `${acc} ('${player.firstName}', '${player.lastName}', ${player.teamId}, ${player.positionId}, '${player.birthday}'),`;
  }, 'insert into "player" (first_name, last_name, team_id, position_id, birthday) values').slice (0, -1);;

  await query ('delete from "player"');
  await query ("alter sequence player_id_seq restart with 1");
  await query (sql);

  log.info ("seed players", "players successfully seeded");
};

const getPlayers = (gameId, teamId) => {
  const players = [];

  for (let idx = 1; idx <= NO_OF_PLAYERS_PER_TEAM; idx++) {
    const playerId =
      (teamId - 1) * NO_OF_PLAYERS_PER_TEAM + idx;

    players.push ({
      playerId,
      gameId
    });
  }

  return players;
};

const getGoals = (gameId, teamId, noOfGoals) => {
  const goals = [];

  for (let idx = 0; idx < noOfGoals; idx++) {
    const minute = chance.integer ({ min: 1, max: 90 });
    const baseId = (teamId - 1) * NO_OF_PLAYERS_PER_TEAM;
    const ownGoal = chance.integer ({ min: 1, max: 25 }) === 13;

    // assuming that only players on midfield and attacking positions can score goals
    const playerId = baseId + chance.integer ({ min: 6, max: NO_OF_PLAYERS_PER_TEAM });

    let invalidAssist = true;
    let assistPlayerId;

    while (invalidAssist) {
      // assuming that goalkeepers can't make an assist
      assistPlayerId = baseId + chance.integer ({ min: 2, max: NO_OF_PLAYERS_PER_TEAM });

      if (playerId !== assistPlayerId) {
        invalidAssist = false;
      }
    }

    goals.push ({
      gameId,
      playerId,
      minute,
      assistPlayerId,
      ownGoal
    });
  }

  return goals;
};

const seedGames = async () => {
  const games = [];
  let leagueId = 1;

  while (leagueId <= NO_OF_LEAGUES) {
    let homeTeamIdx = 1;

    while (homeTeamIdx <= NO_OF_TEAMS_PER_LEAGUE) {
      let awayTeamIdx = 1;

      while (awayTeamIdx <= NO_OF_TEAMS_PER_LEAGUE) {

        if (homeTeamIdx !== awayTeamIdx) {
          const baseId = (leagueId - 1) * NO_OF_TEAMS_PER_LEAGUE;
          const homeTeamId = baseId + homeTeamIdx;
          const awayTeamId = baseId + awayTeamIdx;
          const noOfHomeTeamGoals = chance.integer ({ min: 0, max: 5 });
          const noOfAwayTeamGoals = chance.integer ({ min: 0, max: 5 });
          const gameId = games.length + 1;

          const homeTeamGoals = getGoals (gameId, homeTeamId, noOfHomeTeamGoals);
          const awayTeamGoals = getGoals (gameId, awayTeamId, noOfAwayTeamGoals);

          const homeTeamPlayers = getPlayers (gameId, homeTeamId);
          const AwayTeamPlayers = getPlayers (gameId, awayTeamId);

          games.push ({
            leagueId,
            homeTeamId,
            awayTeamId,
            result: `${noOfHomeTeamGoals} - ${noOfAwayTeamGoals}`,
            goals: homeTeamGoals
              .concat (awayTeamGoals)
              .sort ((goal1, goal2) => goal1.minute - goal2.minute),
            players: homeTeamPlayers
              .concat (AwayTeamPlayers)
          });
        }

        awayTeamIdx += 1;
      }

      homeTeamIdx += 1;
    }

    leagueId += 1;
  }

  const goals = games.flatMap (game => game.goals);
  const assists = [];

  goals.forEach ((goal, idx) => {
    assists.push ({
      goalId: idx + 1,
      gameId: goal.gameId,
      playerId: goal.assistPlayerId
    });
  });

  const gamesSql = games.reduce ((acc, game) => {
    return `${acc} (${game.homeTeamId}, ${game.awayTeamId}, ${game.leagueId}, '${game.result}'),`;
  }, 'insert into "game" (home_team_id, away_team_id, league_id, result) values').slice (0, -1);;

  const goalsSql = goals.reduce ((acc, goal) => {
    return `${acc} (${goal.gameId}, ${goal.playerId}, ${goal.minute}, ${goal.ownGoal}),`;
  }, 'insert into "goal" (game_id, player_id, minute, own_goal) values').slice (0, -1);;

  const assistsSql = assists.reduce ((acc, assist) => {
    return `${acc} (${assist.goalId}, ${assist.gameId}, ${assist.playerId}),`;
  }, 'insert into "assist" (goal_id, game_id, player_id) values').slice (0, -1);;

  const playersSql = games.flatMap (game => game.players).reduce ((acc, player) => {
    return `${acc} (${player.playerId}, ${player.gameId}),`;
  }, 'insert into "player_game" (player_id, game_id) values').slice (0, -1);;

  await query ('delete from "game"');
  await query ("alter sequence game_id_seq restart with 1");
  await query (gamesSql);

  log.info ("seed games", "games successfully seeded");

  await query ('delete from "goal"');
  await query ("alter sequence goal_id_seq restart with 1");
  await query (goalsSql);

  log.info ("seed goals", "goals successfully seeded");

  await query ('delete from "assist"');
  await query ("alter sequence assist_id_seq restart with 1");
  await query (assistsSql);

  log.info ("seed assists", "assists successfully seeded");

  await query ('delete from "player_game"');
  await query (playersSql);

  log.info ("seed player_games", "player_games successfully seeded");
};

const seed = async () => {
  try {
    await seedLeagues ();
    await seedTeams ();
    await seedPlayers ();
    await seedGames ();

    process.exit (0);
  } catch (err) {
    const errMessage = mapDBError (err);
    log.error ("seed data", errMessage);
    process.exit (5);
  }
};

seed ();