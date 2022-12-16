import { Raw } from "../nodes";
import SQLTag from "../SQLTag";
import sql from "../SQLTag/sql";

const joinMembers = <Params>(members: (Raw<Params> | SQLTag<Params>)[]) =>
  members.reduce ((tag: SQLTag<Params>, member, idx) => {
    return tag.concat (sql`
        ${Raw (idx ? ", " : "")}${member} 
      `);
  }, SQLTag.empty ());

export default joinMembers;