import raw from "../Raw/raw";
import belongsTo from "../Rel/belongsTo";
import hasMany from "../Rel/hasMany";
import manyToMany from "../Rel/manyToMany";
import rql from "../RQLTag/rql";
import sql from "../SQLTag/sql";
import subselect from "../Sub/subselect";
import tag from "./tag";
import refQLConfig from "../test/refQLConfig";
import compile from "./compile";

describe ("more `tag` - tag a bunch of query related components (of type RQLTag, SQLTag, Raw, Rel or Table -> SQLTag)", () => {
  test ("tag into RQLTag", () => {
    const getPlayer = rql`
      player { id last_name }
    `;

    const byTeamId = teamId => t => sql`
      where ${t}.team_id = ${teamId}
    `;

    const andLastNameLikeP = sql`
      and last_name like 'P%'
    `;

    const getPlayers = teamId => tag (
      getPlayer,
      byTeamId (teamId),
      andLastNameLikeP
    );

    const expected = id => rql`
      player { 
        id 
        last_name
        ${t => sql`
          where ${t}.team_id = ${id}
        `}
        ${sql`
          and last_name like 'P%'
        `}
      }
    `;

    const [query1, values1] = compile (refQLConfig, getPlayers (1));
    const [query2, values2] = compile (refQLConfig, expected (1));

    expect (query1).toEqual (query2);
    expect (values1).toEqual (values2);
  });

  test ("tag into SQLTag", () => {
    const getPlayer = sql`
      select id, last_name
      from player
    `;

    const byTeamId = teamId => sql`
      where team_id = ${teamId}
    `;

    const andLastNameLikeP = sql`
      and last_name like 'P%'
    `;

    const getPlayers = teamId => tag (
      getPlayer,
      byTeamId (teamId),
      andLastNameLikeP
    );

    const expected = id => sql`
      select id, last_name
      from player
      where team_id = ${id}
      and last_name like 'P%'
    `;

    expect (compile (refQLConfig, getPlayers (1)))
      .toEqual (compile (refQLConfig, expected (1)));
  });

  test ("baseTag is not a RQLTag or a SQLTag", () => {
    const getPlayer = raw (
      "select id, last_name from player"
    );

    const byTeamId = teamId => sql`
      where team_id = ${teamId}
    `;

    const andLastNameLikeP = sql`
      and last_name like 'P%'
    `;

    const getPlayers = teamId => tag (
      <any>getPlayer,
      byTeamId (teamId),
      andLastNameLikeP
    );

    expect (() => getPlayers (1))
      .toThrowError (new Error (
        "The first argument passed to `tag` should be of type RQLTag or SQLTag"
      ));
  });

  test ("nested tagging", () => {
    const paginate = (offset, limit) => tag (
      sql`offset ${offset}`,
      sql`limit ${limit}`
    );

    const getPlayer = rql`
      player { id last_name }
    `;

    const getTeam = rql`
      team { id name }
    `;

    const getGame = rql`
      game { id result }
    `;

    const getGoalCount = t => sql`
      select count(*) from "goal"
      where "goal".player_id = ${t}.id
    `;

    const getTeamAndTeammates = tag (
      getTeam,
      hasMany (tag (
        getPlayer,
        t => sql`where ${t}.position_id > 5`
      ))
    );

    const getPlayerAndTeam = tag (
      getPlayer,
      raw (`'birthday', "player".birthday`),
      subselect ("goals", getGoalCount),
      belongsTo (getTeamAndTeammates)
    );

    const byTeamId = teamId => t => sql`
      where ${t}.team_id = ${teamId}
    `;

    const andLastNameLikeA = sql`
      and last_name like 'P%'
    `;

    const getPlayers = teamId => tag (
      getPlayerAndTeam,
      byTeamId (teamId),
      andLastNameLikeA,
      paginate (0, 30),
      manyToMany (getGame)
    );

    const expected = id => rql`
      player { 
        id 
        last_name
        ${raw (`'birthday', "player".birthday`)}
        & goals ${t => sql`
          select count(*) from "goal"
          where "goal".player_id = ${t}.id
        `}
        - team {
          id
          name
          < player {
            id
            last_name
            ${t => sql`where ${t}.position_id > 5`}
          }
        }
        ${t => sql`
          where ${t}.team_id = ${id}
        `}
        ${sql`
          and last_name like 'P%'
        `}
        ${sql`offset ${0}`}
        ${sql`limit ${30}`}
        x game {
          id
          result
        }
      }
    `;

    const [query1, values1] = compile (refQLConfig, getPlayers (1));
    const [query2, values2] = compile (refQLConfig, expected (1));

    expect (query1).toEqual (query2);
    expect (values1).toEqual (values2);
  });
});