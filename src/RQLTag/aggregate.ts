import { Querier, StringMap } from "../common/types";
import createEnv from "../Env/createEnv";
import Rec from "../Env/Rec";
import { InterpretF } from "../Interpreter";
import { BelongsTo, HasMany, ManyToMany, Root } from "../nodes";

const match = (row: any, nextRows: any[], lrefs: string[], rrefs: string[]) =>
  nextRows.filter ((r: any) =>
    rrefs.reduce ((acc, rr, idx) =>
      acc && (r[rr] === row[lrefs[idx]]),
      true as boolean
    )
  ).map (r => {
    const matched = { ...r };
    rrefs.forEach (rr => {
      delete matched[rr];
    });
    return matched;
  });

const aggregate = (querier: Querier<StringMap>, interpret: InterpretF<unknown>, node: Root<unknown>) => {
  const go = (compiled: Rec): Promise<any[]> => {
    return querier (compiled.query, compiled.values).then (rows => {
      if (!rows.length) {
        return Promise.resolve ([]);
      }
      const next = compiled.next.map (nxt =>
        go (interpret (nxt.node, createEnv (compiled.table, nxt.refs), rows))
      );

      return Promise.all (next).then (nextData =>
        rows.map (row =>
          nextData.reduce ((agg, nextRows, idx) => {
            const { node, refs } = compiled.next[idx];

            const lrefs = refs.lrefs.map (lr => lr.as);
            const rrefs = refs.rrefs.map (rr => rr.as);
            const lxrefs = refs.lxrefs.map (lxr => lxr.as);

            if (BelongsTo.isBelongsTo (node)) {
              agg[node.table.as] = match (row, nextRows, lrefs, rrefs)[0];

            } else if (HasMany.isHasMany (node)) {
              agg[node.table.as] = match (row, nextRows, lrefs, rrefs);

            } else if (ManyToMany.isManyToMany (node)) {
              agg[node.table.as] = match (row, nextRows, lrefs, lxrefs);
            }

            lrefs.forEach (lr => {
              delete agg[lr];
            });

            return agg;
          }, row)
        )
      );
    });
  };

  return go (interpret (node, createEnv (node.table)));
};

export default aggregate;