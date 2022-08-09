import get from "../Environment2/get";
import set from "../Environment2/set";
import chain from "../more/chain";
import Table from "../Table";

const fromTable = (table: Table) => chain (
  get ("comps"),
  comps => set ("query") (`select ${comps.join (", ")} from ${table.name} ${table.as}`)
);

export default fromTable;