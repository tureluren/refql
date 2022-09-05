import createEnv from "../Env/createEnv.ts";
import { BelongsTo, HasMany, ManyToMany, Root } from "../Parser/nodes.ts";
import { InterpretF, Querier, Rec } from "../types.ts";

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

const aggregate = <Params>(querier: Querier<any>, interpret: InterpretF<Params>, node: Root<Params>) => {
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

            if (node instanceof BelongsTo) {
              agg[node.table.as] = match (row, nextRows, lrefs, rrefs)[0];

            } else if (node instanceof HasMany) {
              agg[node.table.as] = match (row, nextRows, lrefs, rrefs);

            } else if (node instanceof ManyToMany) {
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