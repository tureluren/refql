import { evolve } from "../Env/access";
import concat from "../more/concat";
import emptyRefs from "../more/emptyRefs";
import { ASTNode } from "../Parser/nodes";
import Table from "../Table";
import { Rec } from "../types";
import { refsToComp } from "./sqlBuilders";

const createRef = (table: Table) => (kw: string, refs: string) =>
  refs.split (",").map ((ref, idx) => ({
    name: ref.trim (),
    as: `${table.as}${kw}${idx}`
  }));

const next = <Params>(params: Params) => (node: ASTNode, rec: Rec) => {
  const { table } = rec;

  let refs = emptyRefs ();

  node.cata<Params, void> ({
    BelongsTo: (child, _members, { lref, rref }) => {
      const refOf = createRef (child);
      refs.lrefs = refOf ("lref", lref || child.name + "_id");
      refs.rrefs = refOf ("rref", rref || "id");
    },
    HasMany: (child, _members, { lref, rref }) => {
      const refOf = createRef (child);
      refs.lrefs = refOf ("lref", lref || "id");
      refs.rrefs = refOf ("rref", rref || table.name + "_id");
    },
    ManyToMany: (child, _members, { lref, rref, lxref, rxref }) => {
      const refOf = createRef (child);
      refs.lrefs = refOf ("lref", lref || "id");
      refs.rrefs = refOf ("rref", rref || "id");
      refs.lxrefs = refOf ("lxref", lxref || table.name + "_id");
      refs.rxrefs = refOf ("rxref", rxref || child.name + "_id");
    }
  }, params, table);

  return evolve ({
    comps: concat (refsToComp (table, refs.lrefs)),
    next: concat ({ node, refs })
  }, rec);
};

export default next;