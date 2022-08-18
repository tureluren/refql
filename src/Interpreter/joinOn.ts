import over from "../Environment2/over";
import Table from "../Table";
import { Key } from "../types";

const joinOn = (lkeys: Key[], rkeys: Key[], table: Table, xTable: Table) =>
  over ("query", query =>
    lkeys.reduce ((q, lk, idx) => {
      const rk = rkeys[idx];
      const op = idx === 0 ? "" : "and ";

      return `${q} ${op}${xTable.as}.${lk.name} = ${table.as}.${rk.name}`;

    }, `${query} join ${xTable.name} as ${xTable.as} on`)
  );

export default joinOn;