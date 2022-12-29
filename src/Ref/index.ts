import { refqlType } from "../common/consts";
import Table from "../Table";

interface Ref {
  name: string;
  as: string;
  toString(): string;
}

const type = "refql/Ref";

const prototype = {
  [refqlType]: type,
  constructor: Ref,
  toString
};

function Ref(name: string, as: string) {
  let ref: Ref = Object.create (prototype);

  ref.name = name;
  ref.as = as;

  return ref;
}

function toString(this: Ref) {
  return `${this.name} ${this.as}`;
}

Ref.isRef = function (value: any): value is Ref {
  return value != null && value[refqlType] === type;
};

Ref.refOf = function (as: string) {
  return (table: Table, kw: string, ref: string) =>
    Ref (
      `${table.name}.${ref.trim ()}`,
      `${(as).replace (/_/g, "").toLowerCase ()}${kw}`
    );
};

export default Ref;