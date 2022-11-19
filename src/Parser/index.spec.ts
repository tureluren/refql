import Parser from ".";
import {
  All, BelongsTo, BelongsToMany, BooleanLiteral, Call,
  HasMany, Identifier, NullLiteral,
  NumericLiteral, Root, StringLiteral, Variable
} from "../nodes";
import Raw from "../Raw";
import sql from "../SQLTag/sql";
import Table from "../Table";
import { Game, GamePlayer, Goal, Player, Position, Team } from "../test/tables";
import Tokenizer, { TokenType } from "../Tokenizer";

describe ("Parser type", () => {
  test ("create Parser", () => {
    const str = "* $";
    const parser = new Parser (str, [Team], Player);
    const tokenizer = new Tokenizer (str);
    const lookahead = tokenizer.getNextToken ();

    expect (parser.str).toBe (str);
    expect (parser.idx).toBe (0);
    expect (parser.values).toEqual ([Team]);
    expect (parser.tokenizer).toEqual (tokenizer);
    expect (parser.lookahead).toEqual (lookahead);
  });

  test ("references", () => {
    const positionQuery = Position`*`;
    const spaceRaw = Raw ("' '");

    const tag = Player`
      id:identifier::text
      birthday
      concat:full_name (upper (last_name), " ", ${spaceRaw}, first_name)
      ${Goal`
        minute
      `}
      ${Team`
        name:team_name
        ${Player`
          last_name
          ${Position`
            *
          `}
        `}
      `}:squad
      ${Game`
        ${[All ("*")]}
      `}
      ${positionQuery}: pos
    `;

    const identifier = Identifier ("id", "identifier", "text");
    const birthday = Identifier ("birthday");

    const lastName = Identifier ("last_name");
    const upperLastName = Call ("upper", [lastName]);
    const firstName = Identifier ("first_name");
    const space = StringLiteral (" ");
    const spaceVariable = Variable (spaceRaw);
    const fullName = Call ("concat", [upperLastName, space, spaceVariable, firstName], "full_name");

    const minute = Identifier ("minute");
    const goalsAst = HasMany (Table ("goal"), { as: "goals", lRef: "id", rRef: "player_id" }, [minute]);

    const name = Identifier ("name", "team_name");
    const allPositionFields = All ("*");
    const positionAst = BelongsTo (Table ("position"), { as: "position", lRef: "position_id", rRef: "id" }, [allPositionFields]);

    const playersAst = HasMany (Table ("player"), { as: "players", lRef: "id", rRef: "team_id" }, [lastName, positionAst]);
    const teamAst = BelongsTo (Table ("public.team"), { as: "squad", lRef: "team_id", rRef: "id" }, [name, playersAst]);

    const gamesAst = BelongsToMany (Table ("game"), {
      xTable: Table ("game_player"),
      as: "games",
      lRef: "id",
      rRef: "id",
      rxRef: "player_id",
      lxRef: "game_id"
    }, [All ("*")]);

    const positionAst2 = BelongsTo (Table ("position"), { as: "pos", lRef: "position_id", rRef: "id" }, [allPositionFields]);

    const expected = Root (
      Player,
      [identifier, birthday, fullName, goalsAst, teamAst, gamesAst, positionAst2]
    );

    expect (tag.node).toMatchObject (expected);
  });

  test ("variables", () => {
    const getLimit = (p: Params) => p.limit;
    const getOffset = (p: Params) => p.offset;

    const orderBySQL = sql`order by player.last_name`;
    const paginateSQL = sql`limit ${getLimit} offset ${getOffset}`;

    type Params = { limit: number; offset: number };

    const tag = Player<Params>`
      id
      last_name
      ${orderBySQL}
      ${paginateSQL} 
    `;

    const id = Identifier ("id");
    const lastName = Identifier ("last_name");
    const orderBy = Variable (orderBySQL);
    const paginate = Variable (paginateSQL);

    const expected = Root<Params> (
      Player,
      [id, lastName, orderBy, paginate]
    );

    expect (tag.node).toEqual (expected);
  });

  test ("literals", () => {
    const tag = Player`
      "1":one::int
      2:two::text
      true:t::text
      false:f::text
      null:n::text
    `;

    const one = StringLiteral ("1", "one", "int");
    const two = NumericLiteral (2, "two", "text");
    const t = BooleanLiteral (true, "t", "text");
    const f = BooleanLiteral (false, "f", "text");
    const n = NullLiteral (null, "n", "text");

    const expected = Root (
      Player,
      [one, two, t, f, n]
    );

    expect (tag.node).toEqual (expected);
  });

  test ("syntax errors", () => {
    // expect (() => Player``)
    //   .toThrowError (new SyntaxError ("A table block should have at least one member"));

    expect (() => Player`id, last_name`)
      .toThrowError (new SyntaxError ('Unknown Member Type: ","'));

    expect (() => Player`concat(*)`)
      .toThrowError (new SyntaxError ('Unknown Argument Type: "*"'));

    // expect (() => Player``)
    //   .toThrowError (new SyntaxError ('Unexpected end of input, expected: "IDENTIFIER"'));

    expect (() => Player`${{}}`)
      .toThrowError (new SyntaxError ("Invalid dynamic members, expected non-empty Array of ASTNode"));

    expect (() => Player`${[]}`)
      .toThrowError (new SyntaxError ("Invalid dynamic members, expected non-empty Array of ASTNode"));

    expect (() => Player`${["name"]}`)
      .toThrowError (new SyntaxError ("Invalid dynamic members, expected non-empty Array of ASTNode"));

    const parser = new Parser ("*", [], Player);
    parser.lookahead = { type: "DOUBLE" as TokenType, value: "3.14" };

    expect (() => parser.Literal ())
      .toThrowError (new SyntaxError ('Unknown Literal: "DOUBLE"'));
  });
});