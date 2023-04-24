import { refqlType } from "../common/consts";

interface All<Type = unknown> {
  type: Type;
}

const type = "refql/All";

const prototype = {
  constructor: All,
  [refqlType]: type
};

function All<Type = unknown>() {
  let all: All<Type> = Object.create (prototype);

  return all;
}







// Field.isField = function (x: any): x is Field {
//   return x != null && x[refqlType] === type;
// };

export default All;