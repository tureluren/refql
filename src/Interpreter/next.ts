import concat from "../common/concat";
import emptyRefs from "../common/emptyRefs";
import { evolve } from "../Env/access";
import Rec from "../Env/Rec";
import { ASTNode } from "../nodes";
import Table from "../Table";
import { refsToComp } from "./sqlBuilders";

const createRef = (as: string) => (kw: string, refs: string) =>
  refs.split (",").map ((ref, idx) => ({
    name: ref.trim (),
    as: `${(as).replace (/_/g, "").toLowerCase ()}${kw}${idx}`
  }));

const next = <Params>(params: Params) => (node: ASTNode<Params>, rec: Rec) => {
  const { table } = rec;

  let refs = emptyRefs ();

  node.caseOf<void> ({
    BelongsTo: (child, _members, { lRef, rRef, as }) => {
      const refOf = createRef (as);
      // what if empty, create default refs al bij has many creatie
      refs.lRefs = refOf ("lref", lRef);
      refs.rRefs = refOf ("rref", rRef);
    },
    HasMany: (child, _members, { lRef, rRef, as }) => {
      const refOf = createRef (as);
      refs.lRefs = refOf ("lref", lRef);
      refs.rRefs = refOf ("rref", rRef || table.name + "_id");
    },
    HasOne: (child, _members, { lRef, rRef, as }) => {
      const refOf = createRef (as);
      refs.lRefs = refOf ("lref", lRef);
      refs.rRefs = refOf ("rref", rRef || table.name + "_id");
    },
    BelongsToMany: (child, _members, { lRef, rRef, lxRef, rxRef, as }) => {
      const refOf = createRef (as);
      refs.lRefs = refOf ("lref", lRef);
      refs.rRefs = refOf ("rref", rRef);
      refs.lxRefs = refOf ("lxref", lxRef);
      refs.rxRefs = refOf ("rxref", rxRef);
    }
  }, params, table);

  return evolve ({
    comps: concat (refsToComp (table, refs.lRefs)),
    next: concat ({ node, refs })
  }, rec);
};

export default next;