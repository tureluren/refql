import { Raw } from "../nodes";
import SQLTag from "../SQLTag";
import sql from "../SQLTag/sql";

const joinMembers = <Params>(members: (Raw<Params> | SQLTag<Params>)[]) =>
  members.reduce ((tag: SQLTag<Params>, member) =>
    tag.join (", ", Raw.isRaw (member) ? sql`${member}` : member as SQLTag<Params>), SQLTag.empty ());

export default joinMembers;