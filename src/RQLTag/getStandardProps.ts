import RefProp from "../Prop/RefProp";
import { isSQLTag } from "../SQLTag";
import Table from "../Table";

const getStandardProps = (table: Table) =>
  Object.keys (table.props)
    .filter (p => !RefProp.isRefProp (table.props[p]) && !isSQLTag (table.props[p].col))
    .map (k => ({ col: table.props[k].col, as: table.props[k].as }));

export default getStandardProps;