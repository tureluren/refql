import JBOInterpreter from ".";
import raw from "../Raw/raw";
import rql from "../RqlTag/rql";
import sql from "../SqlTag/sql";
import Table from "../Table";
import format from "../test/format";
import { ASTType, Refs } from "../types";

describe ("JBOInterpreter type", () => {
  test ("init JBOInterpreter", () => {
    const refs: Refs = {
      player: { team: [["playerId", "id"]] }
    };

    const interpreter = new JBOInterpreter (refs, true);

    expect (interpreter.refs).toBe (refs);
  });

  test ("table and members", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" }
      ]
    };

    // @ts-ignore
    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object('id', "player".id, 'lastName', "player".last_name)
      from "player" "player"
    `));

    expect (values).toEqual ([]);
  });

  test ("identifier cast", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        { type: "Identifier", name: "id", as: "id", cast: "text" },
        { type: "Identifier", name: "last_name", as: "lastName" }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object('id', "player".id::text, 'lastName', "player".last_name)
      from "player" "player"
    `));

    expect (values).toEqual ([]);
  });

  test ("has many - invalid clause", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "p",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" },
        {
          type: "HasMany",
          include: {
            type: "AST",
            name: "goal",
            as: "points",
            orderBy: <any>"order by name",
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "minute", as: "minute" }
            ]
          }
        }
      ]
    };

    expect (() => interpreter.interpret (ast))
      .toThrowError (new Error ("`orderBy` should be a sql snippet or a function that returns a sql snippet"));
  });

  test ("has many - links guessed", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "p",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" },
        {
          type: "HasMany",
          include: {
            type: "AST",
            name: "goal",
            as: "points",
            orderBy: t => sql`order by ${t}.minute`,
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "minute", as: "minute" }
            ]
          }
        }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "p".id, 'lastName', "p".last_name,
        'points', (
          select coalesce(json_agg(json_build_object(
            'id', "points".id, 'minute', "points".minute
          ) order by "points".minute), '[]'::json)
          from "goal" "points" where "points".player_id = "p".id
        )
      )
      from "player" "p"
    `));

    expect (values).toEqual ([]);
  });

  test ("has many - links provided to interpreter", () => {
    const interpreter = new JBOInterpreter (
      { goal: { player: [["player_id_2", "id_2"]] } },
      true
    );

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "p",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" },
        {
          type: "HasMany",
          include: {
            type: "AST",
            name: "goal",
            as: "points",
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "minute", as: "minute" }
            ]
          }
        }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "p".id, 'lastName', "p".last_name,
        'points', (
          select coalesce(json_agg(json_build_object(
            'id', "points".id, 'minute', "points".minute
          )), '[]'::json)
          from "goal" "points"
          where "points".player_id_2 = "p".id_2
        )
      ) from "player" "p"
    `));

    expect (values).toEqual ([]);
  });


  test ("has many - links provided in TL", () => {
    const interpreter = new JBOInterpreter (
      { goal: { player: [["player_id_2", "id_2"]] } },
      true
    );

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "p",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" },
        {
          type: "HasMany",
          include: {
            type: "AST",
            name: "goal",
            as: "points",
            links: [["player_id_3", "id_3"]],
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "minute", as: "minute" }
            ]
          }
        }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "p".id, 'lastName', "p".last_name,
        'points', (
          select coalesce(json_agg(json_build_object(
            'id', "points".id, 'minute', "points".minute
          )), '[]'::json)
          from "goal" "points" where "points".player_id_3 = "p".id_3
        )
      )
      from "player" "p"
    `));

    expect (values).toEqual ([]);
  });

  test ("belongs to - links guessed", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "p",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" },
        {
          type: "BelongsTo",
          include: {
            type: "AST",
            name: "team",
            as: "squad",
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "name", as: "name" }
            ]
          }
        }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "p".id, 'lastName', "p".last_name,
        'squad', (
          select json_build_object(
            'id', "squad".id, 'name', "squad".name
          )
          from "team" "squad" where "p".team_id = "squad".id
        )
      ) from "player" "p"
    `));

    expect (values).toEqual ([]);
  });

  test ("belongs to - links provided to interpreter", () => {
    const interpreter = new JBOInterpreter (
      { player: { team: [["team_id_2", "id_2"]] } },
      true
    );

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "p",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" },
        {
          type: "BelongsTo",
          include: {
            type: "AST",
            name: "team",
            as: "squad",
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "name", as: "name" }
            ]
          }
        }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "p".id, 'lastName', "p".last_name,
        'squad', (
          select json_build_object(
            'id', "squad".id, 'name', "squad".name
          )
          from "team" "squad"
          where "p".team_id_2 = "squad".id_2
        )
      ) from "player" "p"
    `));

    expect (values).toEqual ([]);
  });

  test ("belongs to - links provided in TL", () => {
    const interpreter = new JBOInterpreter (
      { player: { team: [["team_id_2", "id_2"]] } },
      true
    );

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "p",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" },
        {
          type: "BelongsTo",
          include: {
            type: "AST",
            name: "team",
            as: "squad",
            links: [["team_id_3", "id_3"]],
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "name", as: "name" }
            ]
          }
        }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "p".id, 'lastName', "p".last_name,
        'squad', (
          select json_build_object(
            'id', "squad".id, 'name', "squad".name
          )
          from "team" "squad"
          where "p".team_id_3 = "squad".id_3
        )
      )
      from "player" "p"
    `));

    expect (values).toEqual ([]);
  });

  test ("belongs to - links provided to interpreter found by alias", () => {
    const interpreter = new JBOInterpreter ({
      game: {
        "team/1": [["home_team_id", "id"]],
        "team/2": [["away_team_id", "id"]]
      }
    }, true);

    const ast: ASTType = {
      type: "AST",
      name: "game",
      as: "game",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        {
          type: "BelongsTo",
          include: {
            type: "AST",
            name: "team",
            as: "homeTeam",
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "name", as: "name" }
            ]
          }
        },
        {
          type: "BelongsTo",
          include: {
            type: "AST",
            name: "team",
            as: "away_team",
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "name", as: "name" }
            ]
          }
        }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "game".id,
        'homeTeam', (
          select json_build_object(
            'id', "homeTeam".id, 'name', "homeTeam".name
          )
          from "team" "homeTeam"
          where "game".home_team_id = "homeTeam".id
        ),
        'away_team', (
          select json_build_object(
            'id', "away_team".id, 'name', "away_team".name
          )
          from "team" "away_team" 
          where "game".away_team_id = "away_team".id
        )
      )
      from "game" "game"
    `));

    expect (values).toEqual ([]);
  });

  test ("many to many - invalid clause", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "p",
      members: [{
        type: "ManyToMany",
        include: {
          type: "AST",
          name: "game",
          as: "games",
          orderBy: <any>"order by result",
          members: [{ type: "Identifier", name: "id", as: "id" }]
        }
      }]
    };

    expect (() => interpreter.interpret (ast))
      .toThrowError (new Error ("`orderBy` should be a sql snippet or a function that returns a sql snippet"));

    const ast2: ASTType = {
      type: "AST",
      name: "player",
      as: "p",
      members: [{
        type: "ManyToMany",
        include: {
          type: "AST",
          name: "game",
          as: "games",
          orderBy: <any>((_t: Table) => "order by result"),
          members: [{ type: "Identifier", name: "id", as: "id" }]
        }
      }]
    };

    expect (() => interpreter.interpret (ast2))
      .toThrowError (new Error ("Only functions that return a sql snippet are allowed"));
  });

  test ("many to many - links guessed - x guessed", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "p",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" },
        {
          type: "ManyToMany",
          include: {
            type: "AST",
            name: "game",
            as: "games",
            orderBy: t => sql`order by ${t}.result`,
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "result", as: "result" }
            ]
          }
        }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "p".id, 'lastName', "p".last_name,
        'games', (
          select coalesce(json_agg(json_build_object(
            'id', "games".id, 'result', "games".result
          ) order by "games".result), '[]'::json)
          from "player_game" "player_game"
          join "game" "games" on "player_game".game_id = "games".id
          where "player_game".player_id = "p".id
        )
      )
      from "player" "p"
    `));

    expect (values).toEqual ([]);
  });

  test ("many to many - refs provided to interpreter", () => {
    const interpreter = new JBOInterpreter ({
      lineup: { player: [["player_id_2", "id_p_2"]], game: [["game_id_2", "id_g_2"]] }
    }, true);

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "p",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" },
        {
          type: "ManyToMany",
          include: {
            type: "AST",
            name: "game",
            as: "games",
            xTable: "lineup",
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "result", as: "result" }
            ]
          }
        }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "p".id, 'lastName', "p".last_name,
        'games', (
          select coalesce(json_agg(json_build_object(
            'id', "games".id, 'result', "games".result
          )), '[]'::json)
          from "lineup" "lineup"
          join "game" "games" on "lineup".game_id_2 = "games".id_g_2
          where "lineup".player_id_2 = "p".id_p_2
        )
      )
      from "player" "p"
    `));

    expect (values).toEqual ([]);
  });

  test ("many to many - refs provided in TL", () => {
    const interpreter = new JBOInterpreter ({
      lineup: { player: [["player_id_2", "id_p_2"]], game: [["game_id_2", "id_g_2"]] }
    }, true);

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "p",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" },
        {
          type: "ManyToMany",
          include: {
            type: "AST",
            name: "game",
            as: "games",
            xTable: "lineup",
            refs: { player: [["player_id_3", "id_p_3"]], game: [["game_id_3", "id_g_3"]] },
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "result", as: "result" }
            ]
          }
        }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "p".id, 'lastName', "p".last_name,
        'games', (
          select coalesce(json_agg(json_build_object(
            'id', "games".id, 'result', "games".result
          )), '[]'::json)
          from "lineup" "lineup"
          join "game" "games" on "lineup".game_id_3 = "games".id_g_3
          where "lineup".player_id_3 = "p".id_p_3
        )
      )
      from "player" "p"
    `));

    expect (values).toEqual ([]);
  });

  test ("many to many - refs provided to interpreter found by reversing guessed x", () => {
    const interpreter = new JBOInterpreter ({
      player_game: {
        player: [["player_id_2", "id_2"]],
        game: [["game_id_2", "id_2"]]
      }
    }, true);

    // guessed x = game_player
    const ast: ASTType = {
      type: "AST",
      name: "game",
      as: "game",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        {
          type: "ManyToMany",
          include: {
            type: "AST",
            name: "player",
            as: "teammates",
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "last_name", as: "lastName" }
            ]
          }
        }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "game".id,
        'teammates', (
          select coalesce(json_agg(json_build_object(
            'id', "teammates".id, 'lastName', "teammates".last_name
          )), '[]'::json)
          from "player_game" "player_game"
          join "player" "teammates" on "player_game".player_id_2 = "teammates".id_2
          where "player_game".game_id_2 = "game".id_2
        )
      )
      from "game" "game"
    `));

    expect (values).toEqual ([]);
  });

  test ("many to many - x provided in TL", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "p",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" },
        {
          type: "ManyToMany",
          include: {
            type: "AST",
            name: "game",
            as: "games",
            xTable: "lineup",
            orderBy: t => sql`order by ${t}.result`,
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "result", as: "result" }
            ]
          }
        }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "p".id, 'lastName', "p".last_name,
        'games', (
          select coalesce(json_agg(json_build_object(
            'id', "games".id, 'result', "games".result
          ) order by "games".result), '[]'::json)
          from "lineup" "lineup"
          join "game" "games" on "lineup".game_id = "games".id
          where "lineup".player_id = "p".id
        )
      )
      from "player" "p"
    `));

    expect (values).toEqual ([]);
  });

  test ("many to many - refs provided to interpreter found by reversing provided x in TL", () => {
    const interpreter = new JBOInterpreter ({
      player_game: {
        player: [["player_id_2", "id_2"]],
        game: [["game_id_2", "id_2"]]
      }
    }, true);

    // guessed x = game_player
    const ast: ASTType = {
      type: "AST",
      name: "game",
      as: "game",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        {
          type: "ManyToMany",
          include: {
            type: "AST",
            name: "player",
            as: "teammates",
            xTable: "player_game",
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "last_name", as: "lastName" }
            ]
          }
        }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "game".id,
        'teammates', (
          select coalesce(json_agg(json_build_object(
            'id', "teammates".id, 'lastName', "teammates".last_name
          )), '[]'::json)
          from "player_game" "player_game"
          join "player" "teammates" on "player_game".player_id_2 = "teammates".id_2
          where "player_game".game_id_2 = "game".id_2
        )
      )
      from "game" "game"
    `));

    expect (values).toEqual ([]);
  });

  test ("relation combo", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "p",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" },
        {
          type: "HasMany",
          include: {
            type: "AST",
            name: "goal",
            as: "points",
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "minute", as: "minute" }
            ]
          }
        },
        {
          type: "BelongsTo",
          include: {
            type: "AST",
            name: "team",
            as: "squad",
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "name", as: "name" }
            ]
          }
        },
        {
          type: "ManyToMany",
          include: {
            type: "AST",
            name: "game",
            as: "games",
            xTable: "lineup",
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "result", as: "result" }
            ]
          }
        }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "p".id, 'lastName', "p".last_name,
        'points', (
          select coalesce(json_agg(json_build_object(
            'id', "points".id, 'minute', "points".minute
          )), '[]'::json) from "goal" "points"
          where "points".player_id = "p".id
        ),
        'squad', (
          select json_build_object(
            'id', "squad".id, 'name', "squad".name
          )
          from "team" "squad"
          where "p".team_id = "squad".id
        ),
        'games', (
          select coalesce(json_agg(json_build_object(
            'id', "games".id, 'result', "games".result
          )), '[]'::json)
          from "lineup" "lineup"
          join "game" "games" on "lineup".game_id = "games".id
          where "lineup".player_id = "p".id
        )
      )
      from "player" "p"
    `));

    expect (values).toEqual ([]);
  });

  test ("nested relations", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" },
        {
          type: "BelongsTo",
          include: {
            type: "AST",
            name: "team",
            as: "team",
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "name", as: "name" },
              {
                type: "HasMany",
                include: {
                  type: "AST",
                  name: "player",
                  as: "teammates",
                  members: [
                    { type: "Identifier", name: "id", as: "id" },
                    { type: "Identifier", name: "last_name", as: "lastName" }
                  ]
                }
              }
            ]
          }
        },
        {
          type: "HasMany",
          include: {
            type: "AST",
            name: "goal",
            as: "goals",
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "minute", as: "minute" },
              {
                type: "BelongsTo",
                include: {
                  type: "AST",
                  name: "game",
                  as: "game",
                  members: [
                    { type: "Identifier", name: "id", as: "id" },
                    {
                      type: "BelongsTo",
                      include: {
                        type: "AST",
                        name: "team",
                        as: "homeTeam",
                        links: [["home_team_id", "id"]],
                        members: [
                          { type: "Identifier", name: "id", as: "id" },
                          { type: "Identifier", name: "name", as: "name" }
                        ]
                      }
                    },
                    {
                      type: "BelongsTo",
                      include: {
                        type: "AST",
                        name: "team",
                        as: "awayTeam",
                        links: [["away_team_id", "id"]],
                        members: [
                          { type: "Identifier", name: "id", as: "id" },
                          { type: "Identifier", name: "name", as: "name" }
                        ]
                      }
                    },
                    {
                      type: "ManyToMany",
                      include: {
                        type: "AST",
                        name: "player",
                        as: "teammates",
                        xTable: "player_game",
                        members: [
                          { type: "Identifier", name: "id", as: "id" },
                          { type: "Identifier", name: "last_name", as: "lastName" }
                        ]
                      }
                    }
                  ]
                }
              }
            ]
          }
        },
        {
          type: "ManyToMany",
          include: {
            type: "AST",
            name: "game",
            as: "games",
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "result", as: "result" },
              {
                type: "BelongsTo",
                include: {
                  type: "AST",
                  name: "league",
                  as: "league",
                  members: [
                    { type: "Identifier", name: "id", as: "id" },
                    { type: "Identifier", name: "name", as: "name" }
                  ]
                }
              }
            ]
          }
        }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "player".id, 'lastName', "player".last_name,
        'team', (
          select json_build_object(
            'id', "team".id, 'name', "team".name,
            'teammates', (
              select coalesce(json_agg(json_build_object(
                'id', "teammates".id, 'lastName', "teammates".last_name
              )), '[]'::json)
              from "player" "teammates"
              where "teammates".team_id = "team".id
            )
          )
          from "team" "team"
          where "player".team_id = "team".id
        ),
        'goals', (
          select coalesce(json_agg(json_build_object(
            'id', "goals".id, 'minute', "goals".minute,
            'game', (
              select json_build_object(
                'id', "game".id,
                'homeTeam', (
                  select json_build_object(
                    'id', "homeTeam".id, 'name', "homeTeam".name
                  )
                  from "team" "homeTeam"
                  where "game".home_team_id = "homeTeam".id
                ),
                'awayTeam', (
                  select json_build_object(
                    'id', "awayTeam".id, 'name', "awayTeam".name
                  )
                  from "team" "awayTeam" 
                  where "game".away_team_id = "awayTeam".id
                ),
                'teammates', (
                  select coalesce(json_agg(json_build_object(
                    'id', "teammates".id, 'lastName', "teammates".last_name
                  )), '[]'::json)
                  from "player_game" "player_game"
                  join "player" "teammates" on "player_game".player_id = "teammates".id
                  where "player_game".game_id = "game".id
                )
              )
              from "game" "game"
              where "goals".game_id = "game".id
            )
          )), '[]'::json)
          from "goal" "goals"
          where "goals".player_id = "player".id
        ),
        'games', (
          select coalesce(json_agg(json_build_object(
            'id', "games".id, 'result', "games".result,
            'league', (
              select json_build_object(
                'id', "league".id, 'name', "league".name
              )
              from "league" "league"
              where "games".league_id = "league".id
            )
          )), '[]'::json)
          from "player_game" "player_game"
          join "game" "games" on "player_game".game_id = "games".id
          where "player_game".player_id = "player".id
        )
      )
      from "player" "player"
    `));

    expect (values).toEqual ([]);
  });

  test ("finding has many links", () => {
    const interpreter = new JBOInterpreter ({
      goal: { player: [["player_id", "id"]] }
    }, true);

    expect (
      interpreter.findHasManyLinks ("goal", "player")
    ).toEqual ([["player_id", "id"]]);

    expect (
      interpreter.findHasManyLinks ("goal", "team")
    ).toEqual (undefined);

    expect (
      interpreter.findHasManyLinks ("game", "team")
    ).toEqual (undefined);

    expect (
      interpreter.findHasManyLinks (<any>undefined, "player")
    ).toEqual (undefined);
  });

  test ("finding belongs to links", () => {
    const interpreter = new JBOInterpreter ({
      player: { team: [["team_id", "id"]] },
      game: {
        "team/1": [["home_team_id", "id"]],
        "team/2": [["away_team_id", "id"]]
      }
    }, true);

    expect (
      interpreter.findBelongsToLinks ("player", "team", "team")
    ).toEqual ([["team_id", "id"]]);

    expect (
      interpreter.findBelongsToLinks ("game", "team", "homeTeam")
    ).toEqual ([["home_team_id", "id"]]);

    expect (
      interpreter.findBelongsToLinks ("game", "team", "home_team")
    ).toEqual ([["home_team_id", "id"]]);

    expect (
      interpreter.findBelongsToLinks ("game", "team", "home_Team")
    ).toEqual ([["home_team_id", "id"]]);

    expect (
      interpreter.findBelongsToLinks ("game", "team", "hometeam")
    ).toEqual ([["home_team_id", "id"]]);

    expect (
      interpreter.findBelongsToLinks ("game", "tam", "homeTeam")
    ).toEqual (undefined);
  });

  test ("not finding belongs to links - useSmartAlias = false", () => {
    const interpreter = new JBOInterpreter ({
      player: { team: [["team_id", "id"]] },
      game: {
        "team/1": [["home_team_id", "id"]],
        "team/2": [["away_team_id", "id"]]
      }
    }, false);

    expect (
      interpreter.findBelongsToLinks ("player", "team", "team")
    ).toEqual ([["team_id", "id"]]);

    expect (
      interpreter.findBelongsToLinks ("game", "team", "homeTeam")
    ).toEqual (undefined);

    expect (
      interpreter.findBelongsToLinks ("game", "team", "home_team")
    ).toEqual (undefined);

    expect (
      interpreter.findBelongsToLinks ("game", "team", "home_Team")
    ).toEqual (undefined);

    expect (
      interpreter.findBelongsToLinks ("game", "team", "hometeam")
    ).toEqual (undefined);
  });

  test ("finding many to many links", () => {
    const interpreter = new JBOInterpreter ({
      player_game: {
        player: [["player_id", "id"]],
        game: [["game_id", "id"]]
      }
    }, true);

    expect (
      interpreter.findManyToManyLinks ("player_game", "player", "player")
    ).toEqual ([[["player_id", "id"]], false]);

    expect (
      interpreter.findManyToManyLinks ("game_player", "player", "player_game")
    ).toEqual ([[["player_id", "id"]], true]);

    expect (
      interpreter.findManyToManyLinks ("game_player", "team", "player_game")
    ).toEqual ([undefined, false]);

    expect (
      interpreter.findManyToManyLinks ("game_player", "player", "lineup")
    ).toEqual ([undefined, false]);
  });

  test ("subselecting", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const subselect = (t: Table) => sql`
      select count(*) 
      from goal
      where player_id = ${t}.id
    `;

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        {
          type: "Subselect",
          name: "goal_count",
          as: "goalCount",
          tag: subselect
        }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'goalCount', (select count(*) from goal where player_id = "player".id)
      )
      from "player" "player"
    `));

    expect (values).toEqual ([]);
  });

  test ("subselecting with variables", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const subselect = (t: Table) => sql`
      select count(*) 
      from goal
      where player_id = ${t}.id
      and own_goal = ${false}
    `;

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        {
          type: "Subselect",
          name: "goal_count",
          as: "goalCount",
          tag: subselect
        }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'goalCount', (select count(*) from goal where player_id = "player".id and own_goal = $1)
      )
      from "player" "player"
    `));

    expect (values).toEqual ([false]);
  });

  test ("invalid subselect", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const subselect: any = (t: Table) => `
      select count(*) 
      from goal
      where player_id = ${t}.id
    `;

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        {
          type: "Subselect",
          name: "goal_count",
          as: "goalCount",
          tag: subselect
        }
      ]
    };

    expect (() => interpreter.interpret (ast))
      .toThrowError (new Error ("Only functions that return a sql snippet are allowed"));

    const subselect2: any = `
      select count(*) 
      from goal
      where player_id = id
    `;

    const ast2: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        {
          type: "Subselect",
          name: "goal_count",
          as: "goalCount",
          tag: subselect2
        }
      ]
    };

    expect (() => interpreter.interpret (ast2))
      .toThrowError (new Error ("A subselect should be a sql snippet or a function that returns a sql snippet"));
  });

  test ("function calls", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        {
          type: "Call",
          name: "age",
          as: "age",
          args: [{ type: "Identifier", name: "birthday", as: "birthday" }]
        },
        {
          type: "Call",
          name: "concat",
          as: "fullName",
          args: [
            { type: "Identifier", name: "first_name", as: "firstName" },
            { type: "StringLiteral", value: " ", as: " " },
            { type: "Identifier", name: "last_name", as: "lastName" }
          ]
        }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "player".id, 'age', age("player".birthday),
        'fullName', concat("player".first_name, ' ', "player".last_name)
      )
      from "player" "player"
    `));

    expect (values).toEqual ([]);
  });

  test ("function calls with raw variables", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const birthday = raw ("birthday");

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        {
          type: "Call",
          name: "age",
          as: "age",
          args: [{ type: "Variable", idx: 0, value: birthday }]
        }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object('id', "player".id, 'age', age(birthday))
      from "player" "player"
    `));

    expect (values).toEqual ([]);
  });

  test ("nested function calls and variables", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const positionSnippet = (t: Table) =>
      sql`(select name from position where id = ${t}.position_id)`;

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        {
          type: "Call",
          name: "date_part",
          as: "age",
          cast: "text",
          args: [
            { type: "StringLiteral", value: "year", as: "year" },
            {
              type: "Call",
              name: "age",
              as: "age",
              args: [{ type: "Identifier", name: "birthday", as: "birthday" }]
            }
          ]
        },
        {
          type: "Call",
          name: "concat",
          as: "fullNameAndPosition",
          args: [
            {
              type: "Call",
              name: "upper",
              as: "upper",
              args: [{ type: "Identifier", name: "first_name", as: "firstName" }]
            },
            { type: "StringLiteral", value: " ", as: " " },
            {
              type: "Call",
              name: "upper",
              as: "upper",
              args: [
                {
                  type: "Call",
                  name: "lower",
                  as: "lower",
                  args: [{ type: "Identifier", name: "last_name", as: "lastName" }]
                }
              ]
            },
            { type: "StringLiteral", value: ", ", as: ". " },
            { type: "Variable", idx: 0, value: positionSnippet }
          ]
        }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "player".id,
        'age', date_part('year', age("player".birthday))::text,
        'fullNameAndPosition', concat(
          upper("player".first_name), ' ', upper(lower("player".last_name)), ', ', (select name from position where id = "player".position_id)
        )
      )
      from "player" "player"
    `));

    expect (values).toEqual ([]);
  });

  test ("invalid Variables", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const rqlSnippet1 = rql`
      x game { id result }
    `;

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" },
        { type: "Variable", idx: 0, value: rqlSnippet1 }
      ]
    };

    expect (() => interpreter.interpret (ast))
      .toThrowError (new Error ("You can't nest RQL tags"));

    const rqlSnippet2 = (_t: Table) => rql`
      x game { id result }
    `;

    const ast2: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" },
        { type: "Variable", idx: 0, value: rqlSnippet2 }
      ]
    };

    expect (() => interpreter.interpret (ast2))
      .toThrowError (
        new Error ("Only functions that return a sql snippet are allowed")
      );

    const stringSnippet = (_t: Table) =>
      "x game { id result }";

    const ast3: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" },
        { type: "Variable", idx: 0, value: stringSnippet }
      ]
    };

    expect (() => interpreter.interpret (ast3))
      .toThrowError (new Error ("Only functions that return a sql snippet are allowed"));
  });

  test ("SQL tag variable", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const sqlSnippet = sql`
      offset 0
      limit 10 
    `;

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" },
        { type: "Variable", idx: 0, value: sqlSnippet }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "player".id, 'lastName', "player".last_name
      )
      from "player" "player"
      offset 0
      limit 10 
    `));

    expect (values).toEqual ([]);
  });

  test ("function that returns SQL tag variable", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const sqlSnippet = (t: Table) => sql`
      where ${t}.team_id = ${1}
      offset 0
      limit 10 
    `;

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" },
        { type: "Variable", idx: 0, value: sqlSnippet }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "player".id, 'lastName', "player".last_name
      )
      from "player" "player"
      where "player".team_id = $1
      offset 0
      limit 10 
    `));

    expect (values).toEqual ([1]);
  });

  test ("limit and offset can't be used in relation", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const sqlSnippet = (t: Table) => sql`
      where ${t}.team_id = ${1}
      offset 0
      limit 10 
    `;

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" },
        {
          type: "HasMany",
          include: {
            type: "AST",
            name: "goal",
            as: "goals",
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "minute", as: "minute" },
              { type: "Variable", idx: 0, value: sqlSnippet }
            ]
          }
        }
      ]
    };

    expect (() => interpreter.interpret (ast))
      .toThrowError (new Error ("Limit and offset can't be used inside a relation"));
  });

  test ("variables inside SQL Tag", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const sqlSnippet = (t: Table) => sql`
      where ${t}.team_id = ${1}
      offset ${0}
      limit ${10}
    `;

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" },
        { type: "Variable", idx: 0, value: sqlSnippet }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "player".id, 'lastName', "player".last_name
      )
      from "player" "player"
      where "player".team_id = $1
      offset $2
      limit $3
    `));

    expect (values).toEqual ([1, 0, 10]);
  });

  test ("nested SQL Tag", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const sqlSnippet = (t: Table) => sql`
      where ${t}.team_id = ${1}
      ${sql`
        order by ${t}.last_name 
      `}
      ${sql`
        offset ${0}
        limit ${10}
      `}
    `;

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" },
        { type: "Variable", idx: 0, value: sqlSnippet }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "player".id, 'lastName', "player".last_name
      )
      from "player" "player"
      where "player".team_id = $1
      order by "player".last_name
      offset $2
      limit $3
    `));

    expect (values).toEqual ([1, 0, 10]);
  });


  test ("not root limit in nested SQL tag", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const sqlSnippet = (t: Table) => sql`
      where ${t}.team_id = ${1}
      ${sql`
        offset 0
        limit 10 
      `}
    `;

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" },
        {
          type: "HasMany",
          include: {
            type: "AST",
            name: "goal",
            as: "goals",
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "minute", as: "minute" },
              { type: "Variable", idx: 0, value: sqlSnippet }
            ]
          }
        }
      ]
    };

    expect (() => interpreter.interpret (ast))
      .toThrowError (new Error ("Limit and offset can't be used inside a relation"));
  });

  test ("raw variables", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const rawSnippet = raw (`, 'teamId', "player".team_id`);

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" },
        { type: "Variable", idx: 0, value: rawSnippet }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "player".id, 'lastName', "player".last_name, 'teamId', "player".team_id
      )
      from "player" "player"
    `));

    expect (values).toEqual ([]);
  });

  test ("raw variables in sql tag", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const sqlSnippet = (t: Table) => sql`
      where ${t}.team_id = ${1}
      ${raw (`order by "${t.name}".last_name`)}
      ${sql`
        offset ${0}
        ${raw (`limit ${10}`)}
      `}
    `;

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" },
        { type: "Variable", idx: 0, value: sqlSnippet }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "player".id, 'lastName', "player".last_name
      )
      from "player" "player"
      where "player".team_id = $1
      order by "player".last_name
      offset $2
      limit 10
    `));

    expect (values).toEqual ([1, 0]);
  });

  test ("regular variables", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const ownGoalSnippet = (t: Table) => sql`
      where ${t}.own_goal = ${true} 
    `;

    const whereSnippet = (t: Table) => sql`
      where ${t}.id = ${1} 
      and ${t}.last_name = ${"Doe"}
    `;

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" },
        {
          type: "HasMany",
          include: {
            type: "AST",
            name: "goal",
            as: "ownGoals",
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Variable", idx: 0, value: ownGoalSnippet }
            ]
          }
        },
        { type: "Variable", idx: 1, value: whereSnippet }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "player".id, 'lastName', "player".last_name, 
        'ownGoals', (
          select coalesce(json_agg(json_build_object('id', "ownGoals".id)), '[]'::json)
          from "goal" "ownGoals"
          where "ownGoals".player_id = "player".id
          and "ownGoals".own_goal = $1
        )
      )
      from "player" "player"
      where "player".id = $2 and "player".last_name = $3 
    `));

    expect (values).toEqual ([true, 1, "Doe"]);
  });

  test ("variable cast", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        {
          type: "Call",
          name: "concat",
          as: "concat",
          args: [
            { type: "Identifier", name: "last_name", as: "lastName" },
            { type: "Variable", idx: 0, value: 1, cast: "text" }
          ]
        }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "player".id, 'concat', concat("player".last_name, $1::text)
      )
      from "player" "player"
    `));

    expect (values).toEqual ([1]);
  });

  test ("literals", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "StringLiteral", value: "length", as: "length" },
        { type: "StringLiteral", value: "age", as: "numberOfYears" },
        {
          type: "Call",
          name: "concat",
          as: "concat",
          args: [
            { type: "BooleanLiteral", value: true, as: "true" },
            { type: "Identifier", name: "last_name", as: "lastName" },
            { type: "StringLiteral", value: " ", as: " " },
            { type: "BooleanLiteral", value: false, as: "false" }
          ]
        },
        { type: "NumericLiteral", value: 1, as: "one" },
        { type: "NumericLiteral", value: 2, as: "2" },
        { type: "NullLiteral", value: null, as: "nothing" },
        { type: "NullLiteral", value: null, as: "null" },
        { type: "BooleanLiteral", value: true, as: "correct" },
        { type: "BooleanLiteral", value: false, as: "false" }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "player".id,
        'length', 'length',
        'numberOfYears', 'age',
        'concat', concat(true, "player".last_name, ' ', false),
        'one', 1, '2', 2, 
        'nothing', null, 'null', null, 
        'correct', true, 'false', false
      )
      from "player" "player"
    `));

    expect (values).toEqual ([]);
  });

  test ("Unimplemented type", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        <any>{ type: "DoubleLiteral", value: 3.14, as: "rating" }
      ]
    };

    expect (() => interpreter.interpret (ast))
      .toThrowError (new Error (
        'Unimplemented: {"type":"DoubleLiteral","value":3.14,"as":"rating"}'
      ));
  });

  test ("limit and offset", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      limit: 30,
      offset: 30,
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "player".id,
        'lastName', "player".last_name
      )
      from "player" "player"
      limit 30
      offset 30
    `));

    expect (values).toEqual ([]);
  });

  test ("by id", () => {
    const interpreter = new JBOInterpreter ({}, true);

    const ast: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      id: 1,
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" }
      ]
    };

    const [query, values] = interpreter.interpret (ast);

    expect (query).toBe (format (`
      select json_build_object(
        'id', "player".id,
        'lastName', "player".last_name
      )
      from "player" "player"
      where "player".id = 1
    `));

    expect (values).toEqual ([]);
  });
});