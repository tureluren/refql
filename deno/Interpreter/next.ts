import { evolve } from "../Env/access.ts";
import concat from "../more/concat.ts";
import emptyRefs from "../more/emptyRefs.ts";
import { ASTNode } from "../Parser/nodes.ts";
import Table from "../Table/index.ts";
import { Rec } from "../types.ts";
import { refsToComp } from "./sqlBuilders.ts";

const createRef = (table: Table) => (kw: string, refs: string) =>
  refs.split (",").map ((ref, idx) => ({
    name: ref.trim (),
    as: `${table.as}${kw}${idx}`
  }));

const next = <Params>(node: ASTNode<Params, true>, rec: Rec<Params>) => {
  const { table } = rec;

  let refs = emptyRefs ();

  node.cata<void> ({
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
  });

  return evolve ({
    comps: concat (refsToComp (table, refs.lrefs)),
    next: concat ({ node, refs })
  }, rec);
};

export default next;