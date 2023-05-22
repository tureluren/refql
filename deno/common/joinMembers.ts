import { SQLTag } from "../SQLTag/index.ts";
import Raw from "../SQLTag/Raw.ts";
import sql from "../SQLTag/sql.ts";

const joinMembers = (members: (Raw | SQLTag)[]) =>
  members.reduce ((tag: SQLTag, member) =>
    tag.join (", ", Raw.isRaw (member) ? sql`${member}` : member as SQLTag), sql``);

export default joinMembers;