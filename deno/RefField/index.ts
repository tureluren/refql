import { refqlType } from "../common/consts.ts";
import { Boxes } from "../common/BoxRegistry.ts";
import Table from "../Table/index.ts";

interface RefField {
  name: string;
  as: string;
  toString(): string;
}

const type = "refql/Ref";

const prototype = {
  [refqlType]: type,
  constructor: RefField,
  toString
};

function RefField(name: string, as: string) {
  let ref: RefField = Object.create (prototype);

  ref.name = name;
  ref.as = as;

  return ref;
}

function toString(this: RefField) {
  return `${this.name} ${this.as}`;
}

RefField.isRefField = function (x: any): x is RefField {
  return x != null && x[refqlType] === type;
};

RefField.refFieldOf = function (as: string) {
  return <Box extends Boxes>(table: Table<Box>, kw: string, ref: string) =>
    RefField (
      `${table.name}.${ref.trim ()}`,
      `${(as).replace (/_/g, "").toLowerCase ()}${kw}`
    );
};

export default RefField;