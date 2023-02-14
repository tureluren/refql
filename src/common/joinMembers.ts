import { Raw } from "../nodes";
import SQLTag from "../SQLTag";
import sql from "../SQLTag/sql";
import { Boxes } from "./BoxRegistry";

const joinMembers = <Params, Output, Box extends Boxes>(members: (Raw<Params, Output, Box> | SQLTag<Params, Output, Box>)[]) =>
  members.reduce ((tag: SQLTag<Params, Output, Box>, member) =>
    tag.join (", ", Raw.isRaw (member) ? sql<Params, Output, Box>`${member}` : member as SQLTag<Params, Output, Box>), sql<Params, Output, Box>``);

export default joinMembers;