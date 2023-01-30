import { Raw } from "../nodes";
import SQLTag from "../SQLTag";
import sql from "../SQLTag/sql";

const joinMembers = <Params, Output>(members: (Raw<Params> | SQLTag<Params, Output>)[]) =>
  members.reduce ((tag: SQLTag<Params, Output>, member) =>
    tag.join (", ", Raw.isRaw (member) ? sql`${member}` : member as SQLTag<Params, Output>), SQLTag.empty ());

export default joinMembers;