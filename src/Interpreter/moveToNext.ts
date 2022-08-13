import evolve from "../Environment2/evolve";
import convertCase from "../more/convertCase";
import emptyRefs from "../RqlTag/emptyRefs";
import Table from "../Table";
import { ASTNode, EnvRecord, OptCaseType } from "../types";
import keysToComp from "./keysToComp";
import runKeyword from "./runKeyword";

const createKey = (table: Table) => (ref: string, keys: string) =>
  keys.split (",").map ((name, idx) => ({
    name: name.trim (),
    as: `${table.as}${ref}${idx}`
  }));

const moveToNext = <Input>(caseType: OptCaseType, params: Input) => (exp: ASTNode, record: EnvRecord<Input>) => {
  const { table } = record;

  let refs = emptyRefs ();
  const keyOf = createKey (table);

  exp.cata<Input, void> ({
    BelongsTo: (child, _members, { lkey, rkey }) => {
      const runKw = runKeyword (params, child);
      refs.lkeys = keyOf ("lkey", runKw (lkey) || convertCase (caseType, child.name + "_id"));
      refs.rkeys = keyOf ("rkey", runKw (rkey) || "id");
    },
    HasMany: (child, _members, { lkey, rkey }) => {
      const runKw = runKeyword (params, child);
      refs.lkeys = keyOf ("lkey", runKw (lkey) || "id");
      refs.rkeys = keyOf ("rkey", runKw (rkey) || convertCase (caseType, table.name + "_id"));
    },
    ManyToMany: (child, _members, { lkey, rkey, lxkey, rxkey }) => {
      const runKw = runKeyword (params, child);
      refs.lkeys = keyOf ("lkey", runKw (lkey) || "id");
      refs.rkeys = keyOf ("rkey", runKw (rkey) || "id");
      refs.lxkeys = keyOf ("lxkey", runKw (lxkey) || convertCase (caseType, table.name + "_id"));
      refs.rxkeys = keyOf ("rxkey", runKw (rxkey) || convertCase (caseType, child.name + "_id"));
    }
  });

  return evolve ({
    comps: comps => comps.concat (keysToComp (table, refs.lkeys)),
    next: next => next.concat ({ exp, refs })
  }) (record);
};

export default moveToNext;