import Table from ".";
import { RefInfo, RefInfoInput } from "../common/types";
import { ASTNode, BelongsTo, Ref } from "../nodes";
import RQLTag from "../RQLTag";

const belongsTo = (table: string, info?: Omit<RefInfoInput, "lxRef" | "rxRef" | "xTable">) => {
  const belongsToInfo = info || {};
  const child = Table (table);

  const makeBelongsTo = (parent: Table, tag: RQLTag<unknown>, as?: string) => {
    as = as || belongsToInfo.as || child.name;
    const refOf = Ref.refOf (as);

    return BelongsTo (
      {
        as,
        lRef: refOf (parent, "lref", belongsToInfo.lRef || `${child.name}_id`),
        rRef: refOf (child, "rref", belongsToInfo.rRef || "id")
      },
      tag
    );
  };

  return [child, makeBelongsTo];
};

export default belongsTo;