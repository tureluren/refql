import { Raw } from "../nodes/index.ts";
import SQLTag from "../SQLTag/index.ts";
import sql from "../SQLTag/sql.ts";

const joinMembers = <Params>(members: (Raw<Params> | SQLTag<Params>)[]) =>
  members.reduce ((tag: SQLTag<Params>, member) =>
    tag.join (", ", Raw.isRaw (member) ? sql`${member}` : member as SQLTag<Params>), SQLTag.empty ());

export default joinMembers;