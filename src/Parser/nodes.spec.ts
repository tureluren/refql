import Table from "../Table";
import {
  BelongsTo, Call, HasMany,
  Identifier, ManyToMany, Root
} from "./nodes";

describe ("Nodes", () => {
  type Params = {
    id?: number;
    limit?: number;
    offset?: number;
    lref?: string;
    rref?: string;
    lxref?: string;
    rxref?: string;
    xtable?: string;
  };

  const player = Table.of ("player");
  const goal = Table.of ("goal");
  const game = Table.of ("game");
  const team = Table.of ("team");

  const root = Root.of<Params> (player, [], {
    id: p => p.id!,
    limit: p => p.limit!,
    offset: p => p.offset!
  });

  const hasMany = HasMany.of<Params> (goal, [], {
    lref: p => p.lref!,
    rref: p => p.rref!
  });

  const manyToMany = ManyToMany.of<Params> (game, [], {
    lref: p => p.lref!,
    rref: p => p.rref!,
    lxref: p => p.lxref!,
    rxref: p => p.rxref!,
    xtable: p => p.xtable!
  });

  const belongsTo = BelongsTo.of<Params> (team, [], {
    lref: p => p.lref!,
    rref: p => p.rref!
  });

  test ("run nodes", () => {
    const patchedRoot = root.run ({ id: 1, limit: 5, offset: 10 }, player);
    const patchedHasMany = hasMany.run ({ lref: "ID", rref: "PLAYERID" }, goal);
    const patchedBelongsTo = belongsTo.run ({ lref: "TEAMID", rref: "ID" }, goal);
    const patchedManyToMany = manyToMany.run (
      { lref: "ID", lxref: "PLAYERID", rxref: "GAMEID", rref: "ID", xtable: "PLAYERGAME" },
      goal
    );

    expect (patchedRoot.keywords).toEqual ({ id: 1, limit: 5, offset: 10 });
    expect (patchedHasMany.keywords).toEqual ({ lref: "ID", rref: "PLAYERID" });
    expect (patchedBelongsTo.keywords).toEqual ({ lref: "TEAMID", rref: "ID" });
    expect (patchedManyToMany.keywords).toEqual (
      { lref: "ID", lxref: "PLAYERID", rxref: "GAMEID", rref: "ID", xtable: "PLAYERGAME" }
    );
  });

  test ("add member", () => {
    const id = Identifier.of ("id");
    const name = Identifier.of ("name");
    const nameId = Call.of ("concat", [name]);

    expect (root.addMember (id).members).toEqual ([id]);
    expect (hasMany.addMember (id).members).toEqual ([id]);
    expect (belongsTo.addMember (id).members).toEqual ([id]);
    expect (manyToMany.addMember (id).members).toEqual ([id]);
    expect (nameId.addMember (id).members).toEqual ([name, id]);
  });
});