import Parser from ".";
import {
  All, BelongsTo, BelongsToMany, BooleanLiteral, Call,
  HasMany, Identifier, NullLiteral,
  NumericLiteral, Root, StringLiteral, Variable
} from "../nodes";
import Raw from "../Raw";
import sql from "../SQLTag/sql";
import Table from "../Table";
import { game, goal, league, player, position, team } from "../test/tables";
import Tokenizer, { TokenType } from "../Tokenizer";

describe ("Parser type", () => {
  test ("create Parser", () => {
    const str = "* $";
    const parser = new Parser (str, [team], player);
    const tokenizer = new Tokenizer (str);
    const lookahead = tokenizer.getNextToken ();

    expect (parser.str).toBe (str);
    expect (parser.idx).toBe (0);
    expect (parser.values).toEqual ([team]);
    expect (parser.tokenizer).toEqual (tokenizer);
    expect (parser.lookahead).toEqual (lookahead);
  });

  test ("references", () => {
    const positionQuery = position`*`;
    const spaceRaw = Raw ("' '");

    const tag = player`
      id:identifier::text
      birthday
      concat:full_name (upper (last_name), " ", ${spaceRaw}, first_name)
      ${goal`
        minute
      `}
      ${team`
        name:team_name
        ${player`
          last_name
          ${position`
            *
          `}
        `}
      `}:squad
      ${game`
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
    const fullName = Call (
      "concat", [upperLastName, space, spaceVariable, firstName], "full_name"
    );

    const minute = Identifier ("minute");
    const goalsAst = HasMany (
      Table ("goal"), { as: "goals", lRef: "id", rRef: "player_id" }, [minute]
    );

    const name = Identifier ("name", "team_name");
    const allPositionFields = All ("*");
    const positionAst = BelongsTo (
      Table ("position"), { as: "position", lRef: "position_id", rRef: "id" }, [allPositionFields]
    );

    const playersAst = HasMany (
      Table ("player"), { as: "players", lRef: "id", rRef: "team_id" }, [lastName, positionAst]
    );
    const teamAst = BelongsTo (
      Table ("public.team"), { as: "squad", lRef: "team_id", rRef: "id" }, [name, playersAst]
    );

    const gamesAst = BelongsToMany (Table ("game"), {
      xTable: Table ("game_player"),
      as: "games",
      lRef: "id",
      rRef: "id",
      lxRef: "player_id",
      rxRef: "game_id"
    }, [All ("*")]);

    const positionAst2 = BelongsTo (
      Table ("position"), { as: "pos", lRef: "position_id", rRef: "id" }, [allPositionFields]
    );

    const expected = Root (
      player,
      [identifier, birthday, fullName, goalsAst, teamAst, gamesAst, positionAst2]
    );

    expect (JSON.stringify (tag.node)).toBe (JSON.stringify (expected));
  });

  test ("variables", () => {
    const getLimit = (p: Params) => p.limit;
    const getOffset = (p: Params) => p.offset;

    const orderBySQL = sql`order by player.last_name`;
    const paginateSQL = sql`limit ${getLimit} offset ${getOffset}`;

    type Params = { limit: number; offset: number };

    const tag = player<Params>`
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
      player,
      [id, lastName, orderBy, paginate]
    );

    expect (tag.node).toEqual (expected);
  });

  test ("literals", () => {
    const tag = player`
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
      player,
      [one, two, t, f, n]
    );

    expect (tag.node).toEqual (expected);
  });

  test ("empty tag", () => {
    const tag = player``;

    const expected = Root (
      player,
      [All ("*")]
    );

    expect (tag.node).toEqual (expected);
  });

  test ("syntax errors", () => {
    expect (() => player`id, last_name`)
      .toThrowError (new SyntaxError ('Unknown Member Type: ","'));

    expect (() => player`concat(*)`)
      .toThrowError (new SyntaxError ('Unknown Argument Type: "*"'));

    expect (() => player`${league`*`}`)
      .toThrowError (new SyntaxError ("player has no ref defined for: league"));

    expect (() => player`${["name"]}`)
      .toThrowError (new SyntaxError ("Invalid dynamic members, expected Array of ASTNode"));

    expect (() => player`${[All ("*")]} last_name`)
      .toThrowError (new SyntaxError ('Unexpected token: "last_name", expected: "EOT"'));

    const parser = new Parser ("*", [], player);
    parser.lookahead = { type: "DOUBLE" as TokenType, value: "3.14" };

    expect (() => parser.Literal ())
      .toThrowError (new SyntaxError ('Unknown Literal: "DOUBLE"'));
  });
});