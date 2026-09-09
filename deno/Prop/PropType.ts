import copyObj from "../common/copyObj.ts";

const PropTypeSymbol: unique symbol = Symbol ("@@PropType");

interface PropType<As extends string> {
  as: As;
  tableName?: string;
  setTableName (tableName: string): PropType<As>;
  [PropTypeSymbol]: true;
}

export const propTypePrototype = {
  [PropTypeSymbol]: true,
  setTableName
};

function setTableName<As extends string>(this: PropType<As>, tableName: string) {
  let propType = copyObj (this);

  propType.tableName = tableName;

  return propType;
}

export default PropType;