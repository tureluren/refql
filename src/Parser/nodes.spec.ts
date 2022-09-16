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

  const player = Table ("player");
  const goal = Table ("goal");
  const game = Table ("game");
  const team = Table ("team");

  const root = Root<Params> (player, [], {
    id: p => p.id!,
    limit: p => p.limit!,
    offset: p => p.offset!
  });

  const hasMany = HasMany<Params> (goal, [], {
    lref: p => p.lref!,
    rref: p => p.rref!
  });

  const manyToMany = ManyToMany<Params> (game, [], {
    lref: p => p.lref!,
    rref: p => p.rref!,
    lxref: p => p.lxref!,
    rxref: p => p.rxref!,
    xtable: p => p.xtable!
  });

  const belongsTo = BelongsTo<Params> (team, [], {
    lref: p => p.lref!,
    rref: p => p.rref!
  });

  test ("add member", () => {
    const id = Identifier ("id");
    const name = Identifier ("name");
    const nameId = Call ("concat", [name]);

    expect (root.addMember (id).members).toEqual ([id]);
    expect (hasMany.addMember (id).members).toEqual ([id]);
    expect (belongsTo.addMember (id).members).toEqual ([id]);
    expect (manyToMany.addMember (id).members).toEqual ([id]);
    expect (nameId.addMember (id).members).toEqual ([name, id]);
  });
});