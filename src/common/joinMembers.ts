import { Raw } from "../nodes";
import SQLTag from "../SQLTag";
import sql from "../SQLTag/sql";

const joinMembers = (members: (Raw | SQLTag)[]) =>
  members.reduce ((tag: SQLTag, member) =>
    tag.join (", ", Raw.isRaw (member) ? sql`${member}` : member as SQLTag), SQLTag.empty ());

export default joinMembers;