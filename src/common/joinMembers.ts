import { SQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import sql from "../SQLTag/sql";

const joinMembers = (members: (Raw | SQLTag)[]) =>
  members.reduce ((tag: SQLTag, member) =>
    tag.join (", ", Raw.isRaw (member) ? sql`${member}` : member as SQLTag), sql``);

export default joinMembers;