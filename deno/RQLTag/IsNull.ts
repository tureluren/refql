import { refqlType } from "../common/consts.ts";
import { SQLTag } from "../SQLTag/index.ts";
import Raw from "../SQLTag/Raw.ts";
import { sqlX } from "../SQLTag/sql.ts";
import Operation, { operationPrototype } from "./Operation.ts";

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

function interpret(this: IsNull, col: Raw | SQLTag, displayAnd: boolean) {
  const { notIsNull } = this;
  const equality = notIsNull ? "is not null" : "is null";

  return sqlX`
    ${Raw (displayAnd ? "and " : "")}${col} ${Raw (equality)}
  `;
}

IsNull.isNull = function (x: any): x is IsNull {
  return x != null && x[refqlType] === type;
};

export default IsNull;