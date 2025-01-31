import { refqlType } from "../common/consts";
import { TagFunctionVariable } from "../common/types";
import { SQLTag } from "../SQLTag";
import Raw from "../SQLTag/Raw";
import { sqlP } from "../SQLTag/sql";
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

function IsNull<Params>(pred?: TagFunctionVariable<Params, boolean>, notIsNull = false) {
  let isNull: IsNull<Params> = Object.create (prototype);

  if (pred) {
    isNull.pred = pred;
  }

  isNull.notIsNull = notIsNull;

  return isNull;
}

function interpret(this: IsNull, col: Raw | SQLTag) {
  const { notIsNull, pred } = this;
  const equality = notIsNull ? "is not null" : "is null";

  return sqlP (pred)`
    and ${col} ${Raw (equality)}
  `;
}

IsNull.isNull = function <Params = any> (x: any): x is IsNull<Params> {
  return x != null && x[refqlType] === type;
};

export default IsNull;