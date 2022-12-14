import { Ref } from "../common/types";
import Table from "../Table";

export const castAs = (sql: boolean | null | number | string, as?: string, cast?: string) =>
  `${sql}${cast ? `::${cast}` : ""}${as ? ` ${as}` : ""}`;

export const refToComp = (table: Table, ref: Ref) =>
  `${table.name}.${ref.name} ${ref.as}`;