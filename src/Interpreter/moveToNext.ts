import evolve from "../Environment2/evolve";
import convertCase from "../more/convertCase";
import emptyRefs from "../RQLTag/emptyRefs";
import Table from "../Table";
import { ASTNode, EnvRecord, OptCaseType } from "../types";
import keysToComp from "./keysToComp";

const createKey = (table: Table) => (ref: string, keys: string) =>
  keys.split (",").map ((name, idx) => ({
    name: name.trim (),
    as: `${table.as}${ref}${idx}`
  }));

const moveToNext = (caseType: OptCaseType) => <Input>(exp: ASTNode, record: EnvRecord<Input>) => {
  const { table } = record;

  let refs = emptyRefs ();
  const keyOf = createKey (table);

  exp.cata<void> ({
    BelongsTo: (child, _members, keywords) => {
      refs.lkeys = keyOf ("lkey", keywords.lkey || convertCase (caseType, child.name + "_id"));
      refs.rkeys = keyOf ("rkey", keywords.rkey || "id");
    },
    HasMany: (_child, _members, keywords) => {
      refs.lkeys = keyOf ("lkey", keywords.lkey || "id");
      refs.rkeys = keyOf ("rkey", keywords.rkey || convertCase (caseType, table.name + "_id"));
    },
    ManyToMany: (child, _members, keywords) => {
      refs.lkeys = keyOf ("lkey", keywords.lkey || "id");
      refs.rkeys = keyOf ("rkey", keywords.rkey || "id");
      refs.lxkeys = keyOf ("lxkey", keywords.lxkey || convertCase (caseType, table.name + "_id"));
      refs.rxkeys = keyOf ("rxkey", keywords.rxkey || convertCase (caseType, child.name + "_id"));
    }
  });

  return evolve ({
    comps: comps => comps.concat (keysToComp (table, refs.lkeys)),
    next: next => next.concat ({ exp, refs })
  }) (record);
};

export default moveToNext;