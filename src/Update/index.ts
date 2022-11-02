import { refqlType } from "../common/consts";
import { StringMap } from "../common/types";
import Table from "../Table";

interface Update {
  table: Table;
  columns: string[];
  data: StringMap;
  compile(paramIdx?: number): [string, any[]];
}

const updateType = "refql/Update";

const prototype = {
  constructor: Update,
  [refqlType]: updateType,
  compile, toString
};

function Update(table: Table, columns: string[], data: StringMap) {
  let update: Update = Object.create (prototype);
  update.table = table;
  update.columns = columns || [];
  update.data = data || {};

  return update;
}

function compile(this: Update, paramIdx = 0) {
  const values: any[] = [];

  const KeyValues = this.columns
    .map (c => {
      values.push (this.data[c]);
      return `${c} = $${paramIdx + values.length}`;
    })
    .join (", ");

  const updateStr = `update ${this.table.compile ()[0]} set ${KeyValues}`;

  return [updateStr, values];
}

Update.isUpdate = function (value: any): value is Update {
  return value != null && value[refqlType] === updateType;
};

export default Update;