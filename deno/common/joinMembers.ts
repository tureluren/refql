import { Raw } from "../nodes/index.ts";
import SQLTag from "../SQLTag/index.ts";
import sql from "../SQLTag/sql.ts";

const joinMembers = (members: (Raw | SQLTag)[]) =>
  members.reduce ((tag: SQLTag, member) =>
    tag.join (", ", Raw.isRaw (member) ? sql`${member}` : member as SQLTag), SQLTag.empty ());

export default joinMembers;