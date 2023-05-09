import { SQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import sql from "../SQLTag/sql";

const joinMembers = <Params, Output>(members: (Raw<Params> | SQLTag<Params, Output>)[]) =>
  members.reduce ((tag: SQLTag<Params>, member) =>
    tag.join (", ", Raw.isRaw (member) ? sql<Params>`${member}` : member as SQLTag<Params>), sql<Params, Output>``);

export default joinMembers;