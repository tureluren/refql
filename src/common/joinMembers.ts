import { Raw } from "../nodes";
import { SQLTag } from "../SQLTag";
import sql from "../SQLTag/sql";

const joinMembers = <Params, Output>(members: (Raw<Params, Output> | SQLTag<Params, Output>)[]) =>
  members.reduce ((tag: SQLTag<Params, Output>, member) =>
    tag.join (", ", Raw.isRaw (member) ? sql<Params, Output>`${member}` : member as SQLTag<Params, Output>), sql<Params, Output>``);

export default joinMembers;