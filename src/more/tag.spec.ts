import raw from "../Raw/raw";
import belongsTo from "../Rel/belongsTo";
import hasMany from "../Rel/hasMany";
import manyToMany from "../Rel/manyToMany";
import rql from "../RqlTag/rql";
import sql from "../SqlTag/sql";
import subselect from "../Sub/subselect";
import tag from "./tag";
import refQLConfig from "../test/refQLConfig";
import compile from "./compile";
import Table from "../Table";

describe ("more `tag` - tag a bunch of query related components (of type RqlTag, SqlTag, Raw, Rel or Table -> SqlTag)", () => {
  test ("tag into RqlTag", () => {
    const getPlayer = rql`
      player { id last_name }
    `;

    const byTeamId = (teamId: number) => (t: Table) => sql`
      where ${t}.team_id = ${teamId}
    `;

    const andLastNameLikeP = sql`
      and last_name like 'P%'
    `;

    const getPlayers = (teamId: number) => tag (
      getPlayer,
      byTeamId (teamId),
      andLastNameLikeP
    );

    const expected = (id: number) => rql`
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

  test ("tag into SqlTag", () => {
    const getPlayer = sql`
      select id, last_name
      from player
    `;

    const byTeamId = (teamId: number) => sql`
      where team_id = ${teamId}
    `;

    const andLastNameLikeP = sql`
      and last_name like 'P%'
    `;

    const getPlayers = (teamId: number) => tag (
      getPlayer,
      byTeamId (teamId),
      andLastNameLikeP
    );

    const expected = (id: number) => sql`
      select id, last_name
      from player
      where team_id = ${id}
      and last_name like 'P%'
    `;

    expect (compile (refQLConfig, getPlayers (1)))
      .toEqual (compile (refQLConfig, expected (1)));
  });

  test ("baseTag is not a RqlTag or a SqlTag", () => {
    const getPlayer = raw (
      "select id, last_name from player"
    );

    const byTeamId = (teamId: number) => sql`
      where team_id = ${teamId}
    `;

    const andLastNameLikeP = sql`
      and last_name like 'P%'
    `;

    const getPlayers = (teamId: number) => tag (
      <any>getPlayer,
      byTeamId (teamId),
      andLastNameLikeP
    );

    expect (() => getPlayers (1))
      .toThrowError (new Error (
        "The first argument passed to `tag` should be of type RqlTag or SqlTag"
      ));
  });

  test ("nested tagging", () => {
    const paginate = (offset: number, limit: number) => tag (
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

    const getGoalCount = (t: Table) => sql`
      select count(*) from "goal"
      where "goal".player_id = ${t}.id
    `;

    const getTeamAndTeammates = tag (
      getTeam,
      hasMany (tag (
        getPlayer,
        (t: Table) => sql`where ${t}.position_id > 5`
      ))
    );

    const getPlayerAndTeam = tag (
      getPlayer,
      raw (`'birthday', "player".birthday`),
      subselect ("goals", getGoalCount),
      belongsTo (getTeamAndTeammates)
    );

    const byTeamId = (teamId: number) => (t: Table) => sql`
      where ${t}.team_id = ${teamId}
    `;

    const andLastNameLikeA = sql`
      and last_name like 'P%'
    `;

    const getPlayers = (teamId: number) => tag (
      getPlayerAndTeam,
      byTeamId (teamId),
      andLastNameLikeA,
      paginate (0, 30),
      manyToMany (getGame)
    );

    const expected = (id: number) => rql`
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