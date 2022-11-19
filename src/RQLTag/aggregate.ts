import { Querier, StringMap } from "../common/types";
import createEnv from "../Env/createEnv";
import Rec from "../Env/Rec";
import { InterpretF } from "../Interpreter";
import { BelongsTo, HasMany, BelongsToMany, Root } from "../nodes";
import HasOne from "../nodes/HasOne";

const match = (row: any, nextRows: any[], lRefs: string[], rRefs: string[]) =>
  nextRows.filter ((r: any) =>
    rRefs.reduce ((acc, rr, idx) =>
      acc && (r[rr] === row[lRefs[idx]]),
      true as boolean
    )
  ).map (r => {
    const matched = { ...r };
    rRefs.forEach (rr => {
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

            const lRefs = refs.lRefs.map (lr => lr.as);
            const rRefs = refs.rRefs.map (rr => rr.as);
            const lxRefs = refs.lxRefs.map (lxr => lxr.as);

            if (BelongsTo.isBelongsTo (node)) {
              agg[node.info.as] = match (row, nextRows, lRefs, rRefs)[0];

            } else if (HasMany.isHasMany (node)) {
              agg[node.info.as] = match (row, nextRows, lRefs, rRefs);

            } else if (HasOne.isHasOne (node)) {
              agg[node.info.as] = match (row, nextRows, lRefs, rRefs)[0];

            } else if (BelongsToMany.isBelongsToMany (node)) {
              agg[node.info.as] = match (row, nextRows, lRefs, lxRefs);
            }

            lRefs.forEach (lr => {
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