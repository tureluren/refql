import { refqlType } from "../common/consts";
import { SQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import { sqlX } from "../SQLTag/sql";
import Operation, { operationPrototype } from "./Operation";

interface IsNull<Params = any> extends Operation<Params> {
  notIsNull: boolean;
}

const type = "refql/IsNull";

const prototype = Object.assign ({}, operationPrototype, {
  constructor: IsNull,
  [refqlType]: type,
  interpret
});

function IsNull<Params>(notIsNull = false) {
  let isNull: IsNull<Params> = Object.create (prototype);

  isNull.notIsNull = notIsNull;

  return isNull;
}

function interpret(this: IsNull, col: Raw | SQLTag) {
  const { notIsNull } = this;
  const equality = notIsNull ? "is not null" : "is null";

  return sqlX`
    and ${col} ${Raw (equality)}
  `;
}

IsNull.isNull = function <Params = any> (x: any): x is IsNull<Params> {
  return x != null && x[refqlType] === type;
};

export default IsNull;