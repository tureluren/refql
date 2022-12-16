import Table from ".";
import { RefInfo, RefInfoInput } from "../common/types";
import { ASTNode, HasMany, Ref } from "../nodes";
import RQLTag from "../RQLTag";

const hasMany = (table: string, info?: Omit<RefInfoInput, "lxRef" | "rxRef" | "xTable">) => {
  const hasManyInfo = info || {};
  const child = Table (table);

  const makeHasMany = (parent: Table, tag: RQLTag<unknown>, as?: string) => {
    as = as || hasManyInfo.as || `${child.name}s`;
    const refOf = Ref.refOf (as);

    return HasMany (
      {
        as,
        lRef: refOf (parent, "lref", hasManyInfo.lRef || "id"),
        rRef: refOf (child, "rref", hasManyInfo.rRef || `${parent.name}_id`)
      },
      tag
    );
  };

  return [child, makeHasMany];
};

export default hasMany;