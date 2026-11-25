import RefProp from "../Prop/RefProp.ts";
import { isSQLTag } from "../SQLTag/index.ts";
import { Table } from "../Table/index.ts";

const getStandardProps = (table: Table) =>
  Object.keys (table.props)
    .filter (p => !RefProp.isRefProp (table.props[p]) && !isSQLTag (table.props[p].col))
    .map (k => ({ col: table.props[k].col, as: table.props[k].as }));

export default getStandardProps;