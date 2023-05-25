import { createSQLTag, SQLTag } from "../SQLTag";
import sql from "../SQLTag/sql";
import isEmptyTag from "./isEmptyTag";

function concatExtra(tag: SQLTag, extras: any) {
  const { extra, limit, offset, orderBy } = extras;

  let concatenated = createSQLTag (tag.nodes);

  if (!isEmptyTag (extra)) {
    concatenated = concatenated.concat (extra);
  }

  if (!isEmptyTag (orderBy)) {
    concatenated = concatenated.concat (sql`
      order by ${orderBy} 
    `);
  }

  if (!isEmptyTag (limit)) {
    concatenated = concatenated.concat (limit);
  }

  if (!isEmptyTag (offset)) {
    concatenated = concatenated.concat (offset);
  }

  return concatenated;
}

export default concatExtra;