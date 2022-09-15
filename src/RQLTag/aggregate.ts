import createEnv from "../Env/createEnv";
import { BelongsTo, HasMany, ManyToMany, Root } from "../Parser/nodes";
import { InterpretF, Querier, Rec } from "../types";

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

const aggregate = <Params>(querier: Querier<any>, interpret: InterpretF<Params>, node: Root) => {
  const go = (compiled: Rec<Params>): Promise<any[]> => {
    return querier (compiled.query, compiled.values).then (rows => {
      const next = compiled.next.map (nxt =>
        go (interpret (nxt.node, createEnv<Params> (compiled.table, nxt.refs), rows))
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

  return go (interpret (node, createEnv<Params> (node.table)));
};

export default aggregate;