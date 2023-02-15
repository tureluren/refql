import { Raw } from "../nodes/index.ts";
import SQLTag from "../SQLTag/index.ts";
import sql from "../SQLTag/sql.ts";
import { Boxes } from "./BoxRegistry.ts";

const joinMembers = <Params, Output, Box extends Boxes>(members: (Raw<Params, Output, Box> | SQLTag<Params, Output, Box>)[]) =>
  members.reduce ((tag: SQLTag<Params, Output, Box>, member) =>
    tag.join (", ", Raw.isRaw (member) ? sql<Params, Output, Box>`${member}` : member as SQLTag<Params, Output, Box>), sql<Params, Output, Box>``);

export default joinMembers;