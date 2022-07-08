import Parser from ".";
import Raw from "../Raw";
import sql from "../SQLTag/sql";
import Table from "../Table";
import Tokenizer from "../Tokenizer";
import { ASTType, OptCaseType } from "../types";

const parseFn = (typeCaseDB: OptCaseType, typeCaseJS: OptCaseType, pluralize: boolean) =>
  (text: any, ...keys: any[]) => {
    const string = text.join ("$");
    const parser = new Parser (
      typeCaseDB, typeCaseJS, pluralize, { player: "teammates" }
    );
    return parser.parse (string, keys);
  };

describe ("Parser type", () => {
  test ("init Parser", () => {
    const parser = new Parser ("snake", "camel", true, { player: "teammates" });

    expect (parser.string).toBe ("");
    expect (parser.caseTypeJS).toBe ("camel");
    expect (parser.caseType).toBe ("snake");
    expect (parser.keyIdx).toBe (0);
    expect (parser.keys).toEqual ([]);
    expect (parser.tokenizer).toEqual (new Tokenizer ());
  });

  test ("table declaration - typeCaseDB = 'snake'", () => {
    const parse = parseFn ("snake", "camel", true);

    const ast = parse`
      player { id lastName }
    `;

    const expected: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" }
      ]
    };

    expect (ast).toEqual (expected);
  });

  test ("table declaration - typeCaseDB = undefined", () => {
    const parse = parseFn (undefined, "camel", true);

    const ast = parse`
      player { id lastName }
    `;

    const expected: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "lastName", as: "lastName" }
      ]
    };

    expect (ast).toEqual (expected);
  });

  test ("no keywords", () => {
    const parse = parseFn (undefined, "camel", true);

    const ast = parse`
      player () { id lastName }
    `;

    const expected: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "lastName", as: "lastName" }
      ]
    };

    expect (ast).toEqual (expected);
  });

  test ("kewords - ignore empty Strings an nil values", () => {
    const parse = parseFn ("snake", "camel", true);

    const ast = parse`
      player (${{ as: "" }}) {
        id
        - team (as: "") { id }
        - position (as: ${""}) { id }
      }
    `;

    const expected: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        {
          type: "BelongsTo",
          include: {
            type: "AST",
            name: "team",
            as: "team",
            members: [
              { type: "Identifier", name: "id", as: "id" }
            ]
          }
        },
        {
          type: "BelongsTo",
          include: {
            type: "AST",
            name: "position",
            as: "position",
            members: [
              { type: "Identifier", name: "id", as: "id" }
            ]
          }
        }
      ]
    };

    expect (ast).toEqual (expected);

    const ast2 = parse`
      player (${{ as: null }}) {
        id
        - team (as: null) { id }
        - position (as: ${null}) { id }
      }
    `;

    expect (ast2).toEqual (expected);
  });

  test ("keywords - pluralize = true; caseType = 'snake'; caseTypeJS = 'camel'", () => {
    const parse = parseFn ("snake", "camel", true);

    const ast = parse`
      player (${{ as: "player_table" }}) {
        id
        lastName
        < goal (${{ as: "points", links: [["playerId", "id"]] }}) {
          id
          minute
        }
        x game (${{ xTable: "playerGame", refs: { player: [["playerId", "id"]], game: [["gameId", "id"]] } }}) {
          id
          result
        }
      }
    `;

    const ast2 = parse`
      player (as: "player_table") {
        id
        lastName
        < goal (as: ${"points"}, links: ${[["playerId", "id"]]}) {
          id
          minute
        }
        x game (xTable: "playerGame", refs: ${{ player: [["playerId", "id"]], game: [["gameId", "id"]] }}) {
          id
          result
        }
      }
    `;

    const expected: ASTType = {
      type: "AST",
      name: "player",
      as: "player_table",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" },
        {
          type: "HasMany",
          include: {
            type: "AST",
            name: "goal",
            as: "points",
            links: [["player_id", "id"]],
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "minute", as: "minute" }
            ]
          }
        },
        {
          type: "ManyToMany",
          include: {
            type: "AST",
            name: "game",
            as: "games",
            xTable: "player_game",
            refs: {
              player: [["player_id", "id" ]],
              game: [[ "game_id", "id" ]]
            },
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "result", as: "result" }
            ]
          }
        }
      ]
    };

    expect (ast).toEqual (expected);
    expect (ast2).toEqual (expected);
  });

  test ("keywords - pluralize = false; caseType = 'camel'; caseTypeJS = 'snake'", () => {
    const parse = parseFn ("camel", "snake", false);

    const ast = parse`
      player (${{ as: "player_table" }}) {
        id
        lastName
        < goal (${{ as: "points", links: [["playerId", "id"]] }}) {
          id
          minute
        }
        x game (${{ xTable: "playerGame", refs: { player: [["playerId", "id"]], game: [["gameId", "id"]] } }}) {
          id
          result
        }
      }
    `;

    const ast2 = parse`
      player (as: "player_table") {
        id
        lastName
        < goal (as: "points", links: ${[["playerId", "id"]]}) {
          id
          minute
        }
        x game (xTable: "playerGame", refs: ${{ player: [["playerId", "id"]], game: [["gameId", "id"]] }}) {
          id
          result
        }
      }
    `;

    const expected: ASTType = {
      type: "AST",
      name: "player",
      as: "player_table",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "lastName", as: "last_name" },
        {
          type: "HasMany",
          include: {
            type: "AST",
            name: "goal",
            as: "points",
            links: [["playerId", "id"]],
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "minute", as: "minute" }
            ]
          }
        },
        {
          type: "ManyToMany",
          include: {
            type: "AST",
            name: "game",
            as: "game",
            xTable: "playerGame",
            refs: {
              player: [["playerId", "id"]],
              game: [["gameId", "id"]]
            },
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "result", as: "result" }
            ]
          }
        }
      ]
    };

    expect (ast).toEqual (expected);
    expect (ast2).toEqual (expected);
  });


  test ("keywords - pluralize = true; caseType = undefined; caseTypeJS = 'camel'", () => {
    const parse = parseFn (undefined, "camel", true);

    const ast = parse`
      player (${{ as: "player_table" }}) {
        id
        lastName
        < goal (${{ as: "points", links: [["playerId", "id"]] }}) {
          id
          minute
        }
        x game (${{ xTable: "playerGame", refs: { player: [["playerId", "id"]], game: [["gameId", "id"]] } }}) {
          id
          result
        }
      }
    `;

    const ast2 = parse`
      player (as: ${"player_table"}) {
        id
        lastName
        < goal (as: "points", links: ${[["playerId", "id"]]}) {
          id
          minute
        }
        x game (xTable: "playerGame", refs: ${{ player: [["playerId", "id"]], game: [["gameId", "id"]] }}) {
          id
          result
        }
      }
    `;

    const expected: ASTType = {
      type: "AST",
      name: "player",
      as: "player_table",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "lastName", as: "lastName" },
        {
          type: "HasMany",
          include: {
            type: "AST",
            name: "goal",
            as: "points",
            links: [["playerId", "id"]],
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "minute", as: "minute" }
            ]
          }
        },
        {
          type: "ManyToMany",
          include: {
            type: "AST",
            name: "game",
            as: "games",
            xTable: "playerGame",
            refs: {
              player: [["playerId", "id"]],
              game: [["gameId", "id"]]
            },
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "result", as: "result" }
            ]
          }
        }
      ]
    };

    expect (ast).toEqual (expected);
    expect (ast2).toEqual (expected);
  });

  test ("keywords - pluralize = false; caseType = undefined; caseTypeJS = 'camel'", () => {
    const parse = parseFn (undefined, "camel", false);

    const ast = parse`
      player (${{ as: "player_table" }}) {
        id
        lastName
        < goal (${{ as: "points", links: [["playerId", "id"]] }}) {
          id
          minute
        }
        x game (${{ xTable: "playerGame", refs: { player: [["playerId", "id"]], game: [["gameId", "id"]] } }}) {
          id
          result
        }
      }
    `;

    const ast2 = parse`
      player (as: "player_table") {
        id
        lastName
        < goal (as: "points", links: ${[["playerId", "id"]]}) {
          id
          minute
        }
        x game (xTable: "playerGame", refs: ${{ player: [["playerId", "id"]], game: [["gameId", "id"]] } }) {
          id
          result
        }
      }
    `;

    const expected: ASTType = {
      type: "AST",
      name: "player",
      as: "player_table",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "lastName", as: "lastName" },
        {
          type: "HasMany",
          include: {
            type: "AST",
            name: "goal",
            as: "points",
            links: [[ "playerId", "id"]],
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "minute", as: "minute" }
            ]
          }
        },
        {
          type: "ManyToMany",
          include: {
            type: "AST",
            name: "game",
            as: "game",
            xTable: "playerGame",
            refs: {
              player: [["playerId", "id"]],
              game: [["gameId", "id"]]
            },
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "result", as: "result" }
            ]
          }
        }
      ]
    };

    expect (ast).toEqual (expected);
    expect (ast2).toEqual (expected);
  });

  test ("keywords - order by", () => {
    const parse = parseFn ("snake", "camel", true);

    const orderByLastName = (t: Table) =>
      sql`order by ${t}.last_name`;

    const ast = parse`
      team (id: 1) {
        id
        name
        < player (${{ orderBy: orderByLastName }}) {
          id
          lastName
        }
      }
    `;

    const expected: ASTType = {
      type: "AST",
      name: "team",
      as: "team",
      id: 1,
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "name", as: "name" },
        {
          type: "HasMany",
          include: {
            type: "AST",
            name: "player",
            as: "teammates",
            orderBy: orderByLastName,
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "last_name", as: "lastName" }
            ]
          }
        }
      ]
    };

    expect (ast).toEqual (expected);
  });


  test ("table declaration errors handled", () => {
    const parse = parseFn ("snake", "camel", true);

    expect (() => parse``)
      .toThrowError (new SyntaxError ('Unexpected end of input, expected: "IDENTIFIER"'));

    expect (() => parse`player`)
      .toThrowError (new SyntaxError ('Unexpected end of input, expected: "{"'));

    expect (() => parse`player {}`)
      .toThrowError (new SyntaxError ("A table block should have at least one ASTNode"));

    expect (() => parse`player (${"p"})`)
      .toThrowError (new SyntaxError ("player + (${}) should be of type Object"));

    expect (() => parse`player (${{ as: 1 }})`)
      .toThrowError (new SyntaxError ("`as` should be of type String"));

    expect (() => parse`player (as: < team)`)
      .toThrowError (new SyntaxError ('Only Literals or Variables are allowed as parameters, not: "<"'));
  });

  test ("Identifier alias and cast - pluralize = true", () => {
    const parse = parseFn ("snake", "camel", true);

    const ast = parse`
      player: teammate {
        id
        lastName: name
        < goal: points { id minute }
        < assist { id:: text gameId }
        - team {
          id
          name
          < player { id lastName }
        }
      }
    `;

    const expected: ASTType = {
      type: "AST",
      name: "player",
      as: "teammate",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "name" },
        {
          type: "HasMany",
          include: {
            type: "AST",
            name: "goal",
            // goals overruled by points
            as: "points",
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "minute", as: "minute" }
            ]
          }
        },
        {
          type: "HasMany",
          include: {
            type: "AST",
            name: "assist",
            // pluralized because pluralize = true
            as: "assists",
            members: [
              { type: "Identifier", name: "id", as: "id", cast: "text" },
              { type: "Identifier", name: "game_id", as: "gameId" }
            ]
          }
        },
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
                  // because of provided plurals
                  as: "teammates",
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
    };

    expect (ast).toEqual (expected);
  });

  test ("has many", () => {
    const parse = parseFn ("snake", "camel", true);

    const ast = parse`
      player {
        < goal { id minute }
      }
    `;

    const expected: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        {
          type: "HasMany",
          include: {
            type: "AST",
            name: "goal",
            as: "goals",
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "minute", as: "minute" }
            ]
          }
        }
      ]
    };

    expect (ast).toEqual (expected);
  });

  test ("has many - provided with links", () => {
    const parse = parseFn ("snake", "camel", true);

    const ast = parse`
      player {
        < goal (${{ links: [["playerId", "id"]] }}) {
          id
          minute
        }
      }
    `;

    const expected: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        {
          type: "HasMany",
          include: {
            type: "AST",
            name: "goal",
            as: "goals",
            links: [["player_id", "id"]],
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "minute", as: "minute" }
            ]
          }
        }
      ]
    };

    expect (ast).toEqual (expected);
  });

  test ("belongs to", () => {
    const parse = parseFn ("snake", "camel", true);

    const ast = parse`
      player {
        - team {
          id
          name
        }
      }
    `;

    const expected: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        {
          type: "BelongsTo",
          include: {
            type: "AST",
            name: "team",
            as: "team",
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "name", as: "name" }
            ]
          }
        }
      ]
    };

    expect (ast).toEqual (expected);
  });

  test ("belongs to - provided with links", () => {
    const parse = parseFn ("snake", "camel", true);

    const ast = parse`
      player {
        - team (${{ links: [["teamId", "id"]] }}) {
          id
          name
        }
      }
    `;

    const expected: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        {
          type: "BelongsTo",
          include: {
            type: "AST",
            name: "team",
            as: "team",
            links: [["team_id", "id"]],
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "name", as: "name" }
            ]
          }
        }
      ]
    };

    expect (ast).toEqual (expected);
  });

  test ("many to many", () => {
    const parse = parseFn ("snake", "camel", true);

    const ast = parse`
      player {
        x game {
          id
          result
        }
      }
    `;

    const expected: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        {
          type: "ManyToMany",
          include: {
            type: "AST",
            name: "game",
            as: "games",
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "result", as: "result" }
            ]
          }
        }
      ]
    };

    expect (ast).toEqual (expected);
  });

  test ("many to many - provided with refs", () => {
    const parse = parseFn ("snake", "camel", true);

    const ast = parse`
      player {
        x game (${{ xTable: "playerGame", refs: { player: [["playerId", "id"]], game: [["gameId", "id"]] } }}) {
          id
          result
        }
      }
    `;

    const expected: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        {
          type: "ManyToMany",
          include: {
            type: "AST",
            name: "game",
            as: "games",
            xTable: "player_game",
            refs: {
              player: [["player_id", "id"]],
              game: [["game_id", "id"]]
            },
            members: [
              { type: "Identifier", name: "id", as: "id" },
              { type: "Identifier", name: "result", as: "result" }
            ]
          }
        }
      ]
    };

    expect (ast).toEqual (expected);
  });

  test ("subselects", () => {
    const parse = parseFn ("snake", "camel", true);

    const subselect = (t: Table) => sql`
      select count(*)
      from goal
      where player_id = ${t}.id
    `;

    const ast = parse`
      player {
        & goalCount ${subselect}
      }
    `;

    const expected: ASTType = {
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

    expect (ast).toEqual (expected);
  });

  test ("relation and subselect declaration errors handled", () => {
    const parse = parseFn ("snake", "camel", true);

    expect (() => parse`player { < {} }`)
      .toThrowError (new SyntaxError ('Unexpected token: "{", expected: "IDENTIFIER"'));

    expect (() => parse`player { - "team" }`)
      .toThrowError (new SyntaxError ('Unexpected token: "\"team"\", expected: "IDENTIFIER"'));

    expect (() => parse`player { x`)
      .toThrowError (new SyntaxError ('Unexpected end of input, expected: "IDENTIFIER"'));

    expect (() => parse`player { &`)
      .toThrowError (new SyntaxError ('Unexpected end of input, expected: "IDENTIFIER"'));

    expect (() => parse`player { & goalCount`)
      .toThrowError (new SyntaxError ('Unexpected end of input, expected: "VARIABLE"'));
  });

  test ("variables", () => {
    const parse = parseFn ("snake", "camel", true);

    const ast = parse`
      player {
        id
        ${"age"}
        ${4}::text
        last_name
      }
    `;

    const expected: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Variable", idx: 0, value: "age" },
        { type: "Variable", idx: 1, value: 4, cast: "text" },
        { type: "Identifier", name: "last_name", as: "lastName" }
      ]
    };

    expect (ast).toEqual (expected);
  });

  test ("Sql tags as variables", () => {
    const parse = parseFn ("snake", "camel", true);

    const ownGoalSnippet = (t: Table) => sql`
      where ${t}.own_goal = ${true}
    `;

    const whereSnippet = (t: Table) => sql`
      where ${t}.id = ${1}
      and ${t}.last_name = ${"Doe"}
    `;

    const ast = parse`
      player {
        id
        last_name
        < goal: ownGoals {
          id
          ${ownGoalSnippet}
        }
        ${whereSnippet}
      }
    `;

    const expected: ASTType = {
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

    expect (ast).toEqual (expected);
  });


  test ("function calls", () => {
    const parse = parseFn ("snake", "camel", true);

    const ast = parse`
      player {
        id
        age(birthday)
        concat:fullName (firstName, " ", lastName)
      }
    `;

    const expected: ASTType = {
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

    expect (ast).toEqual (expected);
  });

  test ("function calls with raw variables", () => {
    const parse = parseFn ("snake", "camel", true);

    const birthday = new Raw ("birthday");

    const ast = parse`
      player {
        id
        age(${birthday})
      }
    `;

    const expected: ASTType = {
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

    expect (ast).toEqual (expected);
  });


  test ("nested function calls and variables", () => {
    const parse = parseFn ("snake", "camel", true);

    const positionSnippet = (t: Table) =>
      sql`(select name from position where id = ${t}.position_id)`;

    const ast = parse`
      player {
        id
        datePart:age::text("year", age(birthday))
        concat:fullNameAndPosition (upper(firstName), " ", upper(lower(lastName)), ", ", ${positionSnippet})
      }
    `;

    const expected: ASTType = {
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
            { type: "StringLiteral", value: ", ", as: ", " },
            { type: "Variable", idx: 0, value: positionSnippet }
          ]
        }
      ]
    };

    expect (ast).toEqual (expected);
  });

  test ("literals", () => {
    const parse = parseFn ("snake", "camel", true);

    const ast = parse`
      player {
        id
        "length"
        "age":numberOfYears
        concat(true, lastName, " ", false)
        1:one
        2
        null:nothing
        null
        true: correct
        false
      }
    `;

    const expected: ASTType = {
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

    expect (ast).toEqual (expected);
  });

  test ("nested relations", () => {
    const parse = parseFn ("snake", "camel", true);

    const ast = parse`
      player {
        id lastName
        - team {
          id name
          < player { id lastName }
        }
        < goal {
          id minute
          - game {
            id
            - team: homeTeam (${{ links: [["homeTeamId", "id"]] }}) {
              id name
            }
            - team (${{ as: "awayTeam", links: [["awayTeamId", "id"]] }}) {
              id name
            }
            x player (${{ xTable: "player_game" }}) { id lastName }
          }
        }
        x game {
          id result
          - league { id name }
        }
      }
    `;

    const expected: ASTType = {
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

    expect (ast).toEqual (expected);
  });

  test ("Unknown ASTNode Type", () => {
    const parse = parseFn ("snake", "camel", true);

    expect (() => parse`Player {id, lastName}`)
      .toThrowError (new Error ('Unknown ASTNode Type: ","'));
  });

  test ("Unknown Argument Type", () => {
    const parse = parseFn ("snake", "camel", true);

    expect (() => parse`Player {id lastName age(- team { id }) }`)
      .toThrowError (new Error ('Invalid Argument Type: "-"'));
  });

  test ("Unknown Literal", () => {
    const parser = new Parser ("snake", "camel", true, {});
    parser.lookahead = <any>{ type: "DOUBLE", value: 3.14 };

    expect (() => parser.Literal ())
      .toThrowError (new Error ('Unknown Literal: "DOUBLE"'));
  });

  test ("limit and offset", () => {
    const parse = parseFn ("snake", "camel", true);

    const ast = parse`
      player (limit: 30, offset: 30) {
        id
        lastName
      }
    `;

    const ast2 = parse`
      player (${{ limit: 30, offset: 30 }}) {
        id
        lastName
      }
    `;

    const expected: ASTType = {
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

    expect (ast).toEqual (expected);
    expect (ast2).toEqual (expected);
  });

  test ("by id", () => {
    const parse = parseFn ("snake", "camel", true);

    const ast = parse`
      player (id: 1) {
        id
        lastName
      }
    `;

    const ast2 = parse`
      player (${{ id: 1 }}) {
        id
        lastName
      }
    `;

    const expected: ASTType = {
      type: "AST",
      name: "player",
      as: "player",
      id: 1,
      members: [
        { type: "Identifier", name: "id", as: "id" },
        { type: "Identifier", name: "last_name", as: "lastName" }
      ]
    };

    expect (ast).toEqual (expected);
    expect (ast2).toEqual (expected);
  });
});