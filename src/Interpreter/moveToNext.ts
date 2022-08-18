import evolve from "../Environment2/evolve";
import concat from "../more/concat";
import convertCase from "../more/convertCase";
import emptyRefs from "../RqlTag/emptyRefs";
import Table from "../Table";
import { AstNode, EnvRecord, KeywordsNode, OptCaseType } from "../types";
import keysToComp from "./keysToComp";

const createKey = (table: Table) => (ref: string, keys: string) =>
  keys.split (",").map ((name, idx) => ({
    name: name.trim (),
    as: `${table.as}${ref}${idx}`
  }));

const moveToNext = (caseType: OptCaseType) => <Input>(exp: AstNode<Input, true>, record: EnvRecord<Input>) => {
  const { table } = record;

  let refs = emptyRefs ();
  const keyOf = createKey (table);

  exp.cata<void> ({
    BelongsTo: (child, _members, { lkey, rkey }) => {
      refs.lkeys = keyOf ("lkey", lkey || convertCase (caseType, child.name + "_id"));
      refs.rkeys = keyOf ("rkey", rkey || "id");
    },
    HasMany: (_child, _members, { lkey, rkey }) => {
      refs.lkeys = keyOf ("lkey", lkey || "id");
      refs.rkeys = keyOf ("rkey", rkey || convertCase (caseType, table.name + "_id"));
    },
    ManyToMany: (child, _members, { lkey, rkey, lxkey, rxkey }) => {
      refs.lkeys = keyOf ("lkey", lkey || "id");
      refs.rkeys = keyOf ("rkey", rkey || "id");
      refs.lxkeys = keyOf ("lxkey", lxkey || convertCase (caseType, table.name + "_id"));
      refs.rxkeys = keyOf ("rxkey", rxkey || convertCase (caseType, child.name + "_id"));
    }
  });

  return evolve ({
    comps: concat (keysToComp (table, refs.lkeys)),
    next: concat ({ exp, refs })
  }, record);
};

export default moveToNext;