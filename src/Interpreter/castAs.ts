import { Primitive } from "../types";

const castAs = (sql: Primitive | null, as?: string, cast?: string) =>
  `${sql}${cast ? `::${cast}` : ""}${as ? ` as ${as}` : ""}`;

export default castAs;