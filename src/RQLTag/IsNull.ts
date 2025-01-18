import { refqlType } from "../common/consts";
import Operation from "../Table/Operation";
import RQLNode, { rqlNodePrototype } from "./RQLNode";

interface IsNull<Params = any> extends RQLNode, Operation<Params> {
  params: Params;
  notIsNull: boolean;
}

const type = "refql/IsNull";

const prototype = Object.assign ({}, rqlNodePrototype, {
  constructor: IsNull,
  [refqlType]: type,
  precedence: 1
});

function IsNull<Params>(notIsNull = false) {
  let isNull: IsNull<Params> = Object.create (prototype);

  isNull.notIsNull = notIsNull;

  return isNull;
}

IsNull.isNull = function <Params = any> (x: any): x is IsNull<Params> {
  return x != null && x[refqlType] === type;
};

export default IsNull;