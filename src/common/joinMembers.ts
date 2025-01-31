import { SQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import sql from "../SQLTag/sql";

const joinMembers = (members: (Raw | SQLTag)[]) =>
  members.reduce ((tag: SQLTag, member, idx) =>
    tag.join (idx === 0 ? "" : ", ", Raw.isRaw (member) ? sql`${member}` : member as SQLTag), sql``);

export default joinMembers;